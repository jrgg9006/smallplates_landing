'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [uploadingRecipeId, setUploadingRecipeId] = useState<string | null>(null);
  const [sendingRecipeId, setSendingRecipeId] = useState<string | null>(null);
  const [resettingRecipeId, setResettingRecipeId] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState<ShowcaseRecipe | null>(null);
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

  const filtered = selectedGroup === 'all'
    ? recipes
    : recipes.filter(r => r.group_id === selectedGroup);

  const stats = {
    optedIn: recipes.length,
    uploaded: recipes.filter(r => r.showcase_image_url).length,
    sent: recipes.filter(r => r.sent_at).length,
  };

  const handleGenerate = async (recipe: ShowcaseRecipe) => {
    setGeneratingRecipeId(recipe.recipe_id);
    setError(null);

    try {
      const res = await fetch(`/api/v1/admin/showcase/preview?recipe_id=${recipe.recipe_id}`);
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

  const handleUploadClick = (recipe: ShowcaseRecipe) => {
    uploadTargetRef.current = recipe;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const recipe = uploadTargetRef.current;
    if (!file || !recipe) return;

    // Reset file input so same file can be re-selected
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

  const handleSend = async (recipe: ShowcaseRecipe) => {
    setConfirmSend(null);
    setSendingRecipeId(recipe.recipe_id);
    setError(null);

    try {
      const res = await fetch('/api/v1/admin/showcase/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: recipe.guest_id,
          recipe_id: recipe.recipe_id,
          guest_name: recipe.guest_name,
          guest_email: recipe.guest_email,
          recipe_name: recipe.recipe_name,
          couple_name: recipe.couple_display_name,
          showcase_image_url: recipe.showcase_image_url,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Send failed');
      }

      const { sent_at } = await res.json();
      setRecipes(prev =>
        prev.map(r =>
          r.recipe_id === recipe.recipe_id ? { ...r, sent_at } : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSendingRecipeId(null);
    }
  };

  const handleReset = async (recipe: ShowcaseRecipe) => {
    setResettingRecipeId(recipe.recipe_id);
    setError(null);

    try {
      const res = await fetch('/api/v1/admin/showcase/send', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: recipe.guest_id,
          recipe_id: recipe.recipe_id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Reset failed');
      }

      setRecipes(prev =>
        prev.map(r =>
          r.recipe_id === recipe.recipe_id ? { ...r, sent_at: null } : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setResettingRecipeId(null);
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

          <div className="flex gap-4 text-sm text-gray-600">
            <span>{stats.optedIn} opted in</span>
            <span className="text-gray-300">|</span>
            <span>{stats.uploaded} uploaded</span>
            <span className="text-gray-300">|</span>
            <span className="text-green-600">{stats.sent} sent</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-700">Guest</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Group</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Recipe</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Image</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    No opted-in recipes found
                  </td>
                </tr>
              ) : (
                filtered.map(recipe => (
                  <tr key={recipe.recipe_id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{recipe.guest_name}</div>
                      <div className="text-gray-500 text-xs">{recipe.guest_email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {recipe.group_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {recipe.recipe_name}
                    </td>
                    <td className="px-4 py-3">
                      {recipe.showcase_image_url ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={recipe.showcase_image_url}
                            alt={recipe.recipe_name}
                            className="w-24 h-16 object-cover rounded border"
                          />
                          <button
                            onClick={() => handleGenerate(recipe)}
                            disabled={generatingRecipeId === recipe.recipe_id}
                            className="text-gray-400 hover:text-gray-600 text-xs underline transition-colors"
                          >
                            {generatingRecipeId === recipe.recipe_id ? 'Regenerating...' : 'Regenerate'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={generatingRecipeId === recipe.recipe_id}
                            onClick={() => handleGenerate(recipe)}
                          >
                            {generatingRecipeId === recipe.recipe_id ? 'Generating...' : 'Generate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={uploadingRecipeId === recipe.recipe_id}
                            onClick={() => handleUploadClick(recipe)}
                            className="text-gray-400 text-xs"
                          >
                            {uploadingRecipeId === recipe.recipe_id ? 'Uploading...' : 'Upload'}
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {recipe.sent_at ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-xs font-medium">
                            Sent {new Date(recipe.sent_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleReset(recipe)}
                            disabled={resettingRecipeId === recipe.recipe_id}
                            className="text-gray-400 hover:text-red-500 text-xs underline transition-colors"
                          >
                            {resettingRecipeId === recipe.recipe_id ? 'Resetting...' : 'Reset'}
                          </button>
                        </div>
                      ) : recipe.showcase_image_url ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            disabled={sendingRecipeId === recipe.recipe_id}
                            onClick={() => setConfirmSend(recipe)}
                            className="bg-black text-white hover:bg-gray-800"
                          >
                            {sendingRecipeId === recipe.recipe_id ? 'Sending...' : 'Send'}
                          </Button>
                          <button
                            onClick={() => window.open(
                              `/api/v1/admin/showcase/preview-email?recipe_id=${recipe.recipe_id}&guest_id=${recipe.guest_id}`,
                              '_blank'
                            )}
                            className="text-gray-400 hover:text-gray-600 text-xs underline transition-colors"
                          >
                            Preview
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Generate first</span>
                      )}
                    </td>
                  </tr>
                ))
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
            <DialogTitle>Send Recipe Preview</DialogTitle>
            <DialogDescription>
              Send the spread preview to{' '}
              <strong>{confirmSend?.guest_name}</strong> ({confirmSend?.guest_email})?
            </DialogDescription>
          </DialogHeader>
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
