'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdminEmail } from '@/lib/config/admin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ShowcaseRecipe {
  guest_id: string;
  guest_name: string;
  guest_email: string;
  notify_email: string | null;
  group_id: string | null;
  group_name: string | null;
  couple_display_name: string | null;
  book_status: string | null;
  book_close_date: string | null;
  is_sendable: boolean;
  recipe_id: string;
  recipe_name: string;
  showcase_image_url: string | null;
  sent_at: string | null;
}

interface GuestGroup {
  guest_id: string;
  guest_name: string;
  guest_email: string;
  group_id: string | null;
  group_name: string | null;
  couple_display_name: string | null;
  book_status: string | null;
  book_close_date: string | null;
  is_sendable: boolean;
  recipes: Array<{
    recipe_id: string;
    recipe_name: string;
    showcase_image_url: string | null;
    sent_at: string | null;
  }>;
}

type SendState = 'not_sent' | 'partial' | 'sent';

const getSendState = (guest: GuestGroup): SendState => {
  const sentCount = guest.recipes.filter(r => r.sent_at).length;
  if (sentCount === 0) return 'not_sent';
  if (sentCount === guest.recipes.length) return 'sent';
  return 'partial';
};

const formatDaysAgo = (iso: string | null): string => {
  if (!iso) return '—';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

const BOOK_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  reviewed: 'Reviewed',
  ready_to_print: 'Ready to print',
  printed: 'Printed',
  inactive: 'Inactive',
};

interface GroupOption {
  id: string;
  name: string;
}

export default function ShowcasePage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [recipes, setRecipes] = useState<ShowcaseRecipe[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [waitingExpanded, setWaitingExpanded] = useState(false);
  const [sentExpanded, setSentExpanded] = useState(false);
  const [uploadingRecipeId, setUploadingRecipeId] = useState<string | null>(null);
  const [sendingGuestId, setSendingGuestId] = useState<string | null>(null);
  const [resettingGuestId, setResettingGuestId] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState<GuestGroup | null>(null);
  const [confirmOverride, setConfirmOverride] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingRecipeIds, setGeneratingRecipeIds] = useState<Set<string>>(new Set());
  const [previewRecipe, setPreviewRecipe] = useState<ShowcaseRecipe | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [savingPreview, setSavingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<ShowcaseRecipe | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAndLoad = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdminEmail(user.email)) {
      router.push('/');
      return;
    }
    setIsAdmin(true);
    await fetchData();
    setLoading(false);
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/v1/admin/showcase');
      if (!res.ok) throw new Error('Failed to load showcase data');
      const data = await res.json();
      setRecipes(data.recipes || []);
      setGroups(data.groups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  };

  // Group flat recipes into GuestGroup[]
  const guestGroups = useMemo(() => {
    const map = new Map<string, GuestGroup>();
    for (const r of recipes) {
      let group = map.get(r.guest_id);
      if (!group) {
        group = {
          guest_id: r.guest_id,
          guest_name: r.guest_name,
          guest_email: r.guest_email,
          group_id: r.group_id,
          group_name: r.group_name,
          couple_display_name: r.couple_display_name,
          book_status: r.book_status,
          book_close_date: r.book_close_date,
          is_sendable: r.is_sendable,
          recipes: [],
        };
        map.set(r.guest_id, group);
      }
      group.recipes.push({
        recipe_id: r.recipe_id,
        recipe_name: r.recipe_name,
        showcase_image_url: r.showcase_image_url,
        sent_at: r.sent_at,
      });
    }
    return Array.from(map.values());
  }, [recipes]);

  // Reason: shared filter (search + group) applied before splitting into sections
  const baseFiltered = useMemo(() => {
    return guestGroups.filter(g => {
      if (selectedGroup !== 'all' && g.group_id !== selectedGroup) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const recipeNames = g.recipes.map(r => r.recipe_name).join(' ');
        const haystack = `${g.guest_name} ${g.guest_email} ${recipeNames} ${g.group_name || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [guestGroups, selectedGroup, searchQuery]);

  // Section A: ready to send (book printed + not yet fully sent)
  const readyToSend = useMemo(() => {
    return baseFiltered
      .filter(g => g.is_sendable && getSendState(g) !== 'sent')
      .sort((a, b) => {
        // Reason: oldest closed books float to the top — those are most overdue
        const ad = a.book_close_date ? new Date(a.book_close_date).getTime() : Infinity;
        const bd = b.book_close_date ? new Date(b.book_close_date).getTime() : Infinity;
        return ad - bd;
      });
  }, [baseFiltered]);

  // Section B: waiting for book to be printed.
  // Reason: exclude guests already sent so they only show up in "Already sent",
  // not in two places at once.
  const waitingForBook = useMemo(() => {
    return baseFiltered
      .filter(g => !g.is_sendable && getSendState(g) !== 'sent')
      .sort((a, b) => (a.group_name || '').localeCompare(b.group_name || ''));
  }, [baseFiltered]);

  // Section C: already sent (all recipes that have ever been sent).
  // Reason: dropped the is_sendable check — admins need to know if a guest was
  // already emailed regardless of the book's current status, otherwise they
  // risk double-sending.
  const alreadySent = useMemo(() => {
    return baseFiltered
      .filter(g => getSendState(g) === 'sent')
      .sort((a, b) => {
        const ad = Math.max(...a.recipes.map(r => (r.sent_at ? new Date(r.sent_at).getTime() : 0)));
        const bd = Math.max(...b.recipes.map(r => (r.sent_at ? new Date(r.sent_at).getTime() : 0)));
        return bd - ad;
      });
  }, [baseFiltered]);

  const stats = {
    pending: readyToSend.length,
    waiting: waitingForBook.length,
    sent: alreadySent.length,
  };

  // Reason: find the flat ShowcaseRecipe for per-recipe actions (generate, upload)
  const findRecipe = (recipeId: string): ShowcaseRecipe | undefined =>
    recipes.find(r => r.recipe_id === recipeId);

  const handleGenerate = async (recipeId: string) => {
    const recipe = findRecipe(recipeId);
    if (!recipe) return;

    setGeneratingRecipeIds(prev => {
      const next = new Set(prev);
      next.add(recipeId);
      return next;
    });
    setError(null);

    try {
      // Reason: admin confirmed they accept ~100% of generated spreads,
      // so we skip the preview/confirm dialog and save directly.
      // The "Preview" button on each guest still lets them check the email before sending.
      const res = await fetch(`/api/v1/admin/showcase/preview?recipe_id=${recipeId}`);
      if (!res.ok) throw new Error('Failed to generate spread image');

      const blob = await res.blob();

      const formData = new FormData();
      formData.append('image', blob, 'recipe-spread.png');
      formData.append('recipe_id', recipe.recipe_id);
      formData.append('group_id', recipe.group_id || '');

      const uploadRes = await fetch('/api/v1/admin/showcase/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || 'Save failed');
      }

      const { url } = await uploadRes.json();
      setRecipes(prev =>
        prev.map(r =>
          r.recipe_id === recipe.recipe_id ? { ...r, showcase_image_url: url } : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generate failed');
    } finally {
      setGeneratingRecipeIds(prev => {
        const next = new Set(prev);
        next.delete(recipeId);
        return next;
      });
    }
  };

  const handleSavePreview = async () => {
    if (!previewRecipe || !previewBlob) return;
    setSavingPreview(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', previewBlob, 'recipe-spread.png');
      formData.append('recipe_id', previewRecipe.recipe_id);
      formData.append('group_id', previewRecipe.group_id || '');

      const res = await fetch('/api/v1/admin/showcase/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { url } = await res.json();
      setRecipes(prev =>
        prev.map(r =>
          r.recipe_id === previewRecipe.recipe_id ? { ...r, showcase_image_url: url } : r
        )
      );
      handleClosePreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingPreview(false);
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewRecipe(null);
    setPreviewBlobUrl(null);
    setPreviewBlob(null);
  };

  const handleUploadClick = (recipeId: string) => {
    const recipe = findRecipe(recipeId);
    if (!recipe) return;
    uploadTargetRef.current = recipe;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const recipe = uploadTargetRef.current;
    if (!file || !recipe) return;

    e.target.value = '';
    setUploadingRecipeId(recipe.recipe_id);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('recipe_id', recipe.recipe_id);
      formData.append('group_id', recipe.group_id || '');

      const res = await fetch('/api/v1/admin/showcase/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { url } = await res.json();
      setRecipes(prev =>
        prev.map(r =>
          r.recipe_id === recipe.recipe_id ? { ...r, showcase_image_url: url } : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingRecipeId(null);
    }
  };

  const handleSend = async (guest: GuestGroup, override = false) => {
    setConfirmSend(null);
    setConfirmOverride(false);
    setSendingGuestId(guest.guest_id);
    setError(null);

    const readyRecipes = guest.recipes.filter(r => r.showcase_image_url);

    try {
      const res = await fetch('/api/v1/admin/showcase/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: guest.guest_id,
          guest_name: guest.guest_name,
          guest_email: guest.guest_email,
          couple_name: guest.couple_display_name,
          override,
          recipes: readyRecipes.map(r => ({
            recipe_id: r.recipe_id,
            recipe_name: r.recipe_name,
            showcase_image_url: r.showcase_image_url,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Send failed');
      }

      const { sent_at } = await res.json();
      const sentRecipeIds = new Set(readyRecipes.map(r => r.recipe_id));
      setRecipes(prev =>
        prev.map(r =>
          sentRecipeIds.has(r.recipe_id) ? { ...r, sent_at } : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSendingGuestId(null);
    }
  };

  const handleReset = async (guest: GuestGroup) => {
    setResettingGuestId(guest.guest_id);
    setError(null);

    const recipeIds = guest.recipes.map(r => r.recipe_id);

    try {
      const res = await fetch('/api/v1/admin/showcase/send', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: guest.guest_id,
          recipe_ids: recipeIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Reset failed');
      }

      const idSet = new Set(recipeIds);
      setRecipes(prev =>
        prev.map(r =>
          idSet.has(r.recipe_id) ? { ...r, sent_at: null } : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setResettingGuestId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
          <p className="text-gray-600">Loading showcase...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">
              &larr; Back to Admin
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Recipe Showcase</h1>
            <p className="text-sm text-gray-600 mt-1">
              Send recipe spread previews to opted-in guests
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-medium underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Stats bar — maps 1:1 to the three sections below */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#D4A854] p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending today</div>
            <div className="text-3xl font-bold text-[#D4A854] mt-1">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Waiting for book</div>
            <div className="text-3xl font-bold text-gray-600 mt-1">{stats.waiting}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Already sent</div>
            <div className="text-3xl font-bold text-gray-400 mt-1">{stats.sent}</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Search guest, email, recipe..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white w-64"
          />
          <select
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="all">All Groups</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Section A — Ready to send */}
        <SectionCard
          title="Ready to send"
          subtitle="Book is printed. Send the showcase email."
          count={readyToSend.length}
          tone="primary"
          defaultOpen
        >
          {readyToSend.length === 0 ? (
            <EmptyRow message="Nothing pending. Nice." />
          ) : (
            <GuestTable
              guests={readyToSend}
              variant="ready"
              generatingRecipeIds={generatingRecipeIds}
              uploadingRecipeId={uploadingRecipeId}
              sendingGuestId={sendingGuestId}
              resettingGuestId={resettingGuestId}
              onGenerate={handleGenerate}
              onUpload={handleUploadClick}
              onSend={g => { setConfirmOverride(false); setConfirmSend(g); }}
              onReset={handleReset}
            />
          )}
        </SectionCard>

        {/* Section B — Waiting for book */}
        <div className="mt-6">
          <SectionCard
            title="Waiting for book"
            subtitle="Locked until book_status = 'printed'."
            count={waitingForBook.length}
            tone="muted"
            open={waitingExpanded}
            onToggle={() => setWaitingExpanded(v => !v)}
          >
            {waitingForBook.length === 0 ? (
              <EmptyRow message="No guests waiting." />
            ) : (
              <GuestTable
                guests={waitingForBook}
                variant="locked"
                generatingRecipeIds={generatingRecipeIds}
                uploadingRecipeId={uploadingRecipeId}
                sendingGuestId={sendingGuestId}
                resettingGuestId={resettingGuestId}
                onGenerate={handleGenerate}
                onUpload={handleUploadClick}
                onSend={g => { setConfirmOverride(true); setConfirmSend(g); }}
                onReset={handleReset}
              />
            )}
          </SectionCard>
        </div>

        {/* Section C — Already sent */}
        <div className="mt-6">
          <SectionCard
            title="Already sent"
            subtitle="Archive. Reset if you need to resend."
            count={alreadySent.length}
            tone="muted"
            open={sentExpanded}
            onToggle={() => setSentExpanded(v => !v)}
          >
            {alreadySent.length === 0 ? (
              <EmptyRow message="No emails sent yet." />
            ) : (
              <GuestTable
                guests={alreadySent}
                variant="sent"
                generatingRecipeIds={generatingRecipeIds}
                uploadingRecipeId={uploadingRecipeId}
                sendingGuestId={sendingGuestId}
                resettingGuestId={resettingGuestId}
                onGenerate={handleGenerate}
                onUpload={handleUploadClick}
                onSend={g => setConfirmSend(g)}
                onReset={handleReset}
              />
            )}
          </SectionCard>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Preview dialog — shows generated spread before saving */}
      <Dialog open={!!previewRecipe} onOpenChange={() => handleClosePreview()}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Spread Preview</DialogTitle>
            <DialogDescription>
              {previewRecipe?.recipe_name} — {previewRecipe?.guest_name}
            </DialogDescription>
          </DialogHeader>
          {previewBlobUrl && (
            <img
              src={previewBlobUrl}
              alt="Spread preview"
              className="w-full rounded-lg border shadow-sm"
            />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClosePreview} disabled={savingPreview}>
              Cancel
            </Button>
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={handleSavePreview}
              disabled={savingPreview}
            >
              {savingPreview ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send confirmation dialog */}
      <Dialog open={!!confirmSend} onOpenChange={() => { setConfirmSend(null); setConfirmOverride(false); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {confirmOverride ? 'Send anyway?' : 'Send Showcase Email'}
            </DialogTitle>
            <DialogDescription>
              Send {confirmSend?.recipes.length === 1 ? '1 recipe spread' : `${confirmSend?.recipes.length} recipe spreads`} to{' '}
              <strong>{confirmSend?.guest_name}</strong> ({confirmSend?.guest_email})?
            </DialogDescription>
          </DialogHeader>
          {confirmOverride && (
            <div className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
              <strong>Heads up:</strong> this book is <em>not</em> printed yet
              ({confirmSend?.book_status ? BOOK_STATUS_LABELS[confirmSend.book_status] || confirmSend.book_status : '—'}).
              Sending now could spoil the surprise. Only do this for tests or demos.
            </div>
          )}
          {confirmSend && (
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              {confirmSend.recipes.map(r => (
                <li key={r.recipe_id}>{r.recipe_name}</li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setConfirmSend(null); setConfirmOverride(false); }}>
              Cancel
            </Button>
            <Button
              className={confirmOverride
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-black text-white hover:bg-gray-800'}
              onClick={() => confirmSend && handleSend(confirmSend, confirmOverride)}
            >
              {confirmOverride ? 'Send anyway' : 'Send Email'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Helper components ----------

interface SectionCardProps {
  title: string;
  subtitle: string;
  count: number;
  tone: 'primary' | 'muted';
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

function SectionCard({ title, subtitle, count, tone, defaultOpen, open, onToggle, children }: SectionCardProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const toggle = () => {
    if (isControlled) onToggle?.();
    else setInternalOpen(v => !v);
  };

  const headerBg = tone === 'primary' ? 'bg-[#FAF7F2]' : 'bg-gray-50';
  const countColor = tone === 'primary' ? 'text-[#D4A854]' : 'text-gray-500';

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-5 py-4 ${headerBg} hover:brightness-95 transition`}
      >
        <div className="text-left">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <span className={`text-xl font-bold ${countColor}`}>{count}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <span className="text-gray-400 text-sm">{isOpen ? '▾' : '▸'}</span>
      </button>
      {isOpen && <div className="overflow-x-auto">{children}</div>}
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <div className="text-center py-10 text-gray-400 text-sm">{message}</div>;
}

interface GuestTableProps {
  guests: GuestGroup[];
  variant: 'ready' | 'locked' | 'sent';
  generatingRecipeIds: Set<string>;
  uploadingRecipeId: string | null;
  sendingGuestId: string | null;
  resettingGuestId: string | null;
  onGenerate: (recipeId: string) => void;
  onUpload: (recipeId: string) => void;
  onSend: (guest: GuestGroup) => void;
  onReset: (guest: GuestGroup) => void;
}

function GuestTable({
  guests,
  variant,
  generatingRecipeIds,
  uploadingRecipeId,
  sendingGuestId,
  resettingGuestId,
  onGenerate,
  onUpload,
  onSend,
  onReset,
}: GuestTableProps) {
  return (
    <table className="w-full text-sm table-fixed">
      <colgroup>
        <col className="w-[200px]" />
        <col className="w-[180px]" />
        <col />
        <col className="w-[170px]" />
      </colgroup>
      <thead>
        <tr className="border-b bg-white">
          <th className="text-left px-4 py-3 font-medium text-gray-700">Guest</th>
          <th className="text-left px-4 py-3 font-medium text-gray-700">Book</th>
          <th className="text-left px-4 py-3 font-medium text-gray-700">Recipes</th>
          <th className="text-left px-4 py-3 font-medium text-gray-700">Action</th>
        </tr>
      </thead>
      <tbody>
        {guests.map(guest => {
          const sendState = getSendState(guest);
          const allHaveImages = guest.recipes.every(r => r.showcase_image_url);
          const latestSentAt = guest.recipes
            .filter(r => r.sent_at)
            .map(r => r.sent_at!)
            .sort()
            .pop();
          const bookLabel = guest.book_status ? BOOK_STATUS_LABELS[guest.book_status] || guest.book_status : '—';
          const lockedTooltip = "Book must be 'printed' before sending";

          return (
            <tr key={guest.guest_id} className="border-b last:border-b-0 align-top hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{guest.guest_name}</div>
                <div className="text-gray-500 text-xs">{guest.guest_email}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-gray-900 text-xs font-medium truncate">{guest.group_name || '—'}</div>
                <div className="text-gray-500 text-xs mt-0.5">
                  {bookLabel}
                  {variant === 'ready' && guest.book_close_date && (
                    <> · closed {formatDaysAgo(guest.book_close_date)}</>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="space-y-3">
                  {guest.recipes.map(recipe => (
                    <div key={recipe.recipe_id} className="flex items-center gap-3">
                      {recipe.showcase_image_url ? (
                        <img
                          src={recipe.showcase_image_url}
                          alt={recipe.recipe_name}
                          className="w-20 h-14 object-cover rounded border flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-14 rounded border border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-300 text-xs">No img</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-gray-900 font-medium truncate">{recipe.recipe_name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => onGenerate(recipe.recipe_id)}
                            disabled={generatingRecipeIds.has(recipe.recipe_id)}
                            className="text-gray-400 hover:text-gray-600 text-xs underline transition-colors"
                          >
                            {generatingRecipeIds.has(recipe.recipe_id)
                              ? 'Generating...'
                              : recipe.showcase_image_url ? 'Regenerate' : 'Generate'}
                          </button>
                          <button
                            onClick={() => onUpload(recipe.recipe_id)}
                            disabled={uploadingRecipeId === recipe.recipe_id}
                            className="text-gray-400 hover:text-gray-600 text-xs underline transition-colors"
                          >
                            {uploadingRecipeId === recipe.recipe_id ? 'Uploading...' : 'Upload'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                {variant === 'sent' ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-green-600 text-xs font-medium">
                      Sent {latestSentAt ? new Date(latestSentAt).toLocaleDateString() : ''}
                    </span>
                    <button
                      onClick={() => onReset(guest)}
                      disabled={resettingGuestId === guest.guest_id}
                      className="text-gray-400 hover:text-red-500 text-xs underline transition-colors w-fit"
                    >
                      {resettingGuestId === guest.guest_id ? 'Resetting...' : 'Reset'}
                    </button>
                  </div>
                ) : variant === 'locked' ? (
                  <div className="flex flex-col gap-2" title={lockedTooltip}>
                    <Button
                      size="sm"
                      disabled={sendingGuestId === guest.guest_id || !allHaveImages}
                      onClick={() => onSend(guest)}
                      className="bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200"
                    >
                      {sendingGuestId === guest.guest_id ? 'Sending...' : 'Locked'}
                    </Button>
                    <button
                      onClick={() => window.open(
                        `/api/v1/admin/showcase/preview-email?guest_id=${guest.guest_id}`,
                        '_blank'
                      )}
                      className="text-gray-400 hover:text-gray-600 text-xs underline transition-colors w-fit"
                    >
                      Preview
                    </button>
                  </div>
                ) : allHaveImages ? (
                  <div className="flex flex-col gap-2">
                    {sendState === 'partial' && (
                      <span className="text-amber-600 text-xs font-medium">Partially sent</span>
                    )}
                    <Button
                      size="sm"
                      disabled={sendingGuestId === guest.guest_id}
                      onClick={() => onSend(guest)}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      {sendingGuestId === guest.guest_id ? 'Sending...' : `Send (${guest.recipes.length})`}
                    </Button>
                    <button
                      onClick={() => window.open(
                        `/api/v1/admin/showcase/preview-email?guest_id=${guest.guest_id}`,
                        '_blank'
                      )}
                      className="text-gray-400 hover:text-gray-600 text-xs underline transition-colors w-fit"
                    >
                      Preview
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">
                    {guest.recipes.filter(r => r.showcase_image_url).length}/{guest.recipes.length} images ready
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
