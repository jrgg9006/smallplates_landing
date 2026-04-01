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
  recipes: Array<{
    recipe_id: string;
    recipe_name: string;
    showcase_image_url: string | null;
    sent_at: string | null;
  }>;
}

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
  const [sentFilter, setSentFilter] = useState<'all' | 'sent' | 'not_sent'>('all');
  const [uploadingRecipeId, setUploadingRecipeId] = useState<string | null>(null);
  const [sendingGuestId, setSendingGuestId] = useState<string | null>(null);
  const [resettingGuestId, setResettingGuestId] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState<GuestGroup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingRecipeId, setGeneratingRecipeId] = useState<string | null>(null);
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

  const filtered = useMemo(() => {
    return guestGroups.filter(g => {
      if (selectedGroup !== 'all' && g.group_id !== selectedGroup) return false;

      const allSent = g.recipes.every(r => r.sent_at);
      if (sentFilter === 'sent' && !allSent) return false;
      if (sentFilter === 'not_sent' && allSent) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const recipeNames = g.recipes.map(r => r.recipe_name).join(' ');
        const haystack = `${g.guest_name} ${g.guest_email} ${recipeNames} ${g.group_name || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [guestGroups, selectedGroup, sentFilter, searchQuery]);

  const stats = {
    guests: guestGroups.length,
    ready: guestGroups.filter(g => g.recipes.every(r => r.showcase_image_url)).length,
    sent: guestGroups.filter(g => g.recipes.every(r => r.sent_at)).length,
  };

  // Reason: find the flat ShowcaseRecipe for per-recipe actions (generate, upload)
  const findRecipe = (recipeId: string): ShowcaseRecipe | undefined =>
    recipes.find(r => r.recipe_id === recipeId);

  const handleGenerate = async (recipeId: string) => {
    const recipe = findRecipe(recipeId);
    if (!recipe) return;

    setGeneratingRecipeId(recipeId);
    setError(null);

    try {
      const res = await fetch(`/api/v1/admin/showcase/preview?recipe_id=${recipeId}`);
      if (!res.ok) throw new Error('Failed to generate spread image');

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewBlob(blob);
      setPreviewBlobUrl(blobUrl);
      setPreviewRecipe(recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generate failed');
    } finally {
      setGeneratingRecipeId(null);
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

  const handleSend = async (guest: GuestGroup) => {
    setConfirmSend(null);
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

        {/* Filter bar + stats */}
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

          <select
            value={sentFilter}
            onChange={e => setSentFilter(e.target.value as 'all' | 'sent' | 'not_sent')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="not_sent">Not Sent</option>
          </select>

          <div className="flex gap-4 text-sm text-gray-600">
            <span>{stats.guests} guests</span>
            <span className="text-gray-300">|</span>
            <span>{stats.ready} ready</span>
            <span className="text-gray-300">|</span>
            <span className="text-green-600">{stats.sent} sent</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[200px]" />
              <col className="w-[140px]" />
              <col />
              <col className="w-[160px]" />
            </colgroup>
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-700">Guest</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Group</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Recipes</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    No opted-in guests found
                  </td>
                </tr>
              ) : (
                filtered.map(guest => {
                  const allHaveImages = guest.recipes.every(r => r.showcase_image_url);
                  const allSent = guest.recipes.every(r => r.sent_at);
                  const someSent = guest.recipes.some(r => r.sent_at);
                  const latestSentAt = guest.recipes
                    .filter(r => r.sent_at)
                    .map(r => r.sent_at!)
                    .sort()
                    .pop();

                  return (
                    <tr key={guest.guest_id} className="border-b last:border-b-0 align-top hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{guest.guest_name}</div>
                        <div className="text-gray-500 text-xs">{guest.guest_email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {guest.group_name || '—'}
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
                                    onClick={() => handleGenerate(recipe.recipe_id)}
                                    disabled={generatingRecipeId === recipe.recipe_id}
                                    className="text-gray-400 hover:text-gray-600 text-xs underline transition-colors"
                                  >
                                    {generatingRecipeId === recipe.recipe_id
                                      ? 'Generating...'
                                      : recipe.showcase_image_url ? 'Regenerate' : 'Generate'}
                                  </button>
                                  <button
                                    onClick={() => handleUploadClick(recipe.recipe_id)}
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
                        {allSent ? (
                          <div className="flex flex-col gap-2">
                            <span className="text-green-600 text-xs font-medium">
                              Sent {new Date(latestSentAt!).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => handleReset(guest)}
                              disabled={resettingGuestId === guest.guest_id}
                              className="text-gray-400 hover:text-red-500 text-xs underline transition-colors w-fit"
                            >
                              {resettingGuestId === guest.guest_id ? 'Resetting...' : 'Reset'}
                            </button>
                          </div>
                        ) : allHaveImages ? (
                          <div className="flex flex-col gap-2">
                            {someSent && (
                              <span className="text-amber-600 text-xs font-medium">Partially sent</span>
                            )}
                            <Button
                              size="sm"
                              disabled={sendingGuestId === guest.guest_id}
                              onClick={() => setConfirmSend(guest)}
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
                })
              )}
            </tbody>
          </table>
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
      <Dialog open={!!confirmSend} onOpenChange={() => setConfirmSend(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Showcase Email</DialogTitle>
            <DialogDescription>
              Send {confirmSend?.recipes.length === 1 ? '1 recipe spread' : `${confirmSend?.recipes.length} recipe spreads`} to{' '}
              <strong>{confirmSend?.guest_name}</strong> ({confirmSend?.guest_email})?
            </DialogDescription>
          </DialogHeader>
          {confirmSend && (
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              {confirmSend.recipes.map(r => (
                <li key={r.recipe_id}>{r.recipe_name}</li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setConfirmSend(null)}>
              Cancel
            </Button>
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => confirmSend && handleSend(confirmSend)}
            >
              Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
