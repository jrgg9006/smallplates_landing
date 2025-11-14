"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { addRecipeToCookbook, getCookbookRecipes } from "@/lib/supabase/cookbooks";
import { getAllRecipes } from "@/lib/supabase/recipes";
import { RecipeWithGuest } from "@/lib/types/database";

interface AddRecipesToCookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  cookbookId: string | null;
  onRecipesAdded?: () => void;
}

export function AddRecipesToCookbookModal({ 
  isOpen, 
  onClose, 
  cookbookId,
  onRecipesAdded 
}: AddRecipesToCookbookModalProps) {
  const [allRecipes, setAllRecipes] = useState<RecipeWithGuest[]>([]);
  const [cookbookRecipeIds, setCookbookRecipeIds] = useState<Set<string>>(new Set());
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  // Load all recipes and cookbook recipes when modal opens
  useEffect(() => {
    if (isOpen && cookbookId) {
      loadRecipes();
    }
  }, [isOpen, cookbookId]);

  const loadRecipes = async () => {
    if (!cookbookId) return;

    setRecipesLoading(true);
    setError(null);

    try {
      // Load all user recipes
      const { data: allRecipesData, error: allRecipesError } = await getAllRecipes();
      
      if (allRecipesError) {
        setError('Failed to load recipes');
        console.error('Error loading recipes:', allRecipesError);
        setRecipesLoading(false);
        return;
      }

      // Load recipes already in cookbook
      const { data: cookbookRecipes, error: cookbookError } = await getCookbookRecipes(cookbookId);
      
      if (cookbookError) {
        setError('Failed to load cookbook recipes');
        console.error('Error loading cookbook recipes:', cookbookError);
        setRecipesLoading(false);
        return;
      }

      // Create a set of recipe IDs already in the cookbook
      const existingRecipeIds = new Set(
        (cookbookRecipes || []).map(recipe => recipe.id)
      );

      setAllRecipes(allRecipesData || []);
      setCookbookRecipeIds(existingRecipeIds);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading recipes:', err);
    } finally {
      setRecipesLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedRecipeIds(new Set());
    setError(null);
    setSuccessCount(0);
    setFailedCount(0);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleToggleRecipe = (recipeId: string) => {
    // Don't allow toggling recipes already in cookbook
    if (cookbookRecipeIds.has(recipeId)) {
      return;
    }

    setSelectedRecipeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const availableRecipes = allRecipes.filter(
      recipe => !cookbookRecipeIds.has(recipe.id)
    );
    const allAvailableIds = new Set(availableRecipes.map(r => r.id));
    setSelectedRecipeIds(allAvailableIds);
  };

  const handleDeselectAll = () => {
    setSelectedRecipeIds(new Set());
  };

  const handleAddToCookbook = async () => {
    if (!cookbookId) {
      setError('No cookbook selected');
      return;
    }

    if (selectedRecipeIds.size === 0) {
      setError('Please select at least one recipe');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessCount(0);
    setFailedCount(0);

    try {
      let success = 0;
      let failed = 0;

      // Add each selected recipe to the cookbook
      const selectedRecipes = allRecipes.filter(recipe => 
        selectedRecipeIds.has(recipe.id)
      );

      for (const recipe of selectedRecipes) {
        const { error: addError } = await addRecipeToCookbook(cookbookId, recipe.id);
        
        if (addError) {
          // If recipe is already in cookbook, count as success (idempotent)
          if (addError.includes('already in this cookbook')) {
            success++;
          } else {
            failed++;
            console.error(`Failed to add recipe ${recipe.recipe_name}:`, addError);
          }
        } else {
          success++;
        }
      }

      setSuccessCount(success);
      setFailedCount(failed);

      // If all succeeded or some succeeded, show success message and close
      if (success > 0) {
        // Wait a moment to show the success message
        setTimeout(() => {
          resetForm();
          onClose();
          
          if (onRecipesAdded) {
            onRecipesAdded();
          }
        }, 1000);
      } else {
        setError('Failed to add recipes to cookbook');
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error adding recipes to cookbook:', err);
      setLoading(false);
    }
  };

  // Filter recipes that are not already in the cookbook
  const availableRecipes = allRecipes.filter(
    recipe => !cookbookRecipeIds.has(recipe.id)
  );

  // Get guest name helper
  const getGuestName = (recipe: RecipeWithGuest): string => {
    if (!recipe.guests) return 'Unknown Guest';
    if (recipe.guests.printed_name) {
      return recipe.guests.printed_name;
    }
    return `${recipe.guests.first_name} ${recipe.guests.last_name || ''}`.trim();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[80vh] flex flex-col"
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold">
            Add Recipes to Cookbook
          </DialogTitle>
          <DialogDescription>
            Select recipes to add to this cookbook
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4 py-4">
          {/* Select All / Deselect All */}
          {availableRecipes.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedRecipeIds.size} of {availableRecipes.length} selected
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="text-xs"
                >
                  Deselect All
                </Button>
              </div>
            </div>
          )}

          {/* Recipes List */}
          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
            {recipesLoading ? (
              <div className="p-8 text-center text-gray-500">
                Loading recipes...
              </div>
            ) : availableRecipes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">
                  {allRecipes.length === 0 
                    ? 'No recipes available' 
                    : 'All recipes are already in this cookbook'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {availableRecipes.map((recipe) => {
                  const isSelected = selectedRecipeIds.has(recipe.id);
                  const isInCookbook = cookbookRecipeIds.has(recipe.id);

                  return (
                    <label
                      key={recipe.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isInCookbook ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRecipe(recipe.id)}
                        disabled={isInCookbook || loading}
                        className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {recipe.recipe_name || 'Untitled Recipe'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {getGuestName(recipe)}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Success/Error Messages */}
          {successCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-600">
                Successfully added {successCount} {successCount === 1 ? 'recipe' : 'recipes'} to cookbook
                {failedCount > 0 && ` (${failedCount} failed)`}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCookbook();
            }}
            disabled={loading || selectedRecipeIds.size === 0 || !cookbookId}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading 
              ? `Adding ${selectedRecipeIds.size} recipe${selectedRecipeIds.size === 1 ? '' : 's'}...` 
              : `Add ${selectedRecipeIds.size === 0 ? 'to' : selectedRecipeIds.size} ${selectedRecipeIds.size === 1 ? 'Recipe' : 'Recipes'} to this cookbook`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

