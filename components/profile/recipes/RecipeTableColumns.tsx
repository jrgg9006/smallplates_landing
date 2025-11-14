"use client";

import React, { useState } from "react";
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

  return (
    <>
      <div className="flex justify-end items-center gap-1 pr-4" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
        {/* 3 Dots Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            className="h-10 w-10"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            aria-label="More options"
            title="More options"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]">
                <button
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    setShowAddToCookbookModal(true);
                  }}
                >
                  <BookOpen className="h-4 w-4" />
                  Add to Cookbook
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
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

      <DeleteRecipeModal
        isOpen={showDeleteModal}
        recipeName={recipe.recipe_name}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <AddToCookbookModal
        isOpen={showAddToCookbookModal}
        onClose={() => setShowAddToCookbookModal(false)}
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
    id: "name",
    header: () => <div className="table-header-style pl-4">Name</div>,
    cell: ({ row }) => {
      const recipe: RecipeWithGuest = row.original;
      const guest = recipe.guests;
      
      if (!guest) {
        return (
          <div className="flex items-center gap-3 pl-4">
            <div className="font-normal text-base text-gray-400">Unknown Guest</div>
          </div>
        );
      }

      const fullName = `${guest.first_name} ${guest.last_name || ''}`.trim();
      const hasPrintedName = guest.printed_name && guest.printed_name.trim();
      
      if (hasPrintedName) {
        return (
          <div className="flex items-center gap-3 pl-4">
            <div className="flex-shrink-0">
              <Image
                src={getGuestProfileIcon(recipe.guest_id, recipe.guests?.is_self === true)}
                alt="Chef profile icon"
                width={44}
                height={44}
                className="rounded-full"
              />
            </div>
            <div className="space-y-0.5">
              <div className="font-normal text-base">
                {guest.printed_name}
              </div>
              <div className="text-xs text-gray-500">
                {fullName}
              </div>
            </div>
          </div>
        );
      }
      
      return (
        <div className="flex items-center gap-3 pl-4">
          <div className="flex-shrink-0">
            <Image
              src={getGuestProfileIcon(recipe.guest_id, recipe.guests?.is_self === true)}
              alt="Chef profile icon"
              width={44}
              height={44}
              className="rounded-full"
            />
          </div>
          <div className="font-normal text-base">{fullName}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "recipe_name",
    header: () => <div className="table-header-style">Recipe Name</div>,
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
    id: "notes",
    header: () => <div className="table-header-style">Notes for you</div>,
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

