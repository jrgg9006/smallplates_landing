"use client";

import React, { useState, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, StickyNote, GripVertical } from "lucide-react";
import { RecipeInCookbook } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { removeRecipeFromCookbook } from "@/lib/supabase/cookbooks";
import Image from "next/image";
import { getGuestProfileIcon } from "@/lib/utils/profileIcons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "@/lib/types/table";

// Actions cell component  
function ActionsCell({ 
  recipe, 
  cookbookId,
  onRecipeRemoved,
  onAddNote
}: { 
  recipe: RecipeInCookbook; 
  cookbookId: string;
  onRecipeRemoved?: () => void;
  onAddNote?: (recipe: RecipeInCookbook) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = () => {
    setShowDropdown(false);
    setDropdownPosition(null);
  };

  const handleRemove = async () => {
    setRemoving(true);
    
    try {
      const { error } = await removeRecipeFromCookbook(cookbookId, recipe.id);
      
      if (error) {
        console.error('Error removing recipe:', error);
        setRemoving(false);
        return;
      }
      
      closeDropdown();
      
      if (onRecipeRemoved) {
        onRecipeRemoved();
      }
      
    } catch (err) {
      console.error('Unexpected error removing recipe:', err);
    } finally {
      setRemoving(false);
    }
  };

  const handleToggleDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    if (!showDropdown) {
      // Calculate position immediately based on button position
      if (buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const estimatedDropdownHeight = 50; // Approximate height of dropdown
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

  return (
    <div className="flex justify-end items-center gap-1 pr-4" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
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
              className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[120px]"
              style={{
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`
              }}
            >
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                disabled={removing}
              >
                {removing ? 'Removing...' : 'Remove from Cookbook'}
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

// Drag handle component
function DragHandle({ id, disabled }: { id: string; disabled?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : disabled ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(!disabled ? listeners : {})}
      className={`flex items-start justify-center w-8 pt-2 touch-none ${
        disabled 
          ? 'text-gray-300 cursor-not-allowed' 
          : 'text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing'
      }`}
      onClick={(e) => e.stopPropagation()}
      title={disabled ? 'Drag and drop disabled while searching' : 'Drag to reorder'}
    >
      <GripVertical className="h-5 w-5" />
    </div>
  );
}

export function createCookbookColumns(
  cookbookId: string,
  onRecipeRemoved?: () => void,
  onAddNote?: (recipe: RecipeInCookbook) => void,
  isSearchActive?: boolean,
  isGroupCookbook?: boolean
): ColumnDef<RecipeInCookbook>[] {
  return [
    {
      accessorKey: "updated_at",
      header: "Last Updated",
      enableHiding: true,
      meta: {
        hidden: true,
      },
    },
    {
      id: "drag-handle",
      header: () => <div className="w-8"></div>,
      cell: ({ row }) => {
        const recipe = row.original;
        return <DragHandle id={recipe.id} disabled={isSearchActive} />;
      },
      enableSorting: false,
      enableHiding: false,
      size: 32,
    },
    {
      accessorKey: "recipe_name",
      header: () => <div className="table-header-style">Recipe Name</div>,
      size: 300,
      minSize: 250,
      cell: ({ row }) => {
        const recipe = row.original;
        return (
          <div className="font-normal text-base text-gray-900 whitespace-nowrap">
            {recipe.recipe_name}
          </div>
        );
      },
    },
    {
      id: "name",
      header: () => <div className="table-header-style pl-4">Chef's Name</div>,
      size: 250,
      minSize: 220,
      cell: ({ row }) => {
        const recipe: RecipeInCookbook = row.original;
        const guest = recipe.guests;
        
        if (!guest) {
          return (
            <div className="flex items-center gap-3 pl-4 whitespace-nowrap">
              <div className="font-normal text-base text-gray-400">Unknown Guest</div>
            </div>
          );
        }

        const fullName = `${guest.first_name} ${guest.last_name || ''}`.trim();
        const hasPrintedName = guest.printed_name && guest.printed_name.trim();
        
        if (hasPrintedName) {
        return (
          <div className="flex items-center gap-3 pl-4 whitespace-nowrap">
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
          <div className="flex items-center gap-3 pl-4 whitespace-nowrap">
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
    // Conditionally include "Added By" column for group cookbooks
    ...(isGroupCookbook ? [{
      id: "added_by",
      header: () => <div className="table-header-style">Added By</div>,
      size: 140,
      minSize: 120,
      cell: ({ row }: { row: any }) => {
        const recipe = row.original;
        const addedByUser = recipe.added_by_user;
        
        if (!addedByUser) {
          return (
            <div className="text-sm text-gray-400 italic">Unknown</div>
          );
        }

        // Special handling for current user
        if (addedByUser.is_current_user || addedByUser.full_name === 'You') {
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
    }] : []),
    {
      id: "note",
      header: () => <div className="table-header-style">Personal Printed Note</div>,
      size: 140, // Reduced from 180
      maxSize: 180, // Reduced from 220
      cell: ({ row }) => {
        const recipe = row.original;
        const note = recipe.cookbook_recipes?.note;
        const hasNote = note && note.trim();
        
        return (
          <div className="flex items-start gap-2">
            {hasNote ? (
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 break-words">{note}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic flex-1">Add a note</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-gray-600 hover:text-gray-900 flex-shrink-0"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                if (onAddNote) {
                  onAddNote(recipe);
                }
              }}
              title={hasNote ? "Edit printed note" : "Add printed note"}
            >
              <StickyNote className="h-4 w-4" />
            </Button>
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
        const onAddNote = table.options.meta?.onAddNote;
        return (
          <ActionsCell 
            recipe={recipe} 
            cookbookId={cookbookId}
            onRecipeRemoved={onRecipeRemoved}
            onAddNote={onAddNote}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

