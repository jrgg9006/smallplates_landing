"use client";

import React, { useState, useRef, useEffect } from "react";
import { RecipeInCookbook } from "@/lib/types/database";
import { MoreHorizontal, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeRecipeFromCookbook } from "@/lib/supabase/cookbooks";
import Image from "next/image";
import { getGuestProfileIcon } from "@/lib/utils/profileIcons";

interface MobileCookbookCardProps {
  recipe: RecipeInCookbook;
  cookbookId: string;
  onRecipeRemoved?: () => void;
  onRecipeClick?: (recipe: RecipeInCookbook) => void;
  onAddNote?: (recipe: RecipeInCookbook) => void;
}

export function MobileCookbookCard({ 
  recipe, 
  cookbookId,
  onRecipeRemoved,
  onRecipeClick,
  onAddNote
}: MobileCookbookCardProps) {
  const [removing, setRemoving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const guest = recipe.guests;
  const fullName = guest ? `${guest.first_name} ${guest.last_name || ''}`.trim() : 'Unknown Guest';
  const hasPrintedName = guest?.printed_name && guest.printed_name.trim();
  const displayName = guest && hasPrintedName ? guest.printed_name! : fullName;
  const showSubtitle = guest && hasPrintedName;
  const note = recipe.cookbook_recipes?.note;
  const hasNote = note && note.trim();

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

  const handleRemove = async () => {
    setRemoving(true);
    
    try {
      const { error } = await removeRecipeFromCookbook(cookbookId, recipe.id);
      
      if (error) {
        console.error('Error removing recipe:', error);
        setRemoving(false);
        return;
      }
      
      setShowDropdown(false);
      
      if (onRecipeRemoved) {
        onRecipeRemoved();
      }
      
    } catch (err) {
      console.error('Unexpected error removing recipe:', err);
    } finally {
      setRemoving(false);
    }
  };

  const handleCardClick = () => {
    if (onRecipeClick) {
      onRecipeClick(recipe);
    }
  };

  return (
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

      {/* Note Section */}
      <div>
        <div className="text-sm font-medium text-gray-600 mb-1">Note</div>
        {hasNote ? (
          <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
            {note}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">No note</div>
        )}
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
        {/* Add Note Button */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={(e) => {
            e.stopPropagation();
            if (onAddNote) {
              onAddNote(recipe);
            }
          }}
          title={hasNote ? "Edit note" : "Add Personal Note"}
        >
          <StickyNote className="h-4 w-4" />
          <span className="text-sm">{hasNote ? 'Edit Note' : 'Add Personal Note'}</span>
        </Button>

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
                    handleRemove();
                  }}
                  disabled={removing}
                >
                  {removing ? 'Removing...' : 'Remove from Cookbook'}
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
  );
}

