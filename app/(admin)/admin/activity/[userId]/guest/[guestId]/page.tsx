"use client";

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { isAdminEmail } from '@/lib/config/admin';
import Image from 'next/image';

interface Recipe {
  id: string;
  recipe_name: string;
  ingredients: string | null;
  instructions: string | null;
  comments: string | null;
  image_url: string | null;
  submission_status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  submitted_at: string | null;
}

interface GuestInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  significant_other_name: string | null;
  status: string;
}

interface UserInfo {
  full_name: string | null;
  email: string | null;
}

export default function GuestRecipesPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [guest, setGuest] = useState<GuestInfo | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const guestId = params.guestId as string;

  useEffect(() => {
    checkAdminAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestId]);

  const checkAdminAndLoadData = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !isAdminEmail(user.email)) {
      // console.log removed for production
      router.push('/');
      return;
    }
    
    // console.log removed for production
    setIsAdmin(true);
    await loadGuestRecipes();
    setLoading(false);
  };

  const loadGuestRecipes = async () => {
    try {
      const response = await fetch(`/api/v1/admin/activity/users/${userId}/guests/${guestId}/recipes`);
      if (!response.ok) throw new Error('Failed to fetch recipes');
      const data = await response.json();
      setGuest(data.guest);
      setUser(data.user);
      setRecipes(data.recipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recipes...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !guest) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/activity/${userId}`}
            className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
          >
            ← Back to {user?.full_name || 'User'}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Recipes from {guest.first_name} {guest.last_name}
          </h1>
          <div className="flex items-center gap-4 text-gray-600">
            <span>{guest.email}</span>
            {guest.significant_other_name && (
              <span>• With {guest.significant_other_name}</span>
            )}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(guest.status)}`}>
              {guest.status}
            </span>
          </div>
        </div>

        {/* Recipes */}
        <div className="space-y-6">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Recipe Header */}
              <div className="p-6 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{recipe.recipe_name}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Submitted {new Date(recipe.submitted_at || recipe.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(recipe.submission_status)}`}>
                    {recipe.submission_status}
                  </span>
                </div>
              </div>

              {/* Recipe Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Text Content */}
                  <div className="space-y-6">
                    {/* Ingredients */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingredients</h3>
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-lg">
                          {recipe.ingredients || 'No ingredients provided'}
                        </pre>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-lg">
                          {recipe.instructions || 'No instructions provided'}
                        </pre>
                      </div>
                    </div>

                    {/* Comments */}
                    {recipe.comments && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Comments</h3>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg">
                            {recipe.comments}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Image */}
                  {recipe.image_url && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Recipe Photo</h3>
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={recipe.image_url}
                          alt={recipe.recipe_name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {recipes.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500">No recipes submitted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}