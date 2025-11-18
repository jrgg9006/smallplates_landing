"use client";

import React from "react";
import { AddRecipesToCollectionModal } from "@/components/ui/AddRecipesToCollectionModal";
import { addRecipeToGroup, getGroupRecipes, addRecipeToGroupCookbook } from "@/lib/supabase/groupRecipes";

interface AddRecipesToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | null;
  onRecipesAdded?: () => void;
}

export function AddRecipesToGroupModal({ 
  isOpen, 
  onClose, 
  groupId,
  onRecipesAdded 
}: AddRecipesToGroupModalProps) {
  // Wrapper function to match expected interface for adding recipes
  const handleAddRecipe = async (groupId: string, recipeId: string) => {
    console.log('DEBUG: Adding existing recipe to group and cookbook', { groupId, recipeId });
    
    // First, add recipe to the group
    const groupResult = await addRecipeToGroup(groupId, recipeId);
    if (groupResult.error) {
      console.error('Failed to add recipe to group:', groupResult.error);
      return { data: groupResult.data, error: groupResult.error || undefined };
    }
    
    // Then, add recipe to the group's shared cookbook
    const cookbookResult = await addRecipeToGroupCookbook(recipeId, groupId);
    if (cookbookResult.error) {
      // Check if it's just a duplicate error (which is fine)
      if (cookbookResult.error.includes('already in the group cookbook')) {
        console.log('DEBUG: Recipe already in cookbook - this is fine');
      } else {
        console.error('Recipe added to group but failed to add to shared cookbook:', cookbookResult.error);
        // Still don't return this as an error since the main operation (adding to group) succeeded
      }
      // Don't return error here - recipe was successfully added to group
    } else {
      console.log('DEBUG: Successfully added recipe to both group and shared cookbook');
    }
    
    // Always return success if the group addition worked, regardless of cookbook status
    return { data: groupResult.data, error: undefined };
  };

  // Wrapper function to get existing recipes in the group
  const handleGetExistingRecipes = async (groupId: string) => {
    const result = await getGroupRecipes(groupId);
    return { data: result.data || undefined, error: result.error || undefined };
  };

  // Don't provide onGetAvailableRecipes to enable "Already added" functionality
  // The component will fall back to showing all recipes with "Already added" indicators

  return (
    <AddRecipesToCollectionModal
      isOpen={isOpen}
      onClose={onClose}
      collectionId={groupId}
      collectionType="group"
      onAddRecipe={handleAddRecipe}
      onGetExistingRecipes={handleGetExistingRecipes}
      onRecipesAdded={onRecipesAdded}
    />
  );
}