'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X, Loader2, ChevronDown, ChevronRight, Upload } from 'lucide-react';
import type { BookStatus } from '@/lib/types/database';
import type { BookSummary } from './BookCard';
import RecipePreviewCard from './RecipePreviewCard';
import BookReviewOverlay from './BookReviewOverlay';
import { annexRowState, annexUpscaleCounts } from '@/lib/annex/selection';

interface Contributor {
  id: string;
  first_name: string;
  last_name: string;
  printed_name: string | null;
  recipes_received: number;
}

interface Member {
  profile_id: string;
  role: string;
  printed_name: string | null;
  profile_name: string | null;
  profile_email: string | null;
}

interface RecipeData {
  id: string;
  recipe_name: string;
  ingredients: string;
  instructions: string;
  comments: string | null;
  guest_id: string;
  guest_name: string;
  image_url: string | null;
  generated_image_url: string | null;
  generated_image_url_print: string | null;
  image_upscale_status: string | null;
  document_urls: string[] | null;
  upload_method: string | null;
  raw_recipe_text: string | null;
  has_print_ready: boolean;
  print_ready: {
    recipe_name_clean: string;
    ingredients_clean: string;
    instructions_clean: string;
    note_clean: string | null;
    cleaning_version: number;
  } | null;
  needs_review: boolean;
  book_review_status: string;
  book_review_notes: string | null;
  annex_source_urls?: string[];
  annex_reviewed?: boolean;
}

interface ArchivedRecipe {
  id: string;
  recipe_name: string;
  guest_name: string;
  removed_at: string;
  removed_by_name: string | null;
}

interface BookDetail {
  group: {
    id: string;
    name: string;
    couple_display_name: string;
    couple_first_name: string | null;
    couple_last_name: string | null;
    partner_first_name: string | null;
    partner_last_name: string | null;
    wedding_date: string | null;
    book_status: BookStatus;
    book_reviewed_by: string | null;
    book_reviewed_at: string | null;
    book_notes: string | null;
    book_closed_by_user: string | null;
    print_couple_name: string | null;
    couple_image_url: string | null;
    print_details_confirmed_at: string | null;
  };
  contributors: Contributor[];
  owners: Member[];
  captains: Member[];
  recipes: RecipeData[];
  archived_recipes: ArchivedRecipe[];
}

const STATUS_LABELS: Record<BookStatus, string> = {
  active: 'Active',
  reviewed: 'In Review',
  ready_to_print: 'Ready to Print',
  printed: 'Printed',
  inactive: 'Inactive',
};

const STATUS_COLORS: Record<BookStatus, string> = {
  active: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-amber-100 text-amber-800',
  ready_to_print: 'bg-green-100 text-green-800',
  printed: 'bg-gray-100 text-gray-600',
  inactive: 'bg-gray-100 text-gray-500',
};

const NEXT_STATUS: Record<BookStatus, BookStatus | null> = {
  active: 'reviewed',
  reviewed: 'ready_to_print',
  ready_to_print: 'printed',
  printed: null,
  inactive: null,
};

const PREV_STATUS: Record<BookStatus, BookStatus | null> = {
  active: null,
  reviewed: 'active',
  ready_to_print: 'reviewed',
  printed: 'ready_to_print',
  inactive: null,
};

interface BookDetailSheetProps {
  book: BookSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: () => void;
}

// Reason: judge print quality off the shorter edge (the conservative dimension).
// ~1800px short edge ≈ 6in at 300dpi — safe for a cover photo. Below ~1200px
// the photo will look soft in print, so flag it to request the original.
function getPhotoPrintQuality(dims: { width: number; height: number }): {
  tone: 'good' | 'warn' | 'bad';
  label: string;
  hint: string;
} {
  const shortEdge = Math.min(dims.width, dims.height);
  if (shortEdge >= 1800) {
    return { tone: 'good', label: 'Print-ready', hint: 'Good resolution for print.' };
  }
  if (shortEdge >= 1200) {
    return {
      tone: 'warn',
      label: 'Low for print',
      hint: 'Usable at small size. Request the original if you can.',
    };
  }
  return {
    tone: 'bad',
    label: 'Too small for print',
    hint: 'Will look soft. Ask for the original file (sent as a document, not a photo).',
  };
}

const PHOTO_QUALITY_TONE: Record<'good' | 'warn' | 'bad', string> = {
  good: 'bg-green-50 text-green-700 border-green-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  bad: 'bg-red-50 text-red-700 border-red-200',
};

export default function BookDetailSheet({ book, open, onOpenChange, onStatusChange }: BookDetailSheetProps) {
  const [detail, setDetail] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recipesExpanded, setRecipesExpanded] = useState(true);
  const [contributorsExpanded, setContributorsExpanded] = useState(false);
  const [membersExpanded, setMembersExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [reviewOverlayOpen, setReviewOverlayOpen] = useState(false);
  // Reason: book-level upscale of selected originals — rows come from GET /annex (carries
  // upscale_status), polled while any is in flight. Drives the button + the pre-export warning.
  const [annexRows, setAnnexRows] = useState<{ upscale_status: string | null }[]>([]);
  const [annexUpscaling, setAnnexUpscaling] = useState(false);
  const [annexPolling, setAnnexPolling] = useState(false);
  const [showFetchWarn, setShowFetchWarn] = useState(false);
  const [reviewStartIndex, setReviewStartIndex] = useState<number | undefined>(undefined);
  // Reason: cache-busting for images — Supabase storage URLs stay the same after re-upload
  const [fetchTimestamp, setFetchTimestamp] = useState(Date.now());

  const coupleImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCoupleImage, setUploadingCoupleImage] = useState(false);
  // Reason: measure the couple photo's real pixel size so the admin can judge
  // print quality before the book goes out — WhatsApp photos arrive downscaled.
  const [coupleImageDims, setCoupleImageDims] = useState<{ width: number; height: number } | null>(null);

  const fetchDetail = useCallback(async (groupId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/books/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
        setNotesValue(data.group.book_notes || '');
        setFetchTimestamp(Date.now());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && book) {
      fetchDetail(book.id);
      setEditingField(null);
      setEditingNotes(false);
      setRecipesExpanded(true);
    } else {
      setDetail(null);
    }
  }, [open, book, fetchDetail]);

  const annexCounts = annexUpscaleCounts(annexRows);

  const loadAnnexRows = useCallback(async (groupId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/books/${groupId}/annex`);
      if (!res.ok) return;
      const { annex_images } = (await res.json()) as {
        annex_images: { upscale_status: string | null }[];
      };
      setAnnexRows((annex_images ?? []).map((r) => ({ upscale_status: r.upscale_status ?? null })));
    } catch {
      // Swallow transient errors; polling/next load will retry.
    }
  }, []);

  useEffect(() => {
    // Reason: refresh annex upscale status when the sheet opens and whenever the review
    // overlay closes (the admin may have marked new originals in there).
    if (open && book && !reviewOverlayOpen) {
      loadAnnexRows(book.id);
    }
  }, [open, book, reviewOverlayOpen, loadAnnexRows]);

  const triggerUpscale = useCallback(async () => {
    if (!book) return;
    setAnnexUpscaling(true);
    try {
      const res = await fetch(`/api/v1/admin/books/${book.id}/annex/upscale`, { method: 'POST' });
      if (!res.ok) {
        alert('No se pudo iniciar el upscale');
        setAnnexUpscaling(false);
        return;
      }
      await loadAnnexRows(book.id);
      setAnnexPolling(true);
    } catch {
      alert('No se pudo iniciar el upscale');
      setAnnexUpscaling(false);
    }
  }, [book, loadAnnexRows]);

  useEffect(() => {
    if (!annexPolling || !book) return;
    const startedAt = Date.now();
    const TIMEOUT_MS = 90_000;
    const intervalId = setInterval(async () => {
      if (Date.now() - startedAt >= TIMEOUT_MS) {
        setAnnexPolling(false);
        setAnnexUpscaling(false);
        clearInterval(intervalId);
        return;
      }
      await loadAnnexRows(book.id);
    }, 2_000);
    return () => clearInterval(intervalId);
  }, [annexPolling, book, loadAnnexRows]);

  useEffect(() => {
    if (!annexPolling) return;
    if (annexCounts.processing === 0) {
      setAnnexPolling(false);
      setAnnexUpscaling(false);
    }
  }, [annexCounts.processing, annexPolling]);

  const copyFetchCommand = useCallback(() => {
    if (!detail) return;
    const cmd = `node scripts/indesign/fetch-book.js ${detail.group.id}`;
    navigator.clipboard.writeText(cmd);
    alert('Copied to clipboard:\n' + cmd);
  }, [detail]);

  // Reason: load the couple image off-screen to read its natural pixel size.
  // Keyed on the URL (which carries a cache-buster on re-upload), so it re-measures
  // whenever the photo changes.
  const coupleImageUrl = detail?.group.couple_image_url || null;

  // Reason: book-level checklist of originals review — surfaces how many photo recipes
  // still need a look so nothing slips. Derived, no DB state.
  const annexSummary = (detail?.recipes ?? []).reduce(
    (acc, r) => {
      const { state } = annexRowState(
        r.document_urls,
        r.image_url,
        r.annex_source_urls ?? null,
        r.annex_reviewed ?? false
      );
      if (state === 'none') return acc;
      acc.withPhoto += 1;
      if (state === 'selected') acc.withOriginal += 1;
      else acc.unreviewed += 1;
      return acc;
    },
    { withPhoto: 0, withOriginal: 0, unreviewed: 0 }
  );
  useEffect(() => {
    if (!coupleImageUrl) {
      setCoupleImageDims(null);
      return;
    }
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) setCoupleImageDims({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      if (!cancelled) setCoupleImageDims(null);
    };
    img.src = coupleImageUrl;
    return () => {
      cancelled = true;
    };
  }, [coupleImageUrl]);

  const patchBook = async (body: Record<string, unknown>) => {
    if (!book) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchDetail(book.id);
        onStatusChange();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || 'Something went wrong');
      }
    } finally {
      setSaving(false);
    }
  };

  const saveGroupField = async (field: string, value: string) => {
    await patchBook({ group_updates: { [field]: value || null } });
    setEditingField(null);
  };

  const saveNotes = async () => {
    await patchBook({ group_updates: { book_notes: notesValue || null } });
    setEditingNotes(false);
  };

  const saveContributorName = async (guestId: string, printedName: string) => {
    await patchBook({ contributor_updates: [{ guest_id: guestId, printed_name: printedName }] });
    setEditingField(null);
  };

  const saveMemberName = async (profileId: string, printedName: string) => {
    await patchBook({ member_updates: [{ profile_id: profileId, printed_name: printedName }] });
    setEditingField(null);
  };

  const changeStatus = async (newStatus: BookStatus) => {
    await patchBook({ book_status: newStatus });
  };

  // Reason: admin uploads the couple photo on the user's behalf (sent via
  // WhatsApp). Posts to the admin route, which writes couple_image_url just like
  // the user flow would.
  const handleCoupleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file || !book) return;

    setUploadingCoupleImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`/api/v1/admin/books/${book.id}`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await fetchDetail(book.id);
        onStatusChange();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || 'Failed to upload photo');
      }
    } finally {
      setUploadingCoupleImage(false);
    }
  };

  const currentStatus = detail?.group.book_status || 'active';
  const nextStatus = NEXT_STATUS[currentStatus];
  const prevStatus = PREV_STATUS[currentStatus];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[85vw] max-w-[85vw] sm:max-w-[85vw] overflow-y-auto p-0"
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <SheetTitle className="sr-only">Loading book details</SheetTitle>
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : detail ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-3 mb-1">
                    <SheetTitle className="text-xl">
                      {editingField === 'couple_display_name' ? (
                        <InlineEdit
                          value={editValue}
                          onChange={setEditValue}
                          onSave={() => saveGroupField('couple_display_name', editValue)}
                          onCancel={() => setEditingField(null)}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-blue-600 inline-flex items-center gap-1"
                          onClick={() => {
                            setEditingField('couple_display_name');
                            setEditValue(detail.group.couple_display_name);
                          }}
                        >
                          {detail.group.couple_display_name}
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        </span>
                      )}
                    </SheetTitle>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[currentStatus]}`}>
                      {STATUS_LABELS[currentStatus]}
                    </span>
                  </div>
                  <SheetDescription className="text-sm">
                    {editingField === 'wedding_date' ? (
                      <InlineEdit
                        value={editValue}
                        onChange={setEditValue}
                        onSave={() => saveGroupField('wedding_date', editValue)}
                        onCancel={() => setEditingField(null)}
                        type="date"
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:text-blue-600 inline-flex items-center gap-1"
                        onClick={() => {
                          setEditingField('wedding_date');
                          setEditValue(detail.group.wedding_date || '');
                        }}
                      >
                        {detail.group.wedding_date
                          ? new Date(detail.group.wedding_date).toLocaleDateString('en-US', {
                              month: 'long', day: 'numeric', year: 'numeric'
                            })
                          : 'No wedding date'}
                        <Pencil className="w-3 h-3 text-gray-400" />
                      </span>
                    )}
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="font-mono text-xs text-gray-400">{detail.group.id}</span>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Closed by user badge */}
            {detail.group.book_closed_by_user && (
              <div className="px-6 pt-3">
                <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded bg-amber-100 text-amber-700">
                  Closed by user on {new Date(detail.group.book_closed_by_user).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 pb-28">
              {/* Print Details — couple name & photo confirmed by user */}
              <Section title="Print Details" collapsible expanded={true} onToggle={() => {}}>
                <div className="space-y-3">
                  {detail.group.print_details_confirmed_at ? (
                    <p className="text-[10px] text-green-600 font-medium uppercase tracking-wide">
                      Confirmed by user on {new Date(detail.group.print_details_confirmed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">
                      Not yet confirmed by user
                    </p>
                  )}
                  <div className="flex items-start gap-4">
                    {/* Couple photo — admin can upload/replace on the user's behalf */}
                    <div className="shrink-0">
                      <input
                        ref={coupleImageInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={handleCoupleImageUpload}
                      />
                      <button
                        type="button"
                        onClick={() => coupleImageInputRef.current?.click()}
                        disabled={uploadingCoupleImage}
                        title={detail.group.couple_image_url ? 'Replace photo' : 'Upload photo'}
                        className="group relative w-20 h-20 rounded-lg overflow-hidden block disabled:opacity-60"
                      >
                        {detail.group.couple_image_url ? (
                          <div className="relative w-20 h-20 border border-gray-200 rounded-lg overflow-hidden">
                            <Image
                              src={detail.group.couple_image_url}
                              alt="Couple photo"
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                            <span className="text-[10px] text-gray-400 text-center leading-tight">No<br />photo</span>
                          </div>
                        )}
                        {/* Hover/upload overlay */}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          {uploadingCoupleImage ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </span>
                        {uploadingCoupleImage && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white rounded-lg">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </span>
                        )}
                      </button>
                      <p className="mt-1 text-center text-[10px] text-gray-400">
                        {detail.group.couple_image_url ? 'Click to replace' : 'Click to upload'}
                      </p>
                    </div>
                    {/* Name for print */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Name on book</p>
                      <p className="text-base font-serif text-gray-900">
                        {detail.group.print_couple_name || <span className="text-gray-400 italic">Not set</span>}
                      </p>
                      {detail.group.print_couple_name && detail.group.couple_display_name &&
                        detail.group.print_couple_name !== detail.group.couple_display_name && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          Display name: {detail.group.couple_display_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Photo print-quality check — flags low-res photos before the
                      book is sent to print (WhatsApp photos arrive downscaled). */}
                  {detail.group.couple_image_url && coupleImageDims && (() => {
                    const q = getPhotoPrintQuality(coupleImageDims);
                    return (
                      <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${PHOTO_QUALITY_TONE[q.tone]}`}>
                        <span className="text-xs font-semibold">{q.label}</span>
                        <span className="text-[11px] tabular-nums opacity-80">
                          {coupleImageDims.width} × {coupleImageDims.height}px
                        </span>
                        <span className="text-[11px] opacity-90">— {q.hint}</span>
                      </div>
                    );
                  })()}
                </div>
              </Section>

              {/* Recipes */}
              <Section
                title={`Recipes (${detail.recipes.length})`}
                collapsible
                expanded={recipesExpanded}
                onToggle={() => setRecipesExpanded(!recipesExpanded)}
              >
                {recipesExpanded && (
                  <div className="space-y-2">
                    {annexSummary.withPhoto > 0 && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-1 text-[11px] text-gray-500">
                        <span>📷 {annexSummary.withPhoto} con foto</span>
                        <span className="text-emerald-600">✓ {annexSummary.withOriginal} con original</span>
                        {annexSummary.unreviewed > 0 && (
                          <span className="text-amber-600 font-medium">
                            ⚠ {annexSummary.unreviewed} sin revisar
                          </span>
                        )}
                      </div>
                    )}
                    {detail.recipes.map((r, i) => (
                      <RecipePreviewCard
                        key={r.id}
                        recipe={r}
                        groupId={detail.group.id}
                        onReview={() => {
                          setReviewStartIndex(i);
                          setReviewOverlayOpen(true);
                        }}
                      />
                    ))}
                    {detail.recipes.length === 0 && (
                      <p className="text-sm text-gray-400 italic py-2">No recipes yet</p>
                    )}
                  </div>
                )}
              </Section>

              {/* Contributors */}
              <Section title={`Contributors (${detail.contributors.length})`} collapsible expanded={contributorsExpanded} onToggle={() => setContributorsExpanded(!contributorsExpanded)}>
                {contributorsExpanded && (
                  <div className="space-y-1">
                    {detail.contributors.map(c => {
                      const displayName = c.printed_name || `${c.first_name} ${c.last_name}`.trim();
                      const editKey = `contributor-${c.id}`;
                      return (
                        <div key={c.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
                          {editingField === editKey ? (
                            <InlineEdit
                              value={editValue}
                              onChange={setEditValue}
                              onSave={() => saveContributorName(c.id, editValue)}
                              onCancel={() => setEditingField(null)}
                            />
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-900">{displayName}</span>
                                {c.printed_name && (
                                  <span className="text-[10px] text-gray-400">
                                    (orig: {c.first_name} {c.last_name})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-secondary-sm text-gray-500">{c.recipes_received} recipe{c.recipes_received !== 1 ? 's' : ''}</span>
                                <button
                                  onClick={() => {
                                    setEditingField(editKey);
                                    setEditValue(c.printed_name || `${c.first_name} ${c.last_name}`.trim());
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                    {detail.contributors.length === 0 && (
                      <p className="text-sm text-gray-400 italic py-2">No contributors yet</p>
                    )}
                  </div>
                )}
              </Section>

              {/* Owners & Captains */}
              <Section title={`Owners & Captains (${detail.owners.length + detail.captains.length})`} collapsible expanded={membersExpanded} onToggle={() => setMembersExpanded(!membersExpanded)}>
                {membersExpanded && (
                  <div className="space-y-1">
                    {[...detail.owners, ...detail.captains].map(m => {
                      const displayName = m.printed_name || m.profile_name || m.profile_email || 'Unknown';
                      const editKey = `member-${m.profile_id}`;
                      const roleLabel = m.role === 'owner' ? 'Owner' : 'Captain';
                      return (
                        <div key={m.profile_id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
                          {editingField === editKey ? (
                            <InlineEdit
                              value={editValue}
                              onChange={setEditValue}
                              onSave={() => saveMemberName(m.profile_id, editValue)}
                              onCancel={() => setEditingField(null)}
                            />
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-900">{displayName}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  m.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {roleLabel}
                                </span>
                                {m.printed_name && m.profile_name && (
                                  <span className="text-[10px] text-gray-400">
                                    (profile: {m.profile_name})
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setEditingField(editKey);
                                  setEditValue(m.printed_name || m.profile_name || '');
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>

              {/* Admin Notes */}
              <Section title="Admin Notes" collapsible expanded={notesExpanded} onToggle={() => setNotesExpanded(!notesExpanded)}>
                {notesExpanded && (editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full border rounded-md p-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveNotes} disabled={saving}>
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingNotes(false);
                        setNotesValue(detail.group.book_notes || '');
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-sm text-gray-700 whitespace-pre-line cursor-pointer hover:bg-gray-50 p-2 rounded min-h-[40px]"
                    onClick={() => setEditingNotes(true)}
                  >
                    {detail.group.book_notes || (
                      <span className="text-gray-400 italic">Click to add notes...</span>
                    )}
                  </div>
                ))}
              </Section>

              {/* Archived Recipes */}
              {detail.archived_recipes.length > 0 && (
                <Section
                  title={`Archived Recipes (${detail.archived_recipes.length})`}
                  collapsible
                  expanded={archivedExpanded}
                  onToggle={() => setArchivedExpanded(!archivedExpanded)}
                >
                  {archivedExpanded && (
                    <div className="space-y-1">
                      {detail.archived_recipes.map(ar => (
                        <div key={ar.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-orange-50">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm text-gray-900 truncate">{ar.recipe_name}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">by {ar.guest_name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 text-xs text-gray-400">
                            <span>
                              {new Date(ar.removed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {ar.removed_by_name && (
                              <span>· removed by {ar.removed_by_name}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="border-t bg-white px-6 py-4 flex items-center justify-between sticky bottom-0">
              <div className="flex gap-2">
                {prevStatus && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeStatus(prevStatus)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Move back to {STATUS_LABELS[prevStatus]}
                  </Button>
                )}
                {currentStatus === 'inactive' && (
                  <Button
                    size="sm"
                    onClick={() => changeStatus('active')}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Reactivate
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {currentStatus === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeStatus('inactive')}
                    disabled={saving}
                    className="text-gray-500"
                  >
                    Mark Inactive
                  </Button>
                )}
                {/* Reason: active and in-review books go through recipe-by-recipe review overlay */}
                {currentStatus === 'active' ? (
                  <Button
                    size="sm"
                    onClick={async () => {
                      // Reason: explicitly move the book into 'reviewed' (In Review column) when admin starts the review.
                      // The PATCH endpoint also re-evaluates per-recipe status, but the explicit transition guarantees the kanban moves.
                      await patchBook({ book_status: 'reviewed' });
                      setReviewOverlayOpen(true);
                    }}
                    disabled={detail.recipes.length === 0 || saving}
                  >
                    Start Book Review ({detail.recipes.length} recipes)
                  </Button>
                ) : currentStatus === 'reviewed' ? (
                  <Button
                    size="sm"
                    onClick={() => setReviewOverlayOpen(true)}
                    disabled={detail.recipes.length === 0}
                  >
                    Continue Review ({detail.recipes.length} recipes)
                  </Button>
                ) : (
                  <>
                    {annexCounts.selected > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          annexCounts.notReady === 0
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-brand-honey text-brand-honey hover:bg-brand-honey/10'
                        }
                        disabled={annexUpscaling || annexCounts.processing > 0 || annexCounts.notReady === 0}
                        onClick={triggerUpscale}
                      >
                        {(annexUpscaling || annexCounts.processing > 0) ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            Procesando… ({annexCounts.ready}/{annexCounts.selected})
                          </>
                        ) : annexCounts.notReady === 0 ? (
                          '✓ Originals listos'
                        ) : (
                          `Upscale originals (${annexCounts.notReady})`
                        )}
                      </Button>
                    )}
                    {currentStatus === 'ready_to_print' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-500"
                        onClick={() => {
                          // Reason: don't hard-block — warn if there are selected originals not yet
                          // upscaled, then let the admin proceed anyway.
                          if (annexCounts.notReady > 0) {
                            setShowFetchWarn(true);
                          } else {
                            copyFetchCommand();
                          }
                        }}
                      >
                        Copy Fetch Command
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewOverlayOpen(true)}
                      disabled={detail.recipes.length === 0}
                    >
                      Preview Book ({detail.recipes.length} recipes)
                    </Button>
                    {nextStatus && (
                      <Button
                        size="sm"
                        onClick={() => changeStatus(nextStatus)}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                        Move to {STATUS_LABELS[nextStatus]}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Book Review Overlay */}
            {reviewOverlayOpen && (
              <BookReviewOverlay
                groupId={detail.group.id}
                coupleName={detail.group.couple_display_name}
                recipes={detail.recipes}
                imageCacheBuster={fetchTimestamp}
                initialIndex={reviewStartIndex}
                onClose={() => {
                  setReviewOverlayOpen(false);
                  setReviewStartIndex(undefined);
                  if (book) fetchDetail(book.id);
                }}
                onReviewComplete={onStatusChange}
              />
            )}

            {showFetchWarn && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-900">Originals sin procesar</h3>
                  <p className="mt-3 text-sm text-gray-600">
                    Hay {annexCounts.notReady} foto(s) marcada(s) como original que todavía no pasaron
                    por upscale (alta resolución). Si generas el libro ahora, esas imágenes saldrán en
                    baja calidad o no se incluirán. Te recomiendo correr &quot;Upscale originals&quot;
                    antes.
                  </p>
                  <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" size="sm" onClick={() => setShowFetchWarn(false)}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="bg-brand-honey text-white hover:bg-brand-honey/90"
                      onClick={() => {
                        copyFetchCommand();
                        setShowFetchWarn(false);
                      }}
                    >
                      Avanzar de todos modos
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <SheetTitle className="sr-only">Book details</SheetTitle>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Section wrapper
function Section({
  title, children, collapsible, expanded, onToggle,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div>
      <h3
        className={`text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2 ${
          collapsible ? 'cursor-pointer hover:text-gray-900 flex items-center gap-1' : ''
        }`}
        onClick={collapsible ? onToggle : undefined}
      >
        {collapsible && (
          expanded
            ? <ChevronDown className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />
        )}
        {title}
      </h3>
      {children}
    </div>
  );
}

// Inline edit helper
function InlineEdit({
  value, onChange, onSave, onCancel, type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  type?: 'text' | 'date';
}) {
  return (
    <div className="flex items-center gap-1 flex-1">
      <input
        type={type}
        className="border rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave();
          if (e.key === 'Escape') onCancel();
        }}
        autoFocus
      />
      <button onClick={onSave} className="p-1 text-green-600 hover:text-green-800">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
