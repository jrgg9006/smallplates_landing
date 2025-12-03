"use client";

import React, { useState, useRef, useEffect } from "react";
import { RecipeWithGuest } from "@/lib/types/database";
import { Clock, MoreHorizontal, Trash2, Copy, Eye, Edit, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getGuestProfileIcon } from "@/lib/utils/profileIcons";
import { copyRecipeToPersonal, removeRecipeFromGroup } from "@/lib/supabase/groupRecipes";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RemoveRecipeFromGroupModal } from "./RemoveRecipeFromGroupModal";

interface DesktopGroupRecipeCardProps {
  id: string;
  recipe: RecipeWithGuest;
  groupId: string;
  onRecipeClick?: (recipe: RecipeWithGuest) => void;
  onRecipeRemoved?: () => void;
  onRecipeCopied?: () => void;
  colorIndex: number; // For rotating accent colors
  recipeNumber: number; // The order number for this recipe
}

const cardColors = [
  { bg: "bg-white", border: "border-gray-200", accent: "border-l-indigo-400", hover: "hover:border-indigo-200" },
  { bg: "bg-slate-50", border: "border-slate-200", accent: "border-l-emerald-400", hover: "hover:border-emerald-200" },
  { bg: "bg-blue-50/30", border: "border-blue-100", accent: "border-l-blue-400", hover: "hover:border-blue-200" },
  { bg: "bg-orange-50/30", border: "border-orange-100", accent: "border-l-orange-400", hover: "hover:border-orange-200" },
  { bg: "bg-violet-50/30", border: "border-violet-100", accent: "border-l-violet-400", hover: "hover:border-violet-200" },
  { bg: "bg-green-50/30", border: "border-green-100", accent: "border-l-green-400", hover: "hover:border-green-200" },
];

export function DesktopGroupRecipeCard({ 
  id,
  recipe,
  groupId,
  onRecipeClick,
  onRecipeRemoved,
  onRecipeCopied,
  colorIndex,
  recipeNumber
}: DesktopGroupRecipeCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [showDropdown, setShowDropdown] = useState(false);
  const [copying, setCopying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get color scheme based on index
  const colorScheme = cardColors[colorIndex % cardColors.length];

  // Check if this recipe was added by the current user (they shouldn't copy their own recipes)
  const isOwnRecipe = recipe.added_by_user?.full_name === 'You' ||
                      recipe.guests?.is_self === true;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setDropdownPosition(null);
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
    if (!showDropdown && onRecipeClick) {
      onRecipeClick(recipe);
    }
  };

  const handleToggleDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    if (!showDropdown) {
      // Calculate position for dropdown
      if (buttonRef.current && cardRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const cardRect = cardRef.current.getBoundingClientRect();
        const estimatedDropdownHeight = 120;
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        
        // Calculate right position relative to the card
        const rightPosition = window.innerWidth - buttonRect.right;
        
        // Determine if we should open upward
        if (spaceBelow < estimatedDropdownHeight + 10 && spaceAbove > estimatedDropdownHeight + 10) {
          setDropdownPosition({
            top: buttonRect.top - estimatedDropdownHeight - 4,
            right: rightPosition
          });
        } else {
          setDropdownPosition({
            top: buttonRect.bottom + 4,
            right: rightPosition
          });
        }
        
        setShowDropdown(true);
      }
    } else {
      setShowDropdown(false);
      setDropdownPosition(null);
    }
  };

  const handleCopyToPersonal = async () => {
    setCopying(true);
    setShowDropdown(false);
    setDropdownPosition(null);
    
    try {
      const sourceUserId = recipe.added_by_user?.id;
      const { error } = await copyRecipeToPersonal(recipe.id, sourceUserId);
      
      if (error) {
        console.error('Error copying recipe to personal:', error);
        alert(error);
        return;
      }
      
      console.log('Recipe copied successfully to your personal collection');
      alert('Recipe added to your collection! You can find it in "Discovered" recipes.');
      
      if (onRecipeCopied) {
        onRecipeCopied();
      }
      
    } catch (err) {
      console.error('Unexpected error copying recipe:', err);
      alert('An unexpected error occurred while copying the recipe.');
    } finally {
      setCopying(false);
    }
  };

  const handleRemoveClick = () => {
    setShowDropdown(false);
    setDropdownPosition(null);
    setShowDeleteModal(true);
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

  // Get "Added by" name
  const addedByName = recipe.added_by_user?.full_name || recipe.added_by_user?.email || null;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      {/* Drag Handle - Always visible, more to the left */}
      <div className="flex-shrink-0" {...attributes} {...listeners}>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Main Card */}
      <div
        ref={cardRef}
        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden"
        onClick={handleCardClick}
      >
        {/* Card Content - Horizontal Layout */}
        <div className="p-3 flex items-center gap-4">
          {/* Number Badge - Inside card, smaller */}
          <div className="flex-shrink-0">
            <div className="bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              {recipeNumber}
            </div>
          </div>
          
          {/* Left Section - Image, Title, Chef Info */}
          <div className="flex-1 min-w-0">
            {/* Plate Image */}
            <div className="mb-1.5">
              <Image
                src="/images/profile/plates.png"
                alt="Plate"
                width={32}
                height={32}
                className="flex-shrink-0"
              />
            </div>

            {/* Recipe Title - Large */}
            <div className="mb-2">
              <h3 className="text-2xl font-serif text-gray-900 leading-tight line-clamp-2">
                {recipe.recipe_name}
              </h3>
            </div>

            {/* Chef Section */}
            <div className="flex items-end gap-8">
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex-shrink-0">
                  <Image
                    src={getGuestProfileIcon(recipe.guest_id, recipe.guests?.is_self === true)}
                    alt="Chef profile icon"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-gray-500 uppercase">
                    CHEF
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {displayName}
                  </span>
                </div>
              </div>
              {addedByName && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex-shrink-0">
                    <Image
                      src={getGuestProfileIcon(recipe.added_by_user?.id || '', recipe.added_by_user?.full_name === 'You')}
                      alt="Added by profile icon"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {recipe.added_by_user?.full_name === 'You' ? 'Added by You' : `Added by ${addedByName}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                // Handle edit action
                console.log('Edit recipe:', recipe.id);
              }}
            >
              <Edit className="h-4 w-4" />
              <span className="text-sm">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveClick();
              }}
              disabled={removing}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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