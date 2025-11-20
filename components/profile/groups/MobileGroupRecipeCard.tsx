"use client";

import React, { useState, useRef, useEffect } from "react";
import { RecipeWithGuest } from "@/lib/types/database";
import { Clock, MoreHorizontal, Trash2, Copy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getGuestProfileIcon } from "@/lib/utils/profileIcons";

interface MobileGroupRecipeCardProps {
  recipe: RecipeWithGuest;
  onRecipeClick?: (recipe: RecipeWithGuest) => void;
  onRecipeRemoved?: () => void;
  onRecipeCopied?: () => void;
}

export function MobileGroupRecipeCard({ 
  recipe,
  onRecipeClick,
  onRecipeRemoved,
  onRecipeCopied
}: MobileGroupRecipeCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleCardClick = () => {
    if (onRecipeClick) {
      onRecipeClick(recipe);
    }
  };

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 3600);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Chef (recipe creator) name display logic
  const guest = recipe.guests;
  const fullName = guest ? `${guest.first_name || ''} ${guest.last_name || ''}`.trim() : 'Unknown Guest';
  const hasPrintedName = guest?.printed_name && guest.printed_name.trim();
  const displayName = guest && hasPrintedName ? guest.printed_name! : fullName;
  const showSubtitle = guest && hasPrintedName;

  // Get "Added by" name - show in footer
  const addedByName = recipe.added_by_user?.full_name || recipe.added_by_user?.email || null;

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={handleCardClick}
    >
      {/* Recipe Title - Large and Prominent */}
      <div>
        <div className="text-md font-medium text-gray-900 leading-tight">
          {recipe.recipe_name}
        </div>
      </div>

      {/* Chef Section */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Image
            src={getGuestProfileIcon(recipe.guest_id, recipe.guests?.is_self === true)}
            alt="Chef profile icon"
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-0.5">Chef's Name:</div>
          <div className="font-medium text-gray-900 text-base">
            {displayName}
          </div>
        </div>
      </div>

      {/* Footer with "Added by" and actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
        {addedByName ? (
          <div className="text-sm text-gray-500">
            Added by <span className="font-medium text-gray-900">{addedByName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{formatDate(recipe.created_at)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px] py-1">
                <button
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 first:rounded-t-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    handleCardClick();
                  }}
                >
                  <Eye className="h-4 w-4" />
                  View recipe
                </button>
                
                <button
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    onRecipeCopied?.();
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy to my recipes
                </button>

                <button
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 last:rounded-b-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    onRecipeRemoved?.();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Remove from group
                </button>
              </div>
              
              {/* Overlay to close dropdown */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}