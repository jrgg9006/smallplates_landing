"use client";

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdminEmail } from '@/lib/config/admin';
import { RecipeOperationsTable } from './components/RecipeOperationsTable';
import Image from 'next/image';
import PromptEvaluationSection from './components/PromptEvaluationSection';

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
  generated_image_url: string | null;
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
  midjourney_prompts: {
    generated_prompt: string;
    agent_metadata?: {
      base_dish?: string;
      food_type?: string;
      eating_method?: string;
      started_indicator?: string;
      token_count?: number;
      hero_element?: string;
      container_used?: string;
      generator_version?: string;
      total_duration_ms?: number;
    } | null;
  } | null;
  recipe_print_ready: {
    recipe_name_clean: string;
    ingredients_clean: string;
    instructions_clean: string;
    detected_language: string | null;
    cleaning_version: number | null;
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
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Toggle states for showing original vs clean versions
  const [showOriginalName, setShowOriginalName] = useState(false);
  const [showOriginalIngredients, setShowOriginalIngredients] = useState(false);
  const [showOriginalInstructions, setShowOriginalInstructions] = useState(false);
  
  // Edit states for recipe_print_ready
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedIngredients, setEditedIngredients] = useState('');
  const [editedInstructions, setEditedInstructions] = useState('');
  const [savingEdits, setSavingEdits] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [changesSummary, setChangesSummary] = useState<{
    ingredients?: { before: string; after: string };
    instructions?: { before: string; after: string };
  } | null>(null);
  
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

  // Reset toggle states when recipe changes
  useEffect(() => {
    if (selectedRecipe) {
      setShowOriginalName(false);
      setShowOriginalIngredients(false);
      setShowOriginalInstructions(false);
      setIsEditingText(false);
      // Initialize edited values from print_ready or fallback to original
      const ingredients = selectedRecipe.recipe_print_ready?.ingredients_clean || selectedRecipe.ingredients || '';
      const instructions = selectedRecipe.recipe_print_ready?.instructions_clean || selectedRecipe.instructions || '';
      setEditedIngredients(ingredients);
      setEditedInstructions(instructions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecipe?.id]); // Reason: Only reset when recipe ID changes, not on property updates

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
      // console.log removed for production
      router.push('/');
      return;
    }
    
    // console.log removed for production
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
    
    // Use clean versions if available, otherwise fall back to original
    const recipeName = selectedRecipe.recipe_print_ready?.recipe_name_clean || selectedRecipe.recipe_name || 'Untitled Recipe';
    const ingredients = selectedRecipe.recipe_print_ready?.ingredients_clean || selectedRecipe.ingredients || 'No ingredients provided';
    const instructions = selectedRecipe.recipe_print_ready?.instructions_clean || selectedRecipe.instructions || 'No instructions provided';
    
    const recipeText = `Recipe Title: ${recipeName}

Ingredients:
${ingredients}

Steps:
${instructions}`;

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
      // console.log removed for production
      return recipe.document_urls;
    }
    
    // If no document_urls but upload_method is 'image', try to get from Storage (fallback)
    if (recipe.upload_method === 'image' && recipe.guests && recipe.profiles) {
      // console.log removed for production
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
          
          // console.log removed for production
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
        
        // console.log removed for production
        return fallbackUrls;
        
      } catch (error) {
        console.error('Error accessing storage:', error);
        return [];
      }
    }
    
    return [];
  };

  const handleDownloadRecipeImages = async (recipe: RecipeWithProductionStatus) => {
    
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
        .map(recipe => {
          // Normalize image_url - handle both string and array formats
          let imageUrl: string | null = null;
          
          if (recipe.image_url) {
            if (Array.isArray(recipe.image_url)) {
              // If it's an array, take the first element and ensure it's a string
              const firstItem = recipe.image_url[0];
              if (typeof firstItem === 'string') {
                imageUrl = firstItem;
              } else if (Array.isArray(firstItem)) {
                // Nested array - take first element
                imageUrl = firstItem[0] || null;
              }
            } else if (typeof recipe.image_url === 'string') {
              // Check if it's a JSON string that looks like an array
              const trimmed = recipe.image_url.trim();
              if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                  const parsed = JSON.parse(trimmed);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    imageUrl = typeof parsed[0] === 'string' ? parsed[0] : null;
                  }
                } catch {
                  // If parsing fails, use the string as-is
                  imageUrl = recipe.image_url;
                }
              } else {
                imageUrl = recipe.image_url;
              }
            }
          }
          
          // Fallback to document_urls if image_url is not available
          if (!imageUrl && recipe.document_urls && recipe.document_urls.length > 0) {
            const docUrl = recipe.document_urls[0];
            imageUrl = typeof docUrl === 'string' ? docUrl : null;
          }
          
          // Final validation - ensure it's a valid URL string
          if (imageUrl && typeof imageUrl !== 'string') {
            imageUrl = null;
          }
          
          return imageUrl ? {
            url: imageUrl,
            recipeName: recipe.recipe_name || 'Untitled',
            guestName: recipe.guests?.printed_name || 
              `${recipe.guests?.first_name || ''} ${recipe.guests?.last_name || ''}`.trim() || 
              'Unknown',
          } : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
      
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

  const handleUploadGeneratedImage = async (recipeId: string, file: File) => {
    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/v1/admin/operations/recipes/${recipeId}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const result = await response.json();
      
      // Update local state
      setSelectedRecipe(prev => prev ? {
        ...prev,
        generated_image_url: result.url,
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
          image_generated: true,
        }
      } : prev);

      // Refresh data
      handleStatusUpdate();
      
      alert('Image uploaded successfully!');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleStartEditing = () => {
    if (!selectedRecipe) return;
    // Initialize edited values from print_ready or fallback to original
    const ingredients = selectedRecipe.recipe_print_ready?.ingredients_clean || selectedRecipe.ingredients || '';
    const instructions = selectedRecipe.recipe_print_ready?.instructions_clean || selectedRecipe.instructions || '';
    setEditedIngredients(ingredients);
    setEditedInstructions(instructions);
    setIsEditingText(true);
  };

  const handleCancelEditing = () => {
    setIsEditingText(false);
    // Reset to original values
    if (selectedRecipe) {
      const ingredients = selectedRecipe.recipe_print_ready?.ingredients_clean || selectedRecipe.ingredients || '';
      const instructions = selectedRecipe.recipe_print_ready?.instructions_clean || selectedRecipe.instructions || '';
      setEditedIngredients(ingredients);
      setEditedInstructions(instructions);
    }
  };

  const handleSaveClick = () => {
    if (!selectedRecipe) return;
    
    // Get original values
    const originalIngredients = selectedRecipe.recipe_print_ready?.ingredients_clean || selectedRecipe.ingredients || '';
    const originalInstructions = selectedRecipe.recipe_print_ready?.instructions_clean || selectedRecipe.instructions || '';
    
    // Calculate changes
    const changes: typeof changesSummary = {};
    if (editedIngredients !== originalIngredients) {
      changes.ingredients = { before: originalIngredients, after: editedIngredients };
    }
    if (editedInstructions !== originalInstructions) {
      changes.instructions = { before: originalInstructions, after: editedInstructions };
    }
    
    // If no changes, just exit edit mode
    if (!changes.ingredients && !changes.instructions) {
      setIsEditingText(false);
      return;
    }
    
    // Show confirmation modal
    setChangesSummary(changes);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (!selectedRecipe || !changesSummary) return;
    
    setSavingEdits(true);
    
    try {
      const response = await fetch(`/api/v1/admin/operations/recipes/${selectedRecipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printReady: {
            ingredients_clean: editedIngredients,
            instructions_clean: editedInstructions,
          },
          markNeedsReview: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save changes');
      }

      // Update local state
      setSelectedRecipe(prev => prev ? {
        ...prev,
        recipe_print_ready: {
          ...(prev.recipe_print_ready || {
            recipe_name_clean: prev.recipe_name || '',
            ingredients_clean: '',
            instructions_clean: '',
            detected_language: null,
            cleaning_version: null,
          }),
          ingredients_clean: editedIngredients,
          instructions_clean: editedInstructions,
        },
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
          needs_review: true,
        },
      } : prev);

      // Refresh data
      handleStatusUpdate();
      
      // Close modal and exit edit mode
      setShowConfirmModal(false);
      setIsEditingText(false);
      setChangesSummary(null);
      
      alert('Changes saved successfully!');
      
    } catch (error) {
      console.error('Error saving changes:', error);
      alert(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setSavingEdits(false);
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
            <h1 className="text-xl font-bold text-gray-900">Operations</h1>
            <p className="text-xs text-gray-600 mt-1">Track recipe production workflow</p>
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
            <div className="text-xs text-red-600 font-medium">
              Recipes Needing Action: <span className="text-red-900 font-semibold">{stats.recipesNeedingAction}</span>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-green-600 font-medium">
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
              onRecipeClick={(recipe) => setSelectedRecipe(recipe)}
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
            <div className="fixed right-0 top-0 h-full w-[80%] max-w-7xl bg-white shadow-2xl z-50 overflow-y-auto">
              {/* Sticky Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
                <div className="px-10 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center gap-2 flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 pr-2">
                          {showOriginalName || !selectedRecipe.recipe_print_ready?.recipe_name_clean
                            ? (selectedRecipe.recipe_name || 'Untitled Recipe')
                            : selectedRecipe.recipe_print_ready.recipe_name_clean}
                        </h2>
                        {selectedRecipe.recipe_print_ready?.recipe_name_clean && (
                          <button
                            onClick={() => setShowOriginalName(!showOriginalName)}
                            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title={showOriginalName ? 'Show cleaned version' : 'Show original version'}
                          >
                            {showOriginalName ? 'Clean' : 'Original'}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const nameToCopy = showOriginalName || !selectedRecipe.recipe_print_ready?.recipe_name_clean
                            ? (selectedRecipe.recipe_name || 'Untitled Recipe')
                            : selectedRecipe.recipe_print_ready.recipe_name_clean;
                          copyToClipboard(nameToCopy, 'title');
                        }}
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
                      {/* Edit Text Button */}
                      {!isEditingText ? (
                        <button
                          onClick={handleStartEditing}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                          title="Edit Ingredients and Steps"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit text</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCancelEditing}
                            disabled={savingEdits}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveClick}
                            disabled={savingEdits}
                            className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save
                          </button>
                        </div>
                      )}
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
              <div className="px-10 py-6 space-y-6">
                {/* Recipe Image */}
                {(() => {
                  // Normalize image_url - handle both string and array formats
                  let imageUrl: string | null = null;
                  
                  if (selectedRecipe.image_url) {
                    if (Array.isArray(selectedRecipe.image_url)) {
                      // If it's an array, take the first element and ensure it's a string
                      const firstItem = selectedRecipe.image_url[0];
                      if (typeof firstItem === 'string') {
                        imageUrl = firstItem;
                      } else if (Array.isArray(firstItem)) {
                        // Nested array - take first element
                        imageUrl = firstItem[0] || null;
                      }
                    } else if (typeof selectedRecipe.image_url === 'string') {
                      // Check if it's a JSON string that looks like an array
                      const trimmed = selectedRecipe.image_url.trim();
                      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                        try {
                          const parsed = JSON.parse(trimmed);
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            imageUrl = typeof parsed[0] === 'string' ? parsed[0] : null;
                          }
                        } catch {
                          // If parsing fails, use the string as-is
                          imageUrl = selectedRecipe.image_url;
                        }
                      } else {
                        imageUrl = selectedRecipe.image_url;
                      }
                    }
                  }
                  
                  // Fallback to document_urls if image_url is not available
                  if (!imageUrl && selectedRecipe.document_urls && selectedRecipe.document_urls.length > 0) {
                    const docUrl = selectedRecipe.document_urls[0];
                    imageUrl = typeof docUrl === 'string' ? docUrl : null;
                  }
                  
                  // Final validation - ensure it's a valid URL string
                  if (imageUrl && typeof imageUrl !== 'string') {
                    imageUrl = null;
                  }
                  
                  return imageUrl ? (
                    <div className="rounded-xl overflow-hidden shadow-lg bg-gray-100">
                      <div className="relative aspect-video w-full">
                        <Image
                          src={imageUrl}
                          alt={selectedRecipe.recipe_name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1280px) 65vw, 50vw"
                        />
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Notes Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
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
                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed select-text font-sans">
                      {selectedRecipe.comments || 'No notes provided'}
                    </div>
                  </div>
                </div>

                {/* Midjourney Prompt Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Midjourney Prompt
                    </h3>
                    {selectedRecipe.midjourney_prompts && (
                      <button
                        onClick={() => copyToClipboard(selectedRecipe.midjourney_prompts!.generated_prompt, 'midjourney-prompt')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                        title="Copy to clipboard"
                      >
                        {copiedSection === 'midjourney-prompt' ? (
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
                    )}
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm">
                    {selectedRecipe.midjourney_prompts ? (
                      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed select-text font-sans">
                        {selectedRecipe.midjourney_prompts.generated_prompt}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        No Midjourney prompt generated yet for this recipe.
                      </div>
                    )}
                  </div>
                </div>

                {/* Generated Image Upload Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Generated Image
                    </h3>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm">
                    {selectedRecipe.generated_image_url ? (
                      <div className="space-y-4">
                        <div className="relative aspect-square w-64 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={selectedRecipe.generated_image_url}
                            alt={`Generated image for ${selectedRecipe.recipe_name}`}
                            fill
                            className="object-cover"
                            sizes="256px"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Image uploaded
                          </span>
                          <label className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-800 underline">
                              Replace image
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUploadGeneratedImage(selectedRecipe.id, file);
                                }
                                e.target.value = '';
                              }}
                              disabled={uploadingImage}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="mb-4">
                          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 mb-4">No generated image yet</p>
                        <label className="cursor-pointer">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            uploadingImage 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-black text-white hover:bg-gray-800'
                          }`}>
                            {uploadingImage ? (
                              <>
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span>Upload Generated Image</span>
                              </>
                            )}
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleUploadGeneratedImage(selectedRecipe.id, file);
                              }
                              e.target.value = '';
                            }}
                            disabled={uploadingImage}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt Evaluation Section */}
                <PromptEvaluationSection
                  recipeId={selectedRecipe.id}
                  promptText={selectedRecipe.midjourney_prompts?.generated_prompt || null}
                  midjourneyImageUrl={selectedRecipe.generated_image_url || null}
                  dishCategory={selectedRecipe.midjourney_prompts?.agent_metadata?.food_type || null}
                  agentMetadata={selectedRecipe.midjourney_prompts?.agent_metadata || null}
                  onEvaluationSaved={() => handleStatusUpdate()}
                />

                {/* Ingredients Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Ingredients
                      </h3>
                      {!isEditingText && selectedRecipe.recipe_print_ready?.ingredients_clean && (
                        <>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                            Cleaned
                          </span>
                          <button
                            onClick={() => setShowOriginalIngredients(!showOriginalIngredients)}
                            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title={showOriginalIngredients ? 'Show cleaned version' : 'Show original version'}
                          >
                            {showOriginalIngredients ? 'Show Clean' : 'Show Original'}
                          </button>
                        </>
                      )}
                    </div>
                    {!isEditingText && (
                      <button
                        onClick={() => {
                          const ingredientsToCopy = showOriginalIngredients || !selectedRecipe.recipe_print_ready?.ingredients_clean
                            ? (selectedRecipe.ingredients || '')
                            : selectedRecipe.recipe_print_ready.ingredients_clean;
                          copyToClipboard(ingredientsToCopy, 'ingredients');
                        }}
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
                    )}
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm">
                    {isEditingText ? (
                      <textarea
                        value={editedIngredients}
                        onChange={(e) => setEditedIngredients(e.target.value)}
                        className="w-full min-h-[200px] px-3 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-sans resize-y"
                        placeholder="Enter ingredients..."
                      />
                    ) : (
                      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed select-text font-sans">
                        {showOriginalIngredients || !selectedRecipe.recipe_print_ready?.ingredients_clean
                          ? (selectedRecipe.ingredients || 'No ingredients provided')
                          : selectedRecipe.recipe_print_ready.ingredients_clean}
                      </div>
                    )}
                  </div>
                </div>

                {/* Steps/Instructions Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Steps
                      </h3>
                      {!isEditingText && selectedRecipe.recipe_print_ready?.instructions_clean && (
                        <>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                            Cleaned
                          </span>
                          <button
                            onClick={() => setShowOriginalInstructions(!showOriginalInstructions)}
                            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title={showOriginalInstructions ? 'Show cleaned version' : 'Show original version'}
                          >
                            {showOriginalInstructions ? 'Show Clean' : 'Show Original'}
                          </button>
                        </>
                      )}
                    </div>
                    {!isEditingText && (
                      <button
                        onClick={() => {
                          const instructionsToCopy = showOriginalInstructions || !selectedRecipe.recipe_print_ready?.instructions_clean
                            ? (selectedRecipe.instructions || '')
                            : selectedRecipe.recipe_print_ready.instructions_clean;
                          copyToClipboard(instructionsToCopy, 'steps');
                        }}
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
                    )}
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg shadow-sm">
                    {isEditingText ? (
                      <textarea
                        value={editedInstructions}
                        onChange={(e) => setEditedInstructions(e.target.value)}
                        className="w-full min-h-[200px] px-3 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-sans resize-y"
                        placeholder="Enter steps..."
                      />
                    ) : (
                      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed select-text font-sans">
                        {showOriginalInstructions || !selectedRecipe.recipe_print_ready?.instructions_clean
                          ? (selectedRecipe.instructions || 'No instructions provided')
                          : selectedRecipe.recipe_print_ready.instructions_clean}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && changesSummary && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-[60] transition-opacity"
              onClick={() => !savingEdits && setShowConfirmModal(false)}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                  <h2 className="text-2xl font-bold text-gray-900">This is what you changed</h2>
                </div>
                
                <div className="px-6 py-6 space-y-6">
                  {changesSummary.ingredients && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">Before:</div>
                          <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg text-sm text-gray-800 whitespace-pre-wrap font-sans">
                            {changesSummary.ingredients.before || '(empty)'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">After:</div>
                          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-sm text-gray-800 whitespace-pre-wrap font-sans">
                            {changesSummary.ingredients.after || '(empty)'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {changesSummary.instructions && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Steps</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">Before:</div>
                          <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg text-sm text-gray-800 whitespace-pre-wrap font-sans">
                            {changesSummary.instructions.before || '(empty)'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-1">After:</div>
                          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-sm text-gray-800 whitespace-pre-wrap font-sans">
                            {changesSummary.instructions.after || '(empty)'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    disabled={savingEdits}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    disabled={savingEdits}
                    className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {savingEdits ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

