"use client";

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdminEmail } from '@/lib/config/admin';
import Image from 'next/image';

interface UserActivity {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  guest_count: number;
  recipe_count: number;
  last_activity: string | null;
}

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: 'pending' | 'reached_out' | 'submitted';
  created_at: string;
  number_of_recipes: number;
  recipes_received: number;
  is_archived: boolean;
}

interface Recipe {
  id: string;
  recipe_name: string;
  ingredients: string | null;
  instructions: string | null;
  comments: string | null;
  image_url: string | null;
  document_urls: string[] | null;
  upload_method: 'text' | 'image' | 'audio' | null;
  submission_status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  submitted_at: string | null;
}

export default function ActivityPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'most_active' | 'alphabetical'>('newest');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadGuests(selectedUser);
      setSelectedGuest(null);
      setRecipes([]);
      setSelectedRecipe(null); // Clear recipe details when switching users
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser && selectedGuest) {
      setSelectedRecipe(null); // Clear recipe details when switching guests
      loadRecipes(selectedUser, selectedGuest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGuest]);

  const checkAdminAndLoadData = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !isAdminEmail(user.email)) {
      console.log('❌ Not admin, redirecting to home');
      router.push('/');
      return;
    }
    
    console.log('✅ Admin access granted');
    setIsAdmin(true);
    await loadUsers();
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/v1/admin/activity/users');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      console.log('Users data:', data);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadGuests = async (userId: string) => {
    setLoadingGuests(true);
    try {
      console.log('Loading guests for user:', userId);
      const response = await fetch(`/api/v1/admin/activity/users/${userId}`);
      console.log('Guests response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Guests API Error:', errorData);
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      console.log('Guests data:', data);
      setGuests(data.guests || []);
    } catch (error) {
      console.error('Error loading guests:', error);
    } finally {
      setLoadingGuests(false);
    }
  };

  const loadRecipes = async (userId: string, guestId: string) => {
    setLoadingRecipes(true);
    try {
      console.log('Loading recipes for guest:', guestId);
      
      // Use API route that calls admin function server-side
      const response = await fetch(`/api/v1/admin/activity/users/${userId}/guests/${guestId}/recipes`);
      console.log('Recipes response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Recipes API Error:', errorData);
        throw new Error('Failed to fetch recipes');
      }
      
      const data = await response.json();
      console.log('Admin recipe data loaded:', data.recipes?.length || 0, 'recipes');
      setRecipes(data.recipes || []); // API returns { guest, user, recipes }
    } catch (error) {
      console.error('Error loading recipes:', error);
      setRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const filteredAndSortedUsers = users
    .filter(user => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (user.email?.toLowerCase().includes(searchLower)) ||
        (user.full_name?.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'most_active':
          return b.recipe_count - a.recipe_count;
        case 'alphabetical':
          return (a.full_name || a.email || '').localeCompare(b.full_name || b.email || '');
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activity data...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Activity</h1>
            <p className="text-sm text-gray-600 mt-1">Track user engagement and recipe submissions</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            ← Back to Admin
          </Link>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        >
          <option value="newest">Newest First</option>
          <option value="most_active">Most Active</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
        <div className="text-sm text-gray-600">
          {users.length} users total
        </div>
      </div>

      {/* Multi-Column Layout */}
      <div className="flex h-[calc(100vh-180px)]">
        {/* Column 1: Users */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="sticky top-0 bg-gray-50 border-b px-4 py-2">
            <div className="text-xs font-semibold text-gray-600 uppercase">Users</div>
          </div>
          {filteredAndSortedUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user.id)}
              className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 ${
                selectedUser === user.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="font-medium text-sm text-gray-900">
                {user.full_name || 'Unnamed User'}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">{user.email}</div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-gray-500">
                  {user.guest_count} guests
                </span>
                <span className="text-xs text-gray-500">
                  {user.recipe_count} recipes
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Column 2: Guests */}
        {selectedUser && (
          <div className="w-80 bg-white border-r overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 border-b px-4 py-2">
              <div className="text-xs font-semibold text-gray-600 uppercase">Guests</div>
            </div>
            {loadingGuests ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
              </div>
            ) : (
              <>
                {guests.map((guest) => (
                  <div
                    key={guest.id}
                    onClick={() => {
                      console.log('Clicking guest:', guest.id, guest.first_name);
                      setSelectedGuest(guest.id);
                    }}
                    className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedGuest === guest.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {guest.first_name} {guest.last_name}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">{guest.email || 'No email'}</div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        guest.status === 'submitted' ? 'bg-green-100 text-green-700' :
                        guest.status === 'reached_out' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {guest.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {guest.recipes_received} {guest.recipes_received === 1 ? 'recipe' : 'recipes'}
                      </span>
                    </div>
                  </div>
                ))}
                {guests.length === 0 && (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No guests added yet
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Column 3: Recipes */}
        {selectedGuest && (
          <div className="w-80 bg-white border-r overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 border-b px-4 py-2">
              <div className="text-xs font-semibold text-gray-600 uppercase">
                Recipes ({recipes.length})
              </div>
            </div>
            {loadingRecipes ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                <div className="text-xs text-gray-500 mt-2">Loading recipes...</div>
              </div>
            ) : (
              <>
                {recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedRecipe?.id === recipe.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Recipe thumbnail */}
                      {recipe.image_url ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={recipe.image_url}
                            alt={recipe.recipe_name || 'Recipe'}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-400 text-lg">📄</span>
                        </div>
                      )}
                      
                      {/* Recipe info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {recipe.recipe_name || 'Untitled Recipe'}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          Submitted {new Date(recipe.submitted_at || recipe.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            recipe.submission_status === 'approved' ? 'bg-green-100 text-green-700' :
                            recipe.submission_status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                            recipe.submission_status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {recipe.submission_status}
                          </span>
                          {recipe.image_url && (
                            <span className="text-xs text-gray-500">📷</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {recipes.length === 0 && !loadingRecipes && (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No recipes submitted yet
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Recipe Detail Panel */}
        {selectedRecipe && (
          <div className="flex-1 bg-white overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedRecipe.recipe_name}</h2>
              
              {selectedRecipe.image_url && (
                <div className="mb-6">
                  <div className="relative aspect-square max-w-md rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={selectedRecipe.image_url}
                      alt={selectedRecipe.recipe_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingredients</h3>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {selectedRecipe.ingredients || 'No ingredients provided'}
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {selectedRecipe.instructions || 'No instructions provided'}
                  </pre>
                </div>

                {/* Images/PDFs Section - only show if there are uploaded files */}
                {selectedRecipe.document_urls && selectedRecipe.document_urls.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Uploaded Files</h3>
                    <p className="text-sm text-gray-600 mb-3">Guest uploaded these files:</p>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedRecipe.document_urls.map((url, index) => {
                        const isPDF = url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf');
                        return (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                            {isPDF ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                              >
                                <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm font-medium">PDF</span>
                                <span className="text-xs text-gray-500 mt-1">Click to view</span>
                              </a>
                            ) : (
                              <Image
                                src={url}
                                alt={`Uploaded image ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 25vw"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedRecipe.comments && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Comments</h3>
                    <p className="text-sm text-gray-700 bg-yellow-50 p-4 rounded-lg">
                      {selectedRecipe.comments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}