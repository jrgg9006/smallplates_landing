"use client";

import React, { useState, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Trash2, MoreHorizontal, BookOpen } from "lucide-react";
import { RecipeWithGuest } from "@/lib/types/database";
import { DeleteRecipeModal } from "./DeleteRecipeModal";
import { AddToCookbookModal } from "@/components/profile/cookbook/AddToCookbookModal";
import { Button } from "@/components/ui/button";
import { deleteRecipe } from "@/lib/supabase/recipes";
import Image from "next/image";
import { getGuestProfileIcon } from "@/lib/utils/profileIcons";
import "@/lib/types/table";

// Actions cell component  
function ActionsCell({ recipe, onRecipeDeleted, onRecipeAddedToCookbook }: { 
  recipe: RecipeWithGuest; 
  onRecipeDeleted?: () => void;
  onRecipeAddedToCookbook?: () => void;
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddToCookbookModal, setShowAddToCookbookModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [justClosedModal, setJustClosedModal] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <>
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
        {/* Add to Cookbook Button - Visible */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            e.preventDefault();
            setJustClosedModal(false);
            setShowAddToCookbookModal(true);
          }}
          onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          title="Add to Cookbook"
        >
          <BookOpen className="h-4 w-4" />
        </Button>

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
                className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[160px]"
                style={{
                  top: `${dropdownPosition.top}px`,
                  right: `${dropdownPosition.right}px`
                }}
              >
                <button
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    closeDropdown();
                    setShowDeleteModal(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
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

      <DeleteRecipeModal
        isOpen={showDeleteModal}
        recipeName={recipe.recipe_name}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <AddToCookbookModal
        isOpen={showAddToCookbookModal}
        onClose={() => {
          setJustClosedModal(true);
          setShowAddToCookbookModal(false);
          // Reset the flag after a short delay to prevent row click
          setTimeout(() => {
            setJustClosedModal(false);
          }, 100);
        }}
        recipe={recipe}
        onRecipeAdded={onRecipeAddedToCookbook}
      />
    </>
  );
}

export const columns: ColumnDef<RecipeWithGuest>[] = [
  {
    accessorKey: "updated_at",
    header: "Last Updated",
    // Hidden column for sorting - we don't display it but use it for sorting
    enableHiding: true,
    meta: {
      hidden: true,
    },
  },
  {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black focus:ring-2"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => {
          e.stopPropagation();
          table.toggleAllPageRowsSelected(e.target.checked);
        }}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black focus:ring-2"
        checked={row.getIsSelected()}
        onChange={(e) => {
          e.stopPropagation();
          row.toggleSelected(e.target.checked);
        }}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "recipe_name",
    header: () => <div className="table-header-style">Recipe Name</div>,
    size: 250,
    minSize: 200,
    cell: ({ row }) => {
      const recipe = row.original;
      return (
        <div className="font-normal text-base text-gray-900">
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
      const recipe: RecipeWithGuest = row.original;
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
  {
    id: "notes",
    header: () => <div className="table-header-style">Notes for you</div>,
    size: 200,
    maxSize: 250,
    cell: ({ row }) => {
      const recipe = row.original;
      const notes = recipe.comments;
      const hasNotes = notes && notes.trim();
      
      return (
        <div>
          {hasNotes ? (
            <div className="min-w-0">
              <p className="text-sm text-gray-700 break-words">{notes}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No notes</p>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="table-header-style text-right pr-4">Actions</div>,
    cell: ({ row, table }) => {
      const recipe = row.original;
      const onRecipeDeleted = table.options.meta?.onRecipeDeleted;
      const onRecipeAddedToCookbook = table.options.meta?.onRecipeAddedToCookbook;
      return (
        <ActionsCell 
          recipe={recipe} 
          onRecipeDeleted={onRecipeDeleted}
          onRecipeAddedToCookbook={onRecipeAddedToCookbook}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

