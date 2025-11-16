"use client";

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdminEmail } from '@/lib/config/admin';
import { RecipeOperationsTable } from './components/RecipeOperationsTable';
import Image from 'next/image';

interface RecipeWithProductionStatus {
  id: string;
  recipe_name: string;
  ingredients: string;
  instructions: string;
  comments: string | null;
  image_url: string | null;
  document_urls: string[] | null;
  upload_method: 'text' | 'image' | 'audio' | null;
  submission_status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  submitted_at: string | null;
  updated_at: string;
  guests: {
    id: string;
    first_name: string;
    last_name: string;
    printed_name: string | null;
    email: string | null;
    is_self: boolean | null;
    source: string | null;
  } | null;
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  production_status: {
    id: string;
    text_finalized_in_indesign: boolean;
    image_generated: boolean;
    image_placed_in_indesign: boolean;
    operations_notes: string | null;
    production_completed_at: string | null;
    needs_review: boolean;
  } | null;
  calculated_status: 'no_action' | 'in_progress' | 'ready_to_print';
  cookbook: {
    id: string;
    name: string;
  } | null;
}

interface ProductionStats {
  recipesNeedingAction: number;
  recipesReadyToPrint: number;
}

interface Cookbook {
  id: string;
  name: string;
  user_id: string;
  user_name: string | null;
  user_email: string;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

export default function OperationsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [recipes, setRecipes] = useState<RecipeWithProductionStatus[]>([]);
  const [stats, setStats] = useState<ProductionStats>({ recipesNeedingAction: 0, recipesReadyToPrint: 0 });
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithProductionStatus | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'no_action' | 'in_progress' | 'ready_to_print'>('all');
  const [cookbookFilter, setCookbookFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadRecipes();
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, cookbookFilter, userFilter, isAdmin]);

  // Load all users once on initial mount (not from filtered results)
  useEffect(() => {
    if (isAdmin) {
      loadAllUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

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
    await loadCookbooks();
    setLoading(false);
  };

  const loadCookbooks = async () => {
    try {
      // We'll get cookbooks from the recipes data, but for now just set empty
      // In a real implementation, you might want a separate API endpoint
      setCookbooks([]);
    } catch (error) {
      console.error('Error loading cookbooks:', error);
    }
  };

  const loadRecipes = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (cookbookFilter !== 'all') {
        params.append('cookbookId', cookbookFilter);
      }
      if (userFilter !== 'all') {
        params.append('userId', userFilter);
      }

      const response = await fetch(`/api/admin/operations/recipes?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error('Failed to fetch recipes');
      }
      
      const data = await response.json();
      setRecipes(data);
      
      // Extract unique cookbooks from recipes
      const uniqueCookbooks = new Map<string, Cookbook>();
      data.forEach((recipe: RecipeWithProductionStatus) => {
        if (recipe.cookbook && recipe.profiles) {
          uniqueCookbooks.set(recipe.cookbook.id, {
            id: recipe.cookbook.id,
            name: recipe.cookbook.name,
            user_id: recipe.profiles.id,
            user_name: recipe.profiles.full_name,
            user_email: recipe.profiles.email,
          });
        }
      });
      setCookbooks(Array.from(uniqueCookbooks.values()));
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      // Load all recipes without user filter to get all users
      const response = await fetch('/api/admin/operations/recipes');
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      
      // Extract unique users from all recipes
      const uniqueUsers = new Map<string, User>();
      data.forEach((recipe: RecipeWithProductionStatus) => {
        if (recipe.profiles) {
          uniqueUsers.set(recipe.profiles.id, {
            id: recipe.profiles.id,
            email: recipe.profiles.email,
            full_name: recipe.profiles.full_name,
          });
        }
      });
      setUsers(Array.from(uniqueUsers.values()).sort((a, b) => {
        const nameA = a.full_name || a.email || '';
        const nameB = b.full_name || b.email || '';
        return nameA.localeCompare(nameB);
      }));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/operations/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStatusUpdate = () => {
    loadRecipes();
    loadStats();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operations data...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Operations</h1>
            <p className="text-sm text-gray-600 mt-1">Track recipe production workflow</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            ← Back to Admin
          </Link>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="bg-white border-b px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-600 font-medium mb-1">Recipes Needing Action</div>
            <div className="text-3xl font-bold text-red-900">{stats.recipesNeedingAction}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium mb-1">Recipes Ready to Print</div>
            <div className="text-3xl font-bold text-green-900">{stats.recipesReadyToPrint}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-6 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">User:</label>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-w-[200px]"
          >
            <option value="all">All Users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="no_action">No Action</option>
            <option value="in_progress">In Progress</option>
            <option value="ready_to_print">Ready to Print</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Cookbook:</label>
          <select
            value={cookbookFilter}
            onChange={(e) => setCookbookFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="not_in_cookbook">Not in Cookbook</option>
            {cookbooks.map((cookbook) => (
              <option key={cookbook.id} value={cookbook.id}>
                ({cookbook.user_name || cookbook.user_email}) {cookbook.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600 ml-auto">
          {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-280px)]">
        {/* Recipe Table */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="p-6">
            <RecipeOperationsTable
              recipes={recipes}
              onRecipeClick={setSelectedRecipe}
              onStatusUpdate={handleStatusUpdate}
            />
          </div>
        </div>

        {/* Recipe Detail Panel */}
        {selectedRecipe && (
          <div className="w-96 bg-white border-l overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedRecipe.recipe_name}</h2>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {selectedRecipe.image_url && (
                <div className="mb-6">
                  <div className="relative aspect-square max-w-full rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={selectedRecipe.image_url}
                      alt={selectedRecipe.recipe_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 384px) 100vw, 384px"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookbook</h3>
                  <p className="text-sm text-gray-700">
                    {selectedRecipe.cookbook?.name || 'Not in Cookbook'}
                  </p>
                </div>

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

                {selectedRecipe.comments && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Comments</h3>
                    <p className="text-sm text-gray-700 bg-yellow-50 p-4 rounded-lg">
                      {selectedRecipe.comments}
                    </p>
                  </div>
                )}

                {selectedRecipe.document_urls && selectedRecipe.document_urls.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Uploaded Files</h3>
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
                                sizes="(max-width: 384px) 50vw, 25vw"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Production Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={selectedRecipe.production_status?.text_finalized_in_indesign ? 'text-green-600' : 'text-gray-400'}>
                        {selectedRecipe.production_status?.text_finalized_in_indesign ? '✓' : '○'}
                      </span>
                      <span>Text Finalized in InDesign</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={selectedRecipe.production_status?.image_generated ? 'text-green-600' : 'text-gray-400'}>
                        {selectedRecipe.production_status?.image_generated ? '✓' : '○'}
                      </span>
                      <span>Image Generated</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={selectedRecipe.production_status?.image_placed_in_indesign ? 'text-green-600' : 'text-gray-400'}>
                        {selectedRecipe.production_status?.image_placed_in_indesign ? '✓' : '○'}
                      </span>
                      <span>Image Placed in InDesign</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

