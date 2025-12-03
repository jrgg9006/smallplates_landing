"use client";

import React, { useState, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Copy, Trash2 } from "lucide-react";
import { RecipeWithGuest } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { copyRecipeToPersonal, removeRecipeFromGroup } from "@/lib/supabase/groupRecipes";
import Image from "next/image";
import { getGuestProfileIcon } from "@/lib/utils/profileIcons";
import "@/lib/types/table";

// Actions cell component  
function ActionsCell({ 
  recipe, 
  groupId, 
  onRecipeRemoved, 
  onRecipeCopied 
}: { 
  recipe: RecipeWithGuest; 
  groupId: string;
  onRecipeRemoved?: () => void;
  onRecipeCopied?: () => void;
}) {
  const [copying, setCopying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if this recipe was added by the current user (they shouldn't copy their own recipes)
  const isOwnRecipe = recipe.added_by_user?.full_name === 'You' ||
                      recipe.guests?.is_self === true;

  const closeDropdown = () => {
    setShowDropdown(false);
    setDropdownPosition(null);
  };

  const handleToggleDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    if (!showDropdown) {
      // Calculate position immediately based on button position
      if (buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const estimatedDropdownHeight = 80; // Approximate height of dropdown
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        
        // Calculate right position (distance from right edge of viewport)
        const rightPosition = window.innerWidth - buttonRect.right;
        
        // Determine if we should open upward and set position accordingly
        if (spaceBelow < estimatedDropdownHeight + 10 && spaceAbove > estimatedDropdownHeight + 10) {
          setOpenUpward(true);
          // Position above the button
          setDropdownPosition({
            top: buttonRect.top - estimatedDropdownHeight - 4, // 4px gap
            right: rightPosition
          });
        } else {
          setOpenUpward(false);
          // Position below the button
          setDropdownPosition({
            top: buttonRect.bottom + 4, // 4px gap
            right: rightPosition
          });
        }
        
        // Now show the dropdown with the calculated position
        setShowDropdown(true);
        
        // Optionally refine position after dropdown renders (for more accurate height)
        setTimeout(() => {
          if (buttonRef.current && dropdownRef.current) {
            const actualButtonRect = buttonRef.current.getBoundingClientRect();
            const actualDropdownHeight = dropdownRef.current.offsetHeight;
            const actualSpaceBelow = window.innerHeight - actualButtonRect.bottom;
            const actualSpaceAbove = actualButtonRect.top;
            const actualRightPosition = window.innerWidth - actualButtonRect.right;
            
            // Refine position if needed
            if (actualSpaceBelow < actualDropdownHeight + 10 && actualSpaceAbove > actualDropdownHeight + 10) {
              setOpenUpward(true);
              setDropdownPosition({
                top: actualButtonRect.top - actualDropdownHeight - 4,
                right: actualRightPosition
              });
            } else {
              setOpenUpward(false);
              setDropdownPosition({
                top: actualButtonRect.bottom + 4,
                right: actualRightPosition
              });
            }
          }
        }, 10);
      }
    } else {
      closeDropdown();
    }
  };

  const handleCopyToPersonal = async () => {
    setCopying(true);
    closeDropdown();
    
    try {
      // Pass the source user ID (who added it to the group) if available
      const sourceUserId = recipe.added_by_user?.id;
      const { error } = await copyRecipeToPersonal(recipe.id, sourceUserId);
      
      if (error) {
        console.error('Error copying recipe to personal:', error);
        // Could show a toast error here in the future
        alert(error); // Temporary feedback
        return;
      }
      
      // Show success feedback
      console.log('Recipe copied successfully to your personal collection');
      // Could show a toast success here in the future
      alert('Recipe added to your collection! You can find it in "Discovered" recipes.'); // Temporary feedback
      
      if (onRecipeCopied) {
        onRecipeCopied();
      }
      
    } catch (err) {
      console.error('Unexpected error copying recipe:', err);
      alert('An unexpected error occurred while copying the recipe.'); // Temporary feedback
    } finally {
      setCopying(false);
    }
  };

  const handleRemoveFromGroup = async () => {
    setRemoving(true);
    closeDropdown();
    
    try {
      const { error } = await removeRecipeFromGroup(recipe.id, groupId);
      
      if (error) {
        console.error('Error removing recipe from group:', error);
        setRemoving(false);
        return;
      }
      
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
    <div 
      className="flex justify-end items-center gap-2 pr-4" 
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {/* 3 Dots Menu */}
      <div className="relative">
        <Button
          ref={buttonRef}
          variant="ghost"
          className="h-10 w-10"
          onClick={handleToggleDropdown}
          aria-label="More options"
          title="More options"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
        
        {/* Dropdown Menu - Using fixed positioning to escape overflow-hidden container */}
        {showDropdown && dropdownPosition && (
          <>
            <div 
              ref={dropdownRef}
              className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[180px]"
              style={{
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`
              }}
            >
              {/* Only show "Add to my recipes" if it's not the user's own recipe */}
              {!isOwnRecipe && (
                <button
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    handleCopyToPersonal();
                  }}
                  disabled={copying}
                >
                  <Copy className="h-4 w-4" />
                  {copying ? 'Adding...' : 'Add to my recipes'}
                </button>
              )}
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  handleRemoveFromGroup();
                }}
                disabled={removing}
              >
                <Trash2 className="h-4 w-4" />
                {removing ? 'Removing...' : 'Remove from group'}
              </button>
            </div>
            {/* Overlay to close dropdown */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={closeDropdown}
            ></div>
          </>
        )}
      </div>
    </div>
  );
}

export const createGroupRecipeColumns = (groupId: string): ColumnDef<RecipeWithGuest>[] => [
  {
    accessorKey: "created_at",
    header: "Date Added",
    // Hidden column for sorting - we don't display it but use it for sorting
    enableHiding: true,
    meta: {
      hidden: true,
    },
  },
  {
    accessorKey: "recipe_name",
    header: () => <div className="table-header-style pl-4">Recipe Name</div>,
    size: 220,
    minSize: 180,
    cell: ({ row }) => {
      const recipe = row.original;
      return (
        <div className="font-normal text-base text-gray-900 pl-4">
          {recipe.recipe_name}
        </div>
      );
    },
  },
  {
    id: "chef",
    header: () => <div className="table-header-style pl-4">Chef&apos;s Name</div>,
    size: 200,
    minSize: 180,
    cell: ({ row }) => {
      const recipe: RecipeWithGuest = row.original;
      const guest = recipe.guests;
      
      if (!guest) {
        return (
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="font-normal text-base text-gray-400">Unknown Guest</div>
          </div>
        );
      }

      const fullName = `${guest.first_name} ${guest.last_name || ''}`.trim();
      const hasPrintedName = guest.printed_name && guest.printed_name.trim();
      
      if (hasPrintedName) {
        return (
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="flex-shrink-0">
              <Image
                src={getGuestProfileIcon(recipe.guest_id, recipe.guests?.is_self === true)}
                alt="Chef profile icon"
                width={44}
                height={44}
                className="rounded-full"
              />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="font-normal text-base whitespace-nowrap">
                {guest.printed_name}
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {fullName}
              </div>
            </div>
          </div>
        );
      }
      
      return (
        <div className="flex items-center gap-3 whitespace-nowrap">
          <div className="flex-shrink-0">
            <Image
              src={getGuestProfileIcon(recipe.guest_id, recipe.guests?.is_self === true)}
              alt="Chef profile icon"
              width={44}
              height={44}
              className="rounded-full"
            />
          </div>
          <div className="font-normal text-base whitespace-nowrap">{fullName}</div>
        </div>
      );
    },
  },
  {
    id: "added_by",
    header: () => <div className="table-header-style">Added by</div>,
    size: 180,
    minSize: 150,
    cell: ({ row }: { row: any }) => {
      const recipe = row.original;
      const addedByUser = recipe.added_by_user;
      
      if (!addedByUser) {
        return (
          <div className="text-sm text-gray-400 italic">Unknown</div>
        );
      }

      // Special handling for current user
      if (addedByUser.full_name === 'You') {
        return (
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <Image
                src="/images/icons_profile/chef_you.png"
                alt="Your profile"
                width={24}
                height={24}
                className="rounded-full"
              />
            </div>
            <div className="text-sm text-gray-700 font-medium">
              Added by You
            </div>
          </div>
        );
      }

      const displayName = addedByUser.full_name || addedByUser.email || 'Unknown';
      
      return (
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            <Image
              src={getGuestProfileIcon(addedByUser.id, false)}
              alt={`${displayName}'s profile`}
              width={24}
              height={24}
              className="rounded-full"
            />
          </div>
          <div className="text-sm text-gray-700">
            {displayName}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="table-header-style text-right pr-4">Actions</div>,
    cell: ({ row, table }) => {
      const recipe = row.original;
      const onRecipeRemoved = table.options.meta?.onRecipeRemoved;
      const onRecipeCopied = table.options.meta?.onRecipeCopied;
      return (
        <ActionsCell 
          recipe={recipe} 
          groupId={groupId}
          onRecipeRemoved={onRecipeRemoved}
          onRecipeCopied={onRecipeCopied}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];