"use client";

import React, { useState } from "react";
import { RecipeWithGuest } from "@/lib/types/database";
import { Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getGuestProfileIcon } from "@/lib/utils/profileIcons";
import { removeRecipeFromGroup } from "@/lib/supabase/groupRecipes";
import { RemoveRecipeFromGroupModal } from "./RemoveRecipeFromGroupModal";

interface MobileGroupRecipeCardProps {
  recipe: RecipeWithGuest;
  groupId: string;
  index?: number;
  onRecipeClick?: (recipe: RecipeWithGuest) => void;
  onRecipeRemoved?: () => void;
  onRecipeCopied?: () => void;
}

export function MobileGroupRecipeCard({ 
  recipe,
  groupId,
  index,
  onRecipeClick,
  onRecipeRemoved
}: MobileGroupRecipeCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleCardClick = () => {
    if (onRecipeClick) {
      onRecipeClick(recipe);
    }
  };

  // Chef (recipe creator) name display logic
  const guest = recipe.guests;
  const fullName = guest ? `${guest.first_name || ''} ${guest.last_name || ''}`.trim() : 'Unknown Guest';
  const hasPrintedName = guest?.printed_name && guest.printed_name.trim();
  const displayName = guest && hasPrintedName ? guest.printed_name! : fullName;

  // Get "Added by" name - show in footer
  const addedByName = recipe.added_by_user?.full_name || recipe.added_by_user?.email || null;

  // Check if this recipe was added by the current user
  const isOwnRecipe = recipe.added_by_user?.full_name === 'You' ||
                      recipe.guests?.is_self === true;

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleCardClick();
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleConfirmRemove = async () => {
    setRemoving(true);
    
    try {
      const { error } = await removeRecipeFromGroup(recipe.id, groupId);
      
      if (error) {
        console.error('Error removing recipe from group:', error);
        setRemoving(false);
        return;
      }
      
      setShowDeleteModal(false);
      
      if (onRecipeRemoved) {
        onRecipeRemoved();
      }
      
    } catch (err) {
      console.error('Unexpected error removing recipe from group:', err);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header with Plate Badge and Actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Badge and Number */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Plate</span>
            {index !== undefined && (
              <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-semibold">
                {index + 1}
              </div>
            )}
          </div>
        </div>
        
        {/* Actions - Desktop style with individual buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            onClick={handleEditClick}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
            onClick={handleRemoveClick}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Recipe Title - Clickable */}
      <div 
        className="mb-3 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors"
        onClick={handleCardClick}
      >
        <h3 className="text-2xl font-normal text-gray-900 leading-tight font-serif">
          {recipe.recipe_name}
        </h3>
      </div>

      {/* Chef Section - Clickable */}
      <div 
        className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded transition-colors"
        onClick={handleCardClick}
      >
        <div className="flex-shrink-0">
          <Image
            src={getGuestProfileIcon(recipe.guest_id, recipe.guests?.is_self === true)}
            alt="Chef profile icon"
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">CHEF</div>
          <div className="font-medium text-gray-900 text-sm">
            {displayName}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex-shrink-0">
            <Image
              src={getGuestProfileIcon('added_by', isOwnRecipe)}
              alt="Added by profile icon"
              width={20}
              height={20}
              className="rounded-full"
            />
          </div>
          <div className="text-xs text-gray-500">
            Added by {isOwnRecipe ? 'You' : addedByName?.split(' ')[0] || 'Guest'}
          </div>
        </div>
      </div>

      {/* Remove Recipe Confirmation Modal */}
      <RemoveRecipeFromGroupModal
        isOpen={showDeleteModal}
        recipeName={recipe.recipe_name}
        isOwnRecipe={isOwnRecipe}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmRemove}
        loading={removing}
      />
    </div>
  );
}