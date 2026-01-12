"use client";

import React, { useState, useEffect } from "react";
import { RecipeWithGuest } from "@/lib/types/database";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import Image from "next/image";
import { updateRecipe } from "@/lib/supabase/recipes";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getRecipeGroups } from "@/lib/supabase/groupRecipes";
import { isGroupMember } from "@/lib/supabase/groupMembers";

interface RecipeDetailsModalProps {
  recipe: RecipeWithGuest | null;
  isOpen: boolean;
  onClose: () => void;
  onRecipeUpdated?: () => void;
  initialEditMode?: boolean;
}

export function RecipeDetailsModal({ recipe, isOpen, onClose, onRecipeUpdated, initialEditMode = false }: RecipeDetailsModalProps) {
  const { user } = useAuth();
  
  // Local state for recipe to allow immediate updates after editing
  const [localRecipe, setLocalRecipe] = useState<RecipeWithGuest | null>(recipe);
  
  // Responsive hook to detect mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  const [recipeNotes, setRecipeNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Groups state
  const [recipeGroups, setRecipeGroups] = useState<Array<{ group_id: string; group_name: string }>>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  // Update local recipe when prop changes
  useEffect(() => {
    if (recipe) {
      setLocalRecipe(recipe);
    }
  }, [recipe]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640); // sm breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Also check on component mount with a more reliable method
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
    }
  }, [isOpen]);

  // Reset edit mode when modal closes or set initial edit mode when modal opens
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setError(null);
    } else {
      // Set edit mode based on initialEditMode when modal opens
      setIsEditMode(initialEditMode);
    }
  }, [isOpen, initialEditMode]);

  // Initialize form state when entering edit mode
  useEffect(() => {
    if (localRecipe && isEditMode) {
      setRecipeTitle(localRecipe.recipe_name || '');
      setRecipeIngredients(localRecipe.ingredients || '');
      setRecipeInstructions(localRecipe.instructions || '');
      setRecipeNotes(localRecipe.comments || '');
      setError(null);
    }
  }, [localRecipe, isEditMode]);

  // Load groups and check permissions when modal opens
  useEffect(() => {
    const loadGroupsAndCheckPermissions = async () => {
      if (!localRecipe || !isOpen || !user) {
        setRecipeGroups([]);
        setCanEdit(false);
        return;
      }

      setLoadingGroups(true);
      try {
        // Get groups for the recipe
        const { data: groupsData, error: groupsError } = await getRecipeGroups(localRecipe.id);
        
        if (groupsError) {
          console.error('Error loading groups:', groupsError);
          setRecipeGroups([]);
        } else {
          const groups = groupsData || [];
          setRecipeGroups(groups);
          
          // Check if user is creator (can always edit)
          const isCreator = localRecipe.user_id === user.id;
          
          // Check if user is member of any group
          let isMemberOfGroup = false;
          if (groups.length > 0) {
            for (const group of groups) {
              const { data: isMember } = await isGroupMember(group.group_id);
              if (isMember) {
                isMemberOfGroup = true;
                break;
              }
            }
          }
          
          // User can edit if they're the creator OR a member of a group
          setCanEdit(isCreator || isMemberOfGroup);
        }
      } catch (err) {
        console.error('Unexpected error loading groups:', err);
        setRecipeGroups([]);
        setCanEdit(false);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadGroupsAndCheckPermissions();
  }, [localRecipe, isOpen, user]);

  const handleCancel = () => {
    setIsEditMode(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!localRecipe) return;

    // Validation
    if (!recipeTitle.trim()) {
      setError('Please fill in Recipe Title');
      return;
    }

    if (!recipeIngredients.trim() || !recipeInstructions.trim()) {
      setError('Please fill in Ingredients and Instructions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updates = {
        recipe_name: recipeTitle.trim(),
        ingredients: recipeIngredients.trim(),
        instructions: recipeInstructions.trim(),
        comments: recipeNotes.trim() || null,
      };

      const { error: updateError } = await updateRecipe(localRecipe.id, updates);

      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      // Mark Midjourney prompt as needing regeneration (if content changed)
      const supabase = (await import('@/lib/supabase/client')).createSupabaseClient();
      await supabase
        .from('midjourney_prompts')
        .update({ needs_regeneration: true })
        .eq('recipe_id', localRecipe.id);

      // Success! Update local recipe state immediately
      setLocalRecipe({
        ...localRecipe,
        recipe_name: recipeTitle.trim(),
        ingredients: recipeIngredients.trim(),
        instructions: recipeInstructions.trim(),
        comments: recipeNotes.trim() || null,
      });
      
      setIsEditMode(false);
      
      // Refresh parent component if callback provided
      if (onRecipeUpdated) {
        onRecipeUpdated();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating recipe:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!localRecipe) return null;

  const guest = localRecipe.guests;
  const guestName = guest 
    ? (guest.printed_name || `${guest.first_name} ${guest.last_name || ''}`.trim())
    : 'Unknown Guest';
  const guestEmail = guest?.email || null;

  const sourceLabel = localRecipe.guests?.source === 'collection'
    ? 'Collected from link'
    : 'Added manually';

  // Helper function to determine if recipe is still processing
  const isRecipeProcessing = () => {
    if (localRecipe.upload_method !== 'image') return false;
    if (!localRecipe.document_urls || localRecipe.document_urls.length === 0) return false;
    
    // Check if ingredients/instructions contain placeholder text
    const ingredients = localRecipe.ingredients || '';
    const instructions = localRecipe.instructions || '';
    
    const isPlaceholderIngredients = ingredients === 'See uploaded images';
    const isPlaceholderInstructions = instructions.match(/^\d+ images? uploaded$/);
    
    return isPlaceholderIngredients || isPlaceholderInstructions;
  };

  const showProcessingIndicator = isRecipeProcessing();

  // Format groups text
  const formatGroupsText = () => {
    if (loadingGroups) {
      return '';
    }
    if (recipeGroups.length === 0) {
      return '';
    }
    if (recipeGroups.length === 1) {
      return `. Active in Group: ${recipeGroups[0].group_name}`;
    }
    return `. Active in Groups: ${recipeGroups.map(g => g.group_name).join(', ')}`;
  };

  // Content component for desktop - two column layout
  const desktopContent = (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Recipe Title and Subtitle */}
      <div className="flex-shrink-0 mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-4xl font-semibold text-gray-900 leading-tight mb-2">
              {localRecipe.recipe_name || 'Untitled Recipe'}
            </h2>
            <p className="font-serif italic text-lg text-gray-700">
              Shared by {guestName}
            </p>
          </div>
          {canEdit && !isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 mt-1"
              aria-label="Edit recipe"
            >
              <Edit className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Comments/Notes - Full width above ingredients and instructions */}
      {localRecipe.comments && localRecipe.comments.trim() && (
        <div className="flex-shrink-0 mb-8">
          <Label className="text-sm font-medium text-gray-600 mb-2 block font-sans">Special note</Label>
          <pre className="whitespace-pre-wrap font-sans font-light text-sm text-gray-700 leading-relaxed m-0">
            {localRecipe.comments}
          </pre>
        </div>
      )}

      {/* Recipe Image */}
      {localRecipe.document_urls && localRecipe.document_urls.length > 0 && (
        <div className="flex-shrink-0 mb-6">
          <div className="rounded-xl overflow-hidden shadow-lg bg-gray-100">
            <div className="relative aspect-video w-full">
              <Image
                src={localRecipe.document_urls[0]}
                alt={localRecipe.recipe_name || 'Recipe image'}
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 65vw, 50vw"
              />
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Ingredients (left) and Instructions (right) */}
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_2fr] gap-8">
        {/* Left Column - Ingredients */}
        <div className="flex flex-col h-full">
          <Label className="text-sm font-medium text-gray-600 mb-2 block font-sans flex-shrink-0">What ingredients you will need</Label>
          {showProcessingIndicator ? (
            <div className="flex items-center text-sm text-blue-600 italic font-sans font-light m-0">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Processing image...
            </div>
          ) : localRecipe.ingredients && localRecipe.ingredients.trim() ? (
            <pre className="whitespace-pre-wrap break-words font-sans font-light text-sm text-gray-700 leading-relaxed m-0 overflow-wrap-anywhere">
              {localRecipe.ingredients}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic font-sans font-light m-0">No ingredients provided</p>
          )}
        </div>

        {/* Right Column - Instructions */}
        <div className="flex flex-col h-full">
          <Label className="text-sm font-medium text-gray-600 mb-2 block font-sans flex-shrink-0">The magic happens here</Label>
          {showProcessingIndicator ? (
            <div className="flex items-center text-sm text-blue-600 italic font-sans font-light m-0">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Processing image...
            </div>
          ) : localRecipe.instructions && localRecipe.instructions.trim() ? (
            <pre className="whitespace-pre-wrap break-words font-sans font-light text-sm text-gray-700 leading-relaxed m-0 overflow-wrap-anywhere">
              {localRecipe.instructions}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic font-sans font-light m-0">No instructions provided</p>
          )}
        </div>
      </div>
    </div>
  );

  // Content component for mobile - stacked layout
  const mobileContent = (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Recipe Title and Subtitle */}
      <div className="flex-shrink-0 mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-3xl font-semibold text-gray-900 leading-tight mb-2">
              {localRecipe.recipe_name || 'Untitled Recipe'}
            </h2>
            <p className="font-serif italic text-base text-gray-700">
              Shared by {guestName}
            </p>
          </div>
          {canEdit && !isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 mt-1"
              aria-label="Edit recipe"
            >
              <Edit className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Comments/Notes - Above ingredients and instructions */}
      {localRecipe.comments && localRecipe.comments.trim() && (
        <div className="flex-shrink-0 mb-6">
          <Label className="text-sm font-medium text-gray-700 mb-3 block font-sans">Special note</Label>
          <pre className="whitespace-pre-wrap font-sans font-light text-base text-gray-700 leading-relaxed m-0">
            {localRecipe.comments}
          </pre>
        </div>
      )}

      {/* Recipe Image */}
      {localRecipe.document_urls && localRecipe.document_urls.length > 0 && (
        <div className="flex-shrink-0 mb-6">
          <div className="rounded-xl overflow-hidden shadow-lg bg-gray-100">
            <div className="relative aspect-video w-full">
              <Image
                src={localRecipe.document_urls[0]}
                alt={localRecipe.recipe_name || 'Recipe image'}
                fill
                className="object-cover"
                sizes="95vw"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stacked Layout for Mobile */}
      <div className="flex-1 space-y-6 pb-6">
        {/* Ingredients */}
        <div>
          <Label className="text-sm font-medium text-gray-600 mb-2 block font-sans">What ingredients you will need</Label>
          {showProcessingIndicator ? (
            <div className="flex items-center text-base text-blue-600 italic font-sans font-light m-0">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Processing image...
            </div>
          ) : localRecipe.ingredients && localRecipe.ingredients.trim() ? (
            <pre className="whitespace-pre-wrap font-sans font-light text-base text-gray-700 leading-relaxed m-0">
              {localRecipe.ingredients}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic font-sans font-light m-0">No ingredients provided</p>
          )}
        </div>

        {/* Instructions */}
        <div>
          <Label className="text-sm font-medium text-gray-600 mb-2 block font-sans">The magic happens here</Label>
          {showProcessingIndicator ? (
            <div className="flex items-center text-base text-blue-600 italic font-sans font-light m-0">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Processing image...
            </div>
          ) : localRecipe.instructions && localRecipe.instructions.trim() ? (
            <pre className="whitespace-pre-wrap font-sans font-light text-base text-gray-700 leading-relaxed m-0">
              {localRecipe.instructions}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic font-sans font-light m-0">No instructions provided</p>
          )}
        </div>
      </div>
    </div>
  );

  // Edit content component for desktop - reusing AddRecipeModal styling patterns
  const desktopEditContent = (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Recipe Title Section - Editable */}
      <div className="flex-shrink-0 mb-6">
        <input
          type="text"
          value={recipeTitle}
          onChange={(e) => setRecipeTitle(e.target.value)}
          placeholder="Recipe name"
          className="w-full font-serif text-3xl font-semibold text-gray-900 leading-tight bg-transparent border-0 border-b-2 border-gray-200 px-0 py-4 focus:outline-none focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 placeholder:font-normal transition-all duration-200"
          required
        />
        <p className="font-serif italic text-base text-gray-600 mt-2">
          Shared by {guestName}
        </p>
      </div>

      {/* Notes Section - Full width above ingredients and instructions */}
      <div className="flex-shrink-0 mb-8">
        <Label className="text-sm font-medium text-gray-600 mb-2 block font-sans">Edit the special note (only if necessary)</Label>
        <textarea
          value={recipeNotes}
          onChange={(e) => setRecipeNotes(e.target.value)}
          placeholder="Made this at 2am more times than I will admit."
          className="w-full text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 resize-none min-h-[80px] transition-all duration-200"
        />
      </div>

      {/* Two Column Layout: Ingredients (left) and Instructions (right) */}
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_2fr] gap-8">
        {/* Left Column - Ingredients */}
        <div className="flex flex-col h-full">
          <Label className="text-sm font-medium text-gray-600 mb-2 block font-sans flex-shrink-0">What ingredients you will need</Label>
          <textarea
            value={recipeIngredients}
            onChange={(e) => setRecipeIngredients(e.target.value)}
            placeholder="Pecorino, not parmesan. Good eggs. The real guanciale."
            className="flex-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white border border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 resize-none font-sans transition-all duration-200"
          />
        </div>

        {/* Right Column - Instructions */}
        <div className="flex flex-col h-full">
          <Label className="text-sm font-medium text-gray-600 mb-2 block font-sans flex-shrink-0">
            The magic happens here
          </Label>
          <textarea
            value={recipeInstructions}
            onChange={(e) => setRecipeInstructions(e.target.value)}
            placeholder="Start with cold pan. Trust the process. Save the pasta water—you will need it."
            className="flex-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white border border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 resize-none font-sans transition-all duration-200"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex-shrink-0 bg-red-50/50 border border-red-200 rounded-xl p-3 mt-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );

  // Edit content component for mobile - reusing AddRecipeModal styling patterns
  const mobileEditContent = (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Recipe Title Section - Editable */}
      <div className="flex-shrink-0 mb-6 pb-4 border-b border-gray-200">
        <input
          type="text"
          value={recipeTitle}
          onChange={(e) => setRecipeTitle(e.target.value)}
          placeholder="Recipe name"
          className="w-full font-serif text-3xl font-semibold text-gray-900 leading-tight bg-transparent border-0 border-b-2 border-gray-200 px-0 py-2 focus:outline-none focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 transition-all duration-200"
          required
        />
        <p className="font-serif italic text-base text-gray-700 mt-2">
          Shared by {guestName}
        </p>
      </div>

      {/* Stacked Layout for Mobile */}
      <div className="flex-1 space-y-6 pb-6">
        {/* Notes */}
        <div>
          <Label htmlFor="recipeNotes" className="text-sm font-medium text-gray-600 mb-2 block font-sans">Edit the special note (only if necessary)</Label>
          <textarea
            id="recipeNotes"
            value={recipeNotes}
            onChange={(e) => setRecipeNotes(e.target.value)}
            placeholder="Made this at 2am more times than I will admit."
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] resize-vertical min-h-[80px] bg-white transition-all duration-200 placeholder:text-gray-400"
          />
        </div>

        {/* Ingredients */}
        <div>
          <Label htmlFor="recipeIngredients" className="text-sm font-medium text-gray-600 mb-2 block font-sans">What ingredients you will need</Label>
          <textarea
            id="recipeIngredients"
            value={recipeIngredients}
            onChange={(e) => setRecipeIngredients(e.target.value)}
            placeholder="Pecorino, not parmesan. Good eggs. The real guanciale."
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] resize-vertical min-h-[100px] bg-white font-sans transition-all duration-200 placeholder:text-gray-400"
          />
        </div>

        {/* Instructions */}
        <div>
          <Label htmlFor="recipeInstructions" className="text-sm font-medium text-gray-600 mb-2 block font-sans">The magic happens here</Label>
          <textarea
            id="recipeInstructions"
            value={recipeInstructions}
            onChange={(e) => setRecipeInstructions(e.target.value)}
            placeholder="Start with cold pan. Trust the process. Save the pasta water—you will need it."
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] resize-vertical min-h-[140px] bg-white font-sans transition-all duration-200 placeholder:text-gray-400"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );

  // Mobile version - Sheet that slides up from bottom
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="!h-[85vh] !max-h-[85vh] rounded-t-[20px] flex flex-col overflow-hidden p-0">
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-gray-300" />
          
          <div className="px-6 pt-4 pb-6 flex flex-col h-full overflow-hidden">
            <SheetHeader className="px-0 flex-shrink-0 mb-4">
              <SheetTitle className="font-serif text-2xl font-semibold">Recipe Details</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col overflow-y-auto">
              {isEditMode ? mobileEditContent : mobileContent}
            </div>
            
            {/* Save/Cancel Buttons - Fixed bottom for mobile when in edit mode */}
            {isEditMode && (
              <div className="mt-4 pb-safe flex-shrink-0 border-t border-gray-200 pt-4 space-y-2">
                <Button 
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  onClick={handleCancel}
                  disabled={loading}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-full"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version - Dialog popup (centered)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 bg-white">
        <DialogHeader className="flex-shrink-0 px-8 pt-6 pb-2">
          <DialogTitle className="font-serif text-2xl font-semibold text-gray-900">Recipe Details</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col pl-8 pr-8 pt-8 pb-6 min-w-0 overflow-y-auto">
          {isEditMode ? desktopEditContent : desktopContent}
        </div>
          
        {/* Action Buttons - Fixed position at bottom when in edit mode */}
          {isEditMode && (
          <div className="flex justify-end gap-3 flex-shrink-0 bg-white px-8 py-4 border-t border-gray-200">
                <Button 
              variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={loading}
              className="bg-black text-white hover:bg-gray-800 rounded-full disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
}

