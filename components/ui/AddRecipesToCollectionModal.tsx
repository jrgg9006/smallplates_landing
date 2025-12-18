"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  onGetAvailableRecipes?: (collectionId: string) => Promise<{ data?: RecipeWithGuest[]; error?: string }>;
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
  onGetAvailableRecipes,
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
  const [showAdded, setShowAdded] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'myOwn' | 'collected'>('all');

  // Dynamic text generation
  const collectionName = collectionType === "cookbook" ? "cookbook" : "group";
  const collectionNameCapitalized = collectionType === "cookbook" ? "Cookbook" : "Group";
  
  const defaultTitle = title || `Add Plates to ${collectionNameCapitalized}`;
  const defaultDescription = description || (
    collectionType === "cookbook" 
      ? `Select plates to add to this ${collectionName}`
      : `Select plates from your collection to share with the ${collectionName}.`
  );
  const defaultAlreadyAddedText = alreadyAddedText || "Already added";

  const loadRecipes = useCallback(async () => {
    if (!collectionId) return;

    setRecipesLoading(true);
    setError(null);

    try {
      if (onGetAvailableRecipes) {
        // Use the optimized function that already excludes plates in the collection
        const { data: availableRecipes, error: availableError } = await onGetAvailableRecipes(collectionId);
        
        if (availableError) {
          setError(`Failed to load available plates for ${collectionName}`);
          console.error(`Error loading available plates for ${collectionName}:`, availableError);
          setRecipesLoading(false);
          return;
        }

        setAllRecipes(availableRecipes || []);
        setExistingRecipeIds(new Set()); // All loaded plates are available, none are existing
      } else {
        // Fallback to the old method for backward compatibility
        // Load all user plates
        const { data: allRecipesData, error: allRecipesError } = await getAllRecipes();
        
        if (allRecipesError) {
          setError('Failed to load plates');
          console.error('Error loading plates:', allRecipesError);
          setRecipesLoading(false);
          return;
        }

        // Load plates already in collection
        const { data: existingRecipes, error: existingError } = await onGetExistingRecipes(collectionId);
        
        if (existingError) {
          setError(`Failed to load ${collectionName} plates`);
          console.error(`Error loading ${collectionName} plates:`, existingError);
          setRecipesLoading(false);
          return;
        }

        // Create a set of recipe IDs already in the collection
        const existingIds = new Set(
          (existingRecipes || []).map(recipe => recipe.id)
        );

        setAllRecipes(allRecipesData || []);
        setExistingRecipeIds(existingIds);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading plates:', err);
    } finally {
      setRecipesLoading(false);
    }
  }, [collectionId, onGetExistingRecipes, onGetAvailableRecipes, collectionName]);

  // Load all plates when modal opens
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
    setShowAdded(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleToggleRecipe = (recipeId: string) => {
    // Don't allow toggling plates already in collection
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
    const availableRecipes = getFilteredRecipes().filter(
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
          if (addError.includes(`already in this ${collectionName}`) || 
              addError.includes('already in the group cookbook') ||
              addError.includes('Recipe is already in')) {
            success++;
            console.log(`Recipe ${recipeId} already exists - counting as success`);
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
        // Show "Added!" for groups
        if (collectionType === "group") {
          setShowAdded(true);
          setTimeout(() => {
            resetForm();
            onClose();
            
            if (onRecipesAdded) {
              onRecipesAdded();
            }
          }, 1500);
        } else {
          // Keep existing behavior for cookbooks
          setTimeout(() => {
            resetForm();
            onClose();
            
            if (onRecipesAdded) {
              onRecipesAdded();
            }
          }, 1000);
        }
      } else {
        setError(`Failed to add plates to ${collectionName}`);
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(`Error adding plates to ${collectionName}:`, err);
      setLoading(false);
    }
  };

  // Filter plates based on filter type
  const getFilteredRecipes = () => {
    let filtered = allRecipes;
    
    if (filterType === 'myOwn') {
      filtered = allRecipes.filter(recipe => recipe.guests?.is_self === true);
    } else if (filterType === 'collected') {
      filtered = allRecipes.filter(recipe => recipe.guests?.is_self === false || recipe.guests?.is_self === null);
    }
    
    return filtered;
  };

  // Count available plates (not already in collection)
  const filteredRecipes = getFilteredRecipes();
  const availableRecipes = filteredRecipes.filter(
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
        className="sm:max-w-[600px] max-h-[85vh] sm:max-h-[80vh] flex flex-col"
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

        <div className="flex-1 overflow-hidden flex flex-col space-y-2 lg:space-y-4 py-2 lg:py-4">
          {/* Filter Tabs and Select/Deselect Buttons */}
          {allRecipes.length > 0 && (
            <div className="flex items-center justify-between border-b">
              <div className="flex">
                <button
                  className={`px-2 lg:px-4 py-1 lg:py-2 text-xs lg:text-sm font-medium border-b-2 transition-colors ${
                    filterType === 'all'
                      ? 'border-black text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => {
                    setFilterType('all');
                    setSelectedRecipeIds(new Set());
                  }}
                >
                  All Plates
                </button>
                <button
                  className={`px-2 lg:px-4 py-1 lg:py-2 text-xs lg:text-sm font-medium border-b-2 transition-colors ${
                    filterType === 'myOwn'
                      ? 'border-black text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => {
                    setFilterType('myOwn');
                    setSelectedRecipeIds(new Set());
                  }}
                >
                  My Own Plates
                </button>
                <button
                  className={`px-2 lg:px-4 py-1 lg:py-2 text-xs lg:text-sm font-medium border-b-2 transition-colors ${
                    filterType === 'collected'
                      ? 'border-black text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => {
                    setFilterType('collected');
                    setSelectedRecipeIds(new Set());
                  }}
                >
                  Collected Plates
                </button>
              </div>
              {/* Select All / Deselect All buttons - Hidden on mobile */}
              <div className="hidden lg:flex gap-2">
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

          {/* Plates List */}
          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
            {recipesLoading ? (
              <div className="p-8 text-center text-gray-500">
                Loading plates...
              </div>
            ) : allRecipes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">
                  No plates available
                </p>
              </div>
            ) : availableCount === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">
                  {collectionType === "cookbook" 
                    ? `All plates are already in this ${collectionName}`
                    : `All your plates are already in this ${collectionName}.`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredRecipes.map((recipe) => {
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

          {/* Selection Counter at Bottom */}
          {allRecipes.length > 0 && availableCount > 0 && (
            <div className="text-sm text-gray-600 text-center">
              {selectedRecipeIds.size} of {availableCount} available
            </div>
          )}

          {/* Success/Error Messages */}
          {successCount > 0 && collectionType === "cookbook" && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-600">
                Successfully added {successCount} {successCount === 1 ? 'plate' : 'plates'} to {collectionName}
                {failedCount > 0 ? ` (${failedCount} failed)` : ''}
              </p>
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

        <div className="flex justify-end gap-3">
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
            disabled={loading || selectedRecipeIds.size === 0 || !collectionId || showAdded}
            className={`${
              showAdded && collectionType === "group" 
                ? "bg-green-700 text-white hover:bg-green-700" 
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {collectionType === "cookbook"
              ? (loading 
                  ? `Adding ${selectedRecipeIds.size} plate${selectedRecipeIds.size === 1 ? '' : 's'}...` 
                  : `Add ${selectedRecipeIds.size === 0 ? 'to' : selectedRecipeIds.size} ${selectedRecipeIds.size === 1 ? 'Plate' : 'Plates'} to this ${collectionName}`)
              : (showAdded 
                  ? 'Added!' 
                  : (loading ? 'Adding...' : `Add ${selectedRecipeIds.size} Plate${selectedRecipeIds.size !== 1 ? 's' : ''}`)
                )
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}