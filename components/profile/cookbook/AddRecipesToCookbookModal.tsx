"use client";

import React from "react";
import { AddRecipesToCollectionModal } from "@/components/ui/AddRecipesToCollectionModal";
import { addRecipeToCookbook, getCookbookRecipes } from "@/lib/supabase/cookbooks";

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
  // Wrapper function to match expected signature
  const handleAddRecipe = async (cookbookId: string, recipeId: string) => {
    const result = await addRecipeToCookbook(cookbookId, recipeId);
    return { data: result.data, error: result.error || undefined };
  };

  // Wrapper function to match expected signature
  const handleGetExistingRecipes = async (cookbookId: string) => {
    const result = await getCookbookRecipes(cookbookId);
    return { data: result.data || undefined, error: result.error || undefined };
  };

  return (
    <AddRecipesToCollectionModal
      isOpen={isOpen}
      onClose={onClose}
      collectionId={cookbookId}
      collectionType="cookbook"
      onAddRecipe={handleAddRecipe}
      onGetExistingRecipes={handleGetExistingRecipes}
      onRecipesAdded={onRecipesAdded}
    />
  );
}

