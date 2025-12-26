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
  group: {
    id: string;
    name: string;
  } | null;
}

interface ProductionStats {
  recipesNeedingAction: number;
  recipesReadyToPrint: number;
}

interface Group {
  id: string;
  name: string;
  owner_id: string;
  owner_name: string | null;
  owner_email: string;
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithProductionStatus | null>(null);
  const [updatingField, setUpdatingField] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [downloadingImages, setDownloadingImages] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'no_action' | 'in_progress' | 'ready_to_print'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  
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
  }, [statusFilter, groupFilter, userFilter, showArchived, isAdmin]);

  // Load all users and groups once on initial mount (not from filtered results)
  useEffect(() => {
    if (isAdmin) {
      loadAllUsers();
      loadAllGroups();
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
    await loadGroups();
    setLoading(false);
  };

  const loadGroups = async () => {
    try {
      // We'll get groups from the recipes data, but for now just set empty
      // In a real implementation, you might want a separate API endpoint
      setGroups([]);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadAllGroups = async () => {
    try {
      // Load all recipes without filters to get all groups
      const response = await fetch('/api/v1/admin/operations/recipes');
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      
      // Extract unique groups from all recipes
      const uniqueGroups = new Map<string, Group>();
      data.forEach((recipe: RecipeWithProductionStatus) => {
        if (recipe.group && recipe.profiles) {
          uniqueGroups.set(recipe.group.id, {
            id: recipe.group.id,
            name: recipe.group.name,
            owner_id: recipe.profiles.id,
            owner_name: recipe.profiles.full_name,
            owner_email: recipe.profiles.email,
          });
        }
      });
      setGroups(Array.from(uniqueGroups.values()).sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      }));
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadRecipes = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (groupFilter !== 'all') {
        params.append('cookbookId', groupFilter); // Keep as cookbookId for backward compatibility
      }
      if (userFilter !== 'all') {
        params.append('userId', userFilter);
      }
      // By default, we hide archived recipes unless showArchived is true
      // BUT if the user specifically selected "Not in Group", we should show them
      if (!showArchived && groupFilter !== 'not_in_cookbook') {
        params.append('hideArchived', 'true');
      }

      const response = await fetch(`/api/v1/admin/operations/recipes?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error('Failed to fetch recipes');
      }
      
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      // Load all recipes without user filter to get all users
      const response = await fetch('/api/v1/admin/operations/recipes');
      
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
      const response = await fetch('/api/v1/admin/operations/stats');
      
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

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const copyEntireRecipe = async () => {
    if (!selectedRecipe) return;
    
    const recipeText = `Recipe Title: ${selectedRecipe.recipe_name || 'Untitled Recipe'}

Ingredients:
${selectedRecipe.ingredients || 'No ingredients provided'}

Steps:
${selectedRecipe.instructions || 'No instructions provided'}`;

    try {
      await navigator.clipboard.writeText(recipeText);
      setCopiedSection('entire-recipe');
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy recipe to clipboard');
    }
  };

  const handleProductionToggle = async (
    recipeId: string,
    field: 'text_finalized_in_indesign' | 'image_generated' | 'image_placed_in_indesign',
    value: boolean
  ) => {
    setUpdatingField(field);
    setSelectedRecipe((prev) =>
      prev
        ? {
            ...prev,
            production_status: {
              ...(prev.production_status || {
                id: '',
                text_finalized_in_indesign: false,
                image_generated: false,
                image_placed_in_indesign: false,
                operations_notes: null,
                production_completed_at: null,
                needs_review: false,
              }),
              [field]: value,
            },
          }
        : prev
    );
    try {
      const response = await fetch(`/api/v1/admin/operations/recipes/${recipeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) {
        throw new Error('Failed to update production status');
      }
      handleStatusUpdate();
    } catch (error) {
      console.error('Error updating production status from modal:', error);
      alert('Failed to update status from modal');
    } finally {
      setUpdatingField(null);
    }
  };

  const getRecipeImagesFromStorage = async (recipe: RecipeWithProductionStatus): Promise<string[]> => {
    // If document_urls exists and is not empty, use those first (primary source)
    if (recipe.document_urls && recipe.document_urls.length > 0) {
      console.log(`📁 Using document_urls (${recipe.document_urls.length} images):`, recipe.document_urls);
      return recipe.document_urls;
    }
    
    // If no document_urls but upload_method is 'image', try to get from Storage (fallback)
    if (recipe.upload_method === 'image' && recipe.guests && recipe.profiles) {
      console.log(`🔄 Fallback: Searching Storage API for recipe ${recipe.id}`);
      try {
        const supabase = createSupabaseClient();
        
        // Construct the storage path based on the known structure
        const basePath = `users/${recipe.profiles.id}/guests/${recipe.guests.id}/recipes/${recipe.id}`;
        
        // List all files in the recipe directory
        const { data: files, error } = await supabase.storage
          .from('recipes')
          .list(basePath, {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          });
        
        if (error) {
          console.error('Error listing files from storage:', error);
          return [];
        }
        
        if (!files || files.length === 0) {
          // Try alternative structures
          const imagePath = `${basePath}/images`;
          const { data: imageFiles, error: imageError } = await supabase.storage
            .from('recipes')
            .list(imagePath, {
              limit: 100,
              sortBy: { column: 'name', order: 'asc' }
            });
          
          if (imageError || !imageFiles) {
            console.error('Error listing image files:', imageError);
            return [];
          }
          
          // Convert file names to full URLs
          const fallbackUrls = imageFiles
            .filter(file => file.name && !file.name.endsWith('/')) // Filter out folders
            .map(file => {
              const { data } = supabase.storage
                .from('recipes')
                .getPublicUrl(`${imagePath}/${file.name}`);
              return data.publicUrl;
            });
          
          console.log(`✅ Storage fallback found ${fallbackUrls.length} images`);
          return fallbackUrls;
        }
        
        // Convert file names to full URLs for files in base path
        const fallbackUrls = files
          .filter(file => file.name && !file.name.endsWith('/')) // Filter out folders
          .map(file => {
            const { data } = supabase.storage
              .from('recipes')
              .getPublicUrl(`${basePath}/${file.name}`);
            return data.publicUrl;
          });
        
        console.log(`✅ Storage fallback found ${fallbackUrls.length} images in base path`);
        return fallbackUrls;
        
      } catch (error) {
        console.error('Error accessing storage:', error);
        return [];
      }
    }
    
    return [];
  };

  const handleDownloadRecipeImages = async (recipe: RecipeWithProductionStatus) => {
    console.log('Recipe data for download:', {
      id: recipe.id,
      recipe_name: recipe.recipe_name,
      document_urls: recipe.document_urls,
      upload_method: recipe.upload_method,
      user_id: recipe.profiles?.id,
      guest_id: recipe.guests?.id
    });
    
    // Get image URLs from storage
    const imageUrls = await getRecipeImagesFromStorage(recipe);
    
    if (imageUrls.length === 0) {
      alert('No images found for this recipe.');
      return;
    }
    
    setDownloadingImages(true);
    
    try {
      
      // Clean filename parts
      const cleanRecipeName = (recipe.recipe_name || 'Untitled').replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
      const cleanGuestName = (recipe.guests?.printed_name || 
        `${recipe.guests?.first_name || ''} ${recipe.guests?.last_name || ''}`.trim() || 
        'Unknown').replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
      
      // Download each image
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        
        try {
          // Fetch the image
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch image');
          
          const blob = await response.blob();
          
          // Create a download link
          const link = document.createElement('a');
          const objectUrl = URL.createObjectURL(blob);
          
          // Get file extension from URL or use jpg as default
          const urlParts = url.split('.');
          const extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';
          
          link.href = objectUrl;
          // Add index if multiple images
          const suffix = imageUrls.length > 1 ? `_${i + 1}` : '';
          link.download = `${cleanGuestName}_${cleanRecipeName}${suffix}.${extension}`;
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          URL.revokeObjectURL(objectUrl);
          
          // Small delay between downloads
          if (i < imageUrls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (error) {
          console.error(`Failed to download image from ${url}:`, error);
        }
      }
      
      alert(`Downloaded ${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''} successfully!`);
      
    } catch (error) {
      console.error('Error downloading images:', error);
      alert('Failed to download images. Please try again.');
    } finally {
      setDownloadingImages(false);
    }
  };

  const handleDownloadAllImages = async () => {
    if (!recipes || recipes.length === 0) return;
    
    setDownloadingImages(true);
    
    try {
      // Collect all image URLs from visible recipes
      const imageUrls = recipes
        .filter(recipe => recipe.image_url)
        .map(recipe => ({
          url: recipe.image_url!,
          recipeName: recipe.recipe_name || 'Untitled',
          guestName: recipe.guests?.printed_name || 
            `${recipe.guests?.first_name || ''} ${recipe.guests?.last_name || ''}`.trim() || 
            'Unknown'
        }));
      
      if (imageUrls.length === 0) {
        alert('No images found in the current recipes.');
        return;
      }
      
      // Download each image
      for (let i = 0; i < imageUrls.length; i++) {
        const { url, recipeName, guestName } = imageUrls[i];
        
        try {
          // Fetch the image
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch image');
          
          const blob = await response.blob();
          
          // Create a download link
          const link = document.createElement('a');
          const objectUrl = URL.createObjectURL(blob);
          
          // Clean filename - remove special characters
          const cleanRecipeName = recipeName.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
          const cleanGuestName = guestName.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
          
          // Get file extension from URL or use jpg as default
          const urlParts = url.split('.');
          const extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';
          
          link.href = objectUrl;
          link.download = `${cleanGuestName}_${cleanRecipeName}_${i + 1}.${extension}`;
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          URL.revokeObjectURL(objectUrl);
          
          // Small delay between downloads to prevent browser issues
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Failed to download image from ${url}:`, error);
        }
      }
      
      alert(`Downloaded ${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''} successfully!`);
      
    } catch (error) {
      console.error('Error downloading images:', error);
      alert('Failed to download some images. Please check the console for details.');
    } finally {
      setDownloadingImages(false);
    }
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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
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
      <div className="bg-white border-b px-6 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm text-red-600 font-medium">
              Recipes Needing Action: <span className="text-red-900 font-semibold">{stats.recipesNeedingAction}</span>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-sm text-green-600 font-medium">
              Recipes Ready to Print: <span className="text-green-900 font-semibold">{stats.recipesReadyToPrint}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-6 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Group:</label>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent min-w-[250px]"
          >
            <option value="all">All Groups</option>
            <option value="not_in_cookbook">Not in Group (Archived)</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                ({group.owner_name || group.owner_email}) {group.name}
              </option>
            ))}
          </select>
        </div>
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
            />
            <span className="font-medium text-gray-700">Show archived recipes</span>
          </label>
        </div>
        <div className="text-sm text-gray-600 ml-auto">
          {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 overflow-hidden">
        {/* Recipe Table */}
        <div className="h-full bg-white overflow-y-auto">
          <div className="p-6">
            <RecipeOperationsTable
              recipes={recipes}
              onRecipeClick={setSelectedRecipe}
              onStatusUpdate={handleStatusUpdate}
            />
          </div>
        </div>

        {/* Recipe Detail Sheet - Right Side Overlay */}
        {selectedRecipe && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity"
              onClick={() => setSelectedRecipe(null)}
            />
            
            {/* Sheet */}
            <div className="fixed right-0 top-0 h-full w-[75%] max-w-6xl bg-white shadow-2xl z-50 overflow-y-auto">
              {/* Sticky Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
                <div className="px-10 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl font-bold text-gray-900 pr-2">
                        {selectedRecipe.recipe_name || 'Untitled Recipe'}
                      </h2>
                      <button
                        onClick={() => copyToClipboard(selectedRecipe.recipe_name || 'Untitled Recipe', 'title')}
                        className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                        title="Copy title"
                      >
                        {copiedSection === 'title' ? (
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Download Images Button - Show when there are uploaded images */}
                      {((selectedRecipe.document_urls && selectedRecipe.document_urls.length > 0) || selectedRecipe.upload_method === 'image') && (
                        <button
                          onClick={() => handleDownloadRecipeImages(selectedRecipe)}
                          disabled={downloadingImages}
                          className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Download ${selectedRecipe.document_urls?.length || 0} recipe image${(selectedRecipe.document_urls?.length || 0) !== 1 ? 's' : ''}`}
                        >
                          {downloadingImages ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Downloading...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                              </svg>
                              <span>
                                {selectedRecipe.document_urls?.length 
                                  ? `Download ${selectedRecipe.document_urls.length} Image${selectedRecipe.document_urls.length > 1 ? 's' : ''}`
                                  : 'Download Images'
                                }
                              </span>
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={copyEntireRecipe}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        title="Copy entire recipe"
                      >
                        {copiedSection === 'entire-recipe' ? (
                          <>
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-green-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copy Entire Recipe</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedRecipe(null)}
                        className="text-gray-400 hover:text-gray-600 text-3xl font-light w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
                {/* Info Bar */}
                <div className="px-10 py-3 bg-gray-50 border-t border-gray-200 flex items-center gap-6 text-sm text-gray-600 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Shared by:</span>
                    <span>
                      {selectedRecipe.guests?.printed_name ||
                        `${selectedRecipe.guests?.first_name || ''} ${selectedRecipe.guests?.last_name || ''}`.trim() ||
                        'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Group:</span>
                    <span>{selectedRecipe.group?.name || 'Not in Group (Archived)'}</span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={selectedRecipe.production_status?.text_finalized_in_indesign || false}
                        onChange={(e) =>
                          handleProductionToggle(selectedRecipe.id, 'text_finalized_in_indesign', e.target.checked)
                        }
                        disabled={updatingField !== null}
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                      />
                      <span>Text Finalized</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={selectedRecipe.production_status?.image_generated || false}
                        onChange={(e) =>
                          handleProductionToggle(selectedRecipe.id, 'image_generated', e.target.checked)
                        }
                        disabled={updatingField !== null}
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                      />
                      <span>Image Generated</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={selectedRecipe.production_status?.image_placed_in_indesign || false}
                        onChange={(e) =>
                          handleProductionToggle(selectedRecipe.id, 'image_placed_in_indesign', e.target.checked)
                        }
                        disabled={updatingField !== null}
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                      />
                      <span>Image Placed</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-10 py-8 space-y-8">
                {/* Recipe Image */}
                {selectedRecipe.image_url && (
                  <div className="rounded-xl overflow-hidden shadow-lg bg-gray-100">
                    <div className="relative aspect-video w-full">
                      <Image
                        src={selectedRecipe.image_url}
                        alt={selectedRecipe.recipe_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1280px) 65vw, 50vw"
                      />
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      Notes
                    </h3>
                    <button
                      onClick={() => copyToClipboard(selectedRecipe.comments || '', 'notes')}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      title="Copy to clipboard"
                    >
                      {copiedSection === 'notes' ? (
                        <>
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg shadow-sm">
                    <div className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed select-text font-sans">
                      {selectedRecipe.comments || 'No notes provided'}
                    </div>
                  </div>
                </div>

                {/* Ingredients Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      Ingredients
                    </h3>
                    <button
                      onClick={() => copyToClipboard(selectedRecipe.ingredients || '', 'ingredients')}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      title="Copy to clipboard"
                    >
                      {copiedSection === 'ingredients' ? (
                        <>
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg shadow-sm">
                    <div className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed select-text font-sans">
                      {selectedRecipe.ingredients || 'No ingredients provided'}
                    </div>
                  </div>
                </div>

                {/* Steps/Instructions Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      Steps
                    </h3>
                    <button
                      onClick={() => copyToClipboard(selectedRecipe.instructions || '', 'steps')}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      title="Copy to clipboard"
                    >
                      {copiedSection === 'steps' ? (
                        <>
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg shadow-sm">
                    <div className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed select-text font-sans">
                      {selectedRecipe.instructions || 'No instructions provided'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

