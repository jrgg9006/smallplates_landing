'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import type { BookStatus } from '@/lib/types/database';
import type { BookSummary } from './BookCard';
import RecipePreviewCard from './RecipePreviewCard';
import BookReviewOverlay from './BookReviewOverlay';

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
  };
  contributors: Contributor[];
  owners: Member[];
  captains: Member[];
  recipes: RecipeData[];
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

export default function BookDetailSheet({ book, open, onOpenChange, onStatusChange }: BookDetailSheetProps) {
  const [detail, setDetail] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recipesExpanded, setRecipesExpanded] = useState(true);
  const [contributorsExpanded, setContributorsExpanded] = useState(false);
  const [membersExpanded, setMembersExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [reviewOverlayOpen, setReviewOverlayOpen] = useState(false);
  // Reason: cache-busting for images — Supabase storage URLs stay the same after re-upload
  const [fetchTimestamp, setFetchTimestamp] = useState(Date.now());

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
      setRecipesExpanded(false);
    } else {
      setDetail(null);
    }
  }, [open, book, fetchDetail]);

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

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 pb-28">
              {/* Recipes */}
              <Section
                title={`Recipes (${detail.recipes.length})`}
                collapsible
                expanded={recipesExpanded}
                onToggle={() => setRecipesExpanded(!recipesExpanded)}
              >
                {recipesExpanded && (
                  <div className="space-y-2">
                    {detail.recipes.map(r => (
                      <RecipePreviewCard key={r.id} recipe={r} groupId={detail.group.id} />
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
                                <span className="text-xs text-gray-500">{c.recipes_received} recipe{c.recipes_received !== 1 ? 's' : ''}</span>
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
                {currentStatus !== 'inactive' && (
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
                    onClick={() => setReviewOverlayOpen(true)}
                    disabled={detail.recipes.length === 0}
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
                ) : nextStatus ? (
                  <Button
                    size="sm"
                    onClick={() => changeStatus(nextStatus)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Move to {STATUS_LABELS[nextStatus]}
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Book Review Overlay */}
            {reviewOverlayOpen && (
              <BookReviewOverlay
                groupId={detail.group.id}
                coupleName={detail.group.couple_display_name}
                recipes={detail.recipes}
                imageCacheBuster={fetchTimestamp}
                onClose={() => {
                  setReviewOverlayOpen(false);
                  if (book) fetchDetail(book.id);
                }}
                onReviewComplete={onStatusChange}
              />
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
