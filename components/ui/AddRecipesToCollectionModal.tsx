"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAllRecipes } from "@/lib/supabase/recipes";
import { RecipeWithGuest } from "@/lib/types/database";

export interface AddRecipesToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string | null;
  collectionType: "cookbook" | "group";
  onAddRecipe: (collectionId: string, recipeId: string) => Promise<{ error?: string; data?: any }>;
  onGetExistingRecipes: (collectionId: string) => Promise<{ data?: any[]; error?: string }>;
  onRecipesAdded?: () => void;
  // Optional text overrides
  title?: string;
  description?: string;
  alreadyAddedText?: string;
}

export function AddRecipesToCollectionModal({ 
  isOpen, 
  onClose, 
  collectionId,
  collectionType,
  onAddRecipe,
  onGetExistingRecipes,
  onRecipesAdded,
  title,
  description,
  alreadyAddedText
}: AddRecipesToCollectionModalProps) {
  const [allRecipes, setAllRecipes] = useState<RecipeWithGuest[]>([]);
  const [existingRecipeIds, setExistingRecipeIds] = useState<Set<string>>(new Set());
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  // Dynamic text generation
  const collectionName = collectionType === "cookbook" ? "cookbook" : "group";
  const collectionNameCapitalized = collectionType === "cookbook" ? "Cookbook" : "Group";
  
  const defaultTitle = title || `Add Recipes to ${collectionNameCapitalized}`;
  const defaultDescription = description || (
    collectionType === "cookbook" 
      ? `Select recipes to add to this ${collectionName}`
      : `Select recipes from your collection to share with the ${collectionName}.`
  );
  const defaultAlreadyAddedText = alreadyAddedText || "Already added";

  const loadRecipes = useCallback(async () => {
    if (!collectionId) return;

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

      // Load recipes already in collection
      const { data: existingRecipes, error: existingError } = await onGetExistingRecipes(collectionId);
      
      if (existingError) {
        setError(`Failed to load ${collectionName} recipes`);
        console.error(`Error loading ${collectionName} recipes:`, existingError);
        setRecipesLoading(false);
        return;
      }

      // Create a set of recipe IDs already in the collection
      const existingIds = new Set(
        (existingRecipes || []).map(recipe => recipe.id)
      );

      setAllRecipes(allRecipesData || []);
      setExistingRecipeIds(existingIds);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading recipes:', err);
    } finally {
      setRecipesLoading(false);
    }
  }, [collectionId, onGetExistingRecipes, collectionName]);

  // Load all recipes when modal opens
  useEffect(() => {
    if (isOpen && collectionId) {
      loadRecipes();
    }
  }, [isOpen, collectionId, loadRecipes]);

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
    // Don't allow toggling recipes already in collection
    if (existingRecipeIds.has(recipeId)) {
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
      recipe => !existingRecipeIds.has(recipe.id)
    );
    const allAvailableIds = new Set(availableRecipes.map(r => r.id));
    setSelectedRecipeIds(allAvailableIds);
  };

  const handleDeselectAll = () => {
    setSelectedRecipeIds(new Set());
  };

  const handleAddToCollection = async () => {
    if (!collectionId) {
      setError(`No ${collectionName} selected`);
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

      // Add each selected recipe to the collection
      for (const recipeId of selectedRecipeIds) {
        const { error: addError } = await onAddRecipe(collectionId, recipeId);
        
        if (addError) {
          // If recipe is already in collection, count as success (idempotent)
          if (addError.includes(`already in this ${collectionName}`)) {
            success++;
          } else {
            failed++;
            console.error(`Failed to add recipe ${recipeId}:`, addError);
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
        }, collectionType === "cookbook" ? 1000 : 1500);
      } else {
        setError(`Failed to add recipes to ${collectionName}`);
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(`Error adding recipes to ${collectionName}:`, err);
      setLoading(false);
    }
  };

  // Count available recipes (not already in collection)
  const availableRecipes = allRecipes.filter(
    recipe => !existingRecipeIds.has(recipe.id)
  );
  const availableCount = availableRecipes.length;

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
            {defaultTitle}
          </DialogTitle>
          <DialogDescription>
            {defaultDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4 py-4">
          {/* Select All / Deselect All */}
          {allRecipes.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedRecipeIds.size} of {availableCount} available
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
            ) : allRecipes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">
                  No recipes available
                </p>
              </div>
            ) : availableCount === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">
                  {collectionType === "cookbook" 
                    ? `All recipes are already in this ${collectionName}`
                    : `All your recipes are already in this ${collectionName}.`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {allRecipes.map((recipe) => {
                  const isSelected = selectedRecipeIds.has(recipe.id);
                  const isInCollection = existingRecipeIds.has(recipe.id);

                  return (
                    <label
                      key={recipe.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isInCollection ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRecipe(recipe.id)}
                        disabled={isInCollection || loading}
                        className="w-5 h-5 rounded border-gray-300 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed flex-shrink-0 text-black focus:ring-black"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {recipe.recipe_name || 'Untitled Recipe'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {getGuestName(recipe)}
                        </div>
                      </div>
                      {isInCollection && (
                        <div className="flex-shrink-0">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {defaultAlreadyAddedText}
                          </span>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Success/Error Messages */}
          {successCount > 0 && (
            <div className={`${
              collectionType === "cookbook" ? "bg-green-50 border border-green-200 rounded-md p-3" : "mt-4 p-4 bg-green-50 border border-green-200 rounded-md"
            }`}>
              <p className={`${
                collectionType === "cookbook" ? "text-sm text-green-600" : "text-green-600"
              }`}>
                {collectionType === "cookbook"
                  ? `Successfully added ${successCount} ${successCount === 1 ? 'recipe' : 'recipes'} to ${collectionName}${
                      failedCount > 0 ? ` (${failedCount} failed)` : ''
                    }`
                  : `Successfully added ${successCount} recipe${successCount > 1 ? 's' : ''} to the ${collectionName}!`
                }
              </p>
              {failedCount > 0 && collectionType === "group" && (
                <p className="text-red-600 mt-1">
                  Failed to add {failedCount} recipe{failedCount > 1 ? 's' : ''}.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className={`${
              collectionType === "cookbook" ? "bg-red-50 border border-red-200 rounded-md p-3" : "mt-4 p-4 bg-red-50 border border-red-200 rounded-md"
            }`}>
              <p className={`${
                collectionType === "cookbook" ? "text-sm text-red-600" : "text-red-600"
              }`}>{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className={collectionType === "group" ? "mt-4" : ""}>
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
              handleAddToCollection();
            }}
            disabled={loading || selectedRecipeIds.size === 0 || !collectionId}
            className="bg-black text-white hover:bg-gray-800"
          >
            {collectionType === "cookbook"
              ? (loading 
                  ? `Adding ${selectedRecipeIds.size} recipe${selectedRecipeIds.size === 1 ? '' : 's'}...` 
                  : `Add ${selectedRecipeIds.size === 0 ? 'to' : selectedRecipeIds.size} ${selectedRecipeIds.size === 1 ? 'Recipe' : 'Recipes'} to this ${collectionName}`)
              : (loading ? 'Adding...' : `Add ${selectedRecipeIds.size} Recipe${selectedRecipeIds.size !== 1 ? 's' : ''}`)
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}