"use client";

import React, { useState, useRef, useEffect } from "react";
import { RecipeWithGuest } from "@/lib/types/database";
import { Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteRecipeModal } from "./DeleteRecipeModal";
import { deleteRecipe } from "@/lib/supabase/recipes";
import Image from "next/image";
import { getGuestProfileIcon } from "@/lib/utils/profileIcons";

interface MobileRecipeCardProps {
  recipe: RecipeWithGuest;
  onRecipeDeleted?: () => void;
  onRecipeClick?: (recipe: RecipeWithGuest) => void;
}

export function MobileRecipeCard({ 
  recipe, 
  onRecipeDeleted,
  onRecipeClick
}: MobileRecipeCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const guest = recipe.guests;
  const fullName = guest ? `${guest.first_name} ${guest.last_name || ''}`.trim() : 'Unknown Guest';
  const hasPrintedName = guest?.printed_name && guest.printed_name.trim();
  const displayName = guest && hasPrintedName ? guest.printed_name! : fullName;
  const showSubtitle = guest && hasPrintedName;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      const { error } = await deleteRecipe(recipe.id);
      
      if (error) {
        console.error('Error deleting recipe:', error);
        setDeleting(false);
        return;
      }
      
      handleCloseDeleteModal();
      
      if (onRecipeDeleted) {
        onRecipeDeleted();
      }
      
    } catch (err) {
      console.error('Unexpected error deleting recipe:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleCardClick = () => {
    if (onRecipeClick) {
      onRecipeClick(recipe);
    }
  };

  return (
    <>
      <div 
        className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleCardClick}
      >
        {/* Name Section */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-shrink-0">
                <Image
                  src={getGuestProfileIcon(recipe.guest_id, recipe.guests?.is_self === true)}
                  alt="Chef profile icon"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              </div>
              <div>
                <div className="font-medium text-gray-900 text-base">
                  {displayName}
                </div>
                {showSubtitle && (
                  <div className="text-sm text-gray-500">
                    {fullName}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recipe Name */}
        <div>
          <div className="text-sm font-medium text-gray-600 mb-1">Recipe</div>
          <div className="text-base text-gray-900">{recipe.recipe_name}</div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
          {/* 3 Dots Menu */}
          <div className="relative ml-auto" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center justify-center p-1 h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              title="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      setShowDeleteModal(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
                {/* Overlay to close dropdown */}
                <div 
                  className="fixed inset-0 z-[5]" 
                  onClick={() => setShowDropdown(false)}
                ></div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <DeleteRecipeModal
        isOpen={showDeleteModal}
        recipeName={recipe.recipe_name}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}

