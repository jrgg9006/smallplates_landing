"use client";

import React, { useState } from "react";
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

  return (
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
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
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
  isSearchActive?: boolean
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
      id: "name",
      header: () => <div className="table-header-style pl-4">Name</div>,
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
      id: "note",
      header: () => <div className="table-header-style">Printed Note</div>,
      size: 180,
      maxSize: 220,
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

