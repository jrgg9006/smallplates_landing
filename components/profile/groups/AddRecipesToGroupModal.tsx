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
      console.error('Recipe added to group but failed to add to shared cookbook:', cookbookResult.error);
      // Don't return error here - recipe was successfully added to group
    } else {
      console.log('DEBUG: Successfully added recipe to both group and shared cookbook');
    }
    
    return { data: groupResult.data, error: groupResult.error || undefined };
  };

  // Wrapper function to get existing recipes in the group
  const handleGetExistingRecipes = async (groupId: string) => {
    const result = await getGroupRecipes(groupId);
    return { data: result.data || undefined, error: result.error || undefined };
  };

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