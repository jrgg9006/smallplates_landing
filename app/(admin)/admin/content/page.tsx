"use client";

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/config/admin';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Plus, AlertCircle, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RecipeEditor from './components/RecipeEditor';
import AddRecipeForm from './components/AddRecipeForm';

interface GroupSummary {
  id: string;
  name: string;
  couple_display_name: string | null;
  guest_count: number;
  recipe_count: number;
  profiles: { email: string; full_name: string | null } | null;
}

interface GuestSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  number_of_recipes: number;
  recipes_received: number;
  source: string;
  is_self: boolean;
}

interface RecipeSummary {
  id: string;
  recipe_name: string;
  submission_status: string;
  created_at: string;
  guests: { first_name: string; last_name: string; email: string; is_self: boolean } | null;
}

export default function AdminContentPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  const [guests, setGuests] = useState<GuestSummary[]>([]);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);

  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [showAddRecipe, setShowAddRecipe] = useState(false);

  useEffect(() => {
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdmin = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      router.push('/');
      return;
    }

    setIsAdmin(true);
    setLoading(false);
    fetchGroups();
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/v1/admin/content/groups');
      if (!res.ok) throw new Error('Failed to load groups');
      const data = await res.json();
      setGroups(data);
    } catch {
      setGroupError('Failed to load groups');
    }
  };

  const fetchGroupDetail = async (groupId: string) => {
    setLoadingGroup(true);
    setGroupError(null);

    try {
      const res = await fetch(`/api/v1/admin/content/groups/${groupId}`);
      if (!res.ok) throw new Error('Failed to load group data');
      const data = await res.json();
      setGuests(data.guests);
      setRecipes(data.recipes);
    } catch {
      setGroupError('Failed to load group data');
    } finally {
      setLoadingGroup(false);
    }
  };

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    setGuests([]);
    setRecipes([]);
    if (groupId) {
      fetchGroupDetail(groupId);
    }
  };

  const handleRecipeSaved = () => {
    if (selectedGroupId) {
      fetchGroupDetail(selectedGroupId);
    }
  };

  const handleRecipeAdded = () => {
    if (selectedGroupId) {
      fetchGroupDetail(selectedGroupId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">
              ← Back to Admin
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
            <p className="text-gray-600 mt-1">Add and edit recipes on behalf of guests</p>
          </div>
        </div>

        {/* Group Selector */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Select Group</label>
              <Select value={selectedGroupId} onValueChange={handleGroupChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a group..." />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({g.guest_count} guests, {g.recipe_count} recipes)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGroupId && (
              <Button onClick={() => setShowAddRecipe(true)} className="mt-6">
                <Plus className="w-4 h-4 mr-2" />
                Add Recipe
              </Button>
            )}
          </div>

          {selectedGroup && (
            <div className="mt-3 text-sm text-gray-500">
              Owner: {selectedGroup.profiles?.full_name || selectedGroup.profiles?.email || 'Unknown'}
              {selectedGroup.couple_display_name && ` | Couple: ${selectedGroup.couple_display_name}`}
            </div>
          )}
        </div>

        {groupError && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {groupError}
          </div>
        )}

        {loadingGroup && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {selectedGroupId && !loadingGroup && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Guests Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5" />
                  Guests ({guests.length})
                </h3>
                {guests.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No guests yet</p>
                ) : (
                  <div className="space-y-2">
                    {guests.map((g) => (
                      <div key={g.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">
                          {g.first_name} {g.last_name}
                          {g.is_self && <span className="text-xs text-gray-400 ml-1">(self)</span>}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{g.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {g.recipes_received} / {g.number_of_recipes} recipes
                          {g.source === 'manual' && ' | manual'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recipes Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5" />
                  Recipes ({recipes.length})
                </h3>
                {recipes.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No recipes yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2 pr-4 font-medium">Recipe</th>
                          <th className="pb-2 pr-4 font-medium">Guest</th>
                          <th className="pb-2 pr-4 font-medium">Date</th>
                          <th className="pb-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipes.map((r) => (
                          <tr
                            key={r.id}
                            onClick={() => setEditingRecipeId(r.id)}
                            className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="py-3 pr-4">
                              <p className="font-medium text-gray-900 truncate max-w-[200px]">
                                {r.recipe_name}
                              </p>
                            </td>
                            <td className="py-3 pr-4 text-gray-600">
                              {r.guests
                                ? `${r.guests.first_name} ${r.guests.last_name}`
                                : 'Unknown'}
                            </td>
                            <td className="py-3 pr-4 text-gray-500">
                              {new Date(r.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                r.submission_status === 'submitted'
                                  ? 'bg-green-100 text-green-700'
                                  : r.submission_status === 'approved'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {r.submission_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recipe Editor Sheet */}
      <RecipeEditor
        recipeId={editingRecipeId}
        onClose={() => setEditingRecipeId(null)}
        onSaved={handleRecipeSaved}
      />

      {/* Add Recipe Dialog */}
      <AddRecipeForm
        open={showAddRecipe}
        groupId={selectedGroupId}
        guests={guests}
        onClose={() => setShowAddRecipe(false)}
        onAdded={handleRecipeAdded}
      />
    </div>
  );
}
