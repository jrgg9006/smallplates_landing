"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RecipeInCookbook } from "@/lib/types/database";
import { getCookbookRecipes, updateCookbookRecipeOrder } from "@/lib/supabase/cookbooks";
import { createCookbookColumns } from "./CookbookTableColumns";
import { Button } from "@/components/ui/button";
import { MobileCookbookCard } from "./MobileCookbookCard";
import { RecipeDetailsModal } from "@/components/profile/recipes/RecipeDetailsModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import "@/lib/types/table";

interface CookbookTableProps {
  cookbookId: string | null;
  searchValue?: string;
  onDataLoaded?: () => void;
  onRecipeRemoved?: () => void;
  onAddNote?: (recipe: RecipeInCookbook) => void;
}

export function CookbookTable({ 
  cookbookId,
  searchValue: externalSearchValue = '', 
  onDataLoaded,
  onRecipeRemoved,
  onAddNote
}: CookbookTableProps) {
  const [data, setData] = React.useState<RecipeInCookbook[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isReordering, setIsReordering] = React.useState(false);
  
  const [sorting, setSorting] = React.useState<SortingState>([]); // Disable sorting when using drag and drop
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ updated_at: false });
  
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  
  // Modal state
  const [selectedRecipe, setSelectedRecipe] = React.useState<RecipeInCookbook | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  const searchValue = externalSearchValue;

  // Configure sensors for drag and drop
  // Disable sensors when search is active
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating
      },
      enabled: !searchValue.trim(),
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      enabled: !searchValue.trim(),
    })
  );

  // Load recipes when cookbookId or search changes
  React.useEffect(() => {
    const loadRecipes = async () => {
      if (!cookbookId) {
        setData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: recipes, error: recipesError } = await getCookbookRecipes(cookbookId);
        
        if (recipesError) {
          setError(recipesError);
          return;
        }
        
        // Sort by display_order (ascending) to maintain the order
        const sortedRecipes = (recipes || []).sort((a, b) => {
          const orderA = a.cookbook_recipes?.display_order ?? 0;
          const orderB = b.cookbook_recipes?.display_order ?? 0;
          return orderA - orderB;
        });
        
        setData(sortedRecipes);
        
        if (onDataLoaded) {
          onDataLoaded();
        }
      } catch (err) {
        setError('Failed to load recipes');
        console.error('Error loading recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(loadRecipes, searchValue.trim() ? 300 : 0);
    return () => clearTimeout(timeoutId);
  }, [cookbookId, searchValue, refreshTrigger, onDataLoaded]);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRecipeClick = (recipe: RecipeInCookbook) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !cookbookId) {
      return;
    }

    // Disable drag and drop when search is active to avoid confusion
    if (searchValue.trim()) {
      return;
    }

    // Work with the current data to maintain consistency
    const oldIndex = data.findIndex((recipe) => recipe.id === active.id);
    const newIndex = data.findIndex((recipe) => recipe.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update the UI
    const newData = arrayMove(data, oldIndex, newIndex);
    setData(newData);
    setIsReordering(true);

    try {
      // Update display_order for all affected recipes
      // We need to update all recipes in the range that was affected
      const updates: Promise<{ data: any; error: string | null }>[] = [];
      
      // Determine the range of affected indices
      const startIndex = Math.min(oldIndex, newIndex);
      const endIndex = Math.max(oldIndex, newIndex);
      
      // Update all recipes in the affected range with their new display_order
      for (let i = startIndex; i <= endIndex; i++) {
        if (newData[i]) {
          updates.push(
            updateCookbookRecipeOrder(cookbookId, newData[i].id, i)
          );
        }
      }

      // Wait for all updates to complete
      const results = await Promise.all(updates);
      const hasError = results.some((result) => result.error);

      if (hasError) {
        // If there's an error, refresh from server
        console.error('Error updating recipe order');
        refreshData();
      }
    } catch (err) {
      console.error('Error updating recipe order:', err);
      // Refresh from server on error
      refreshData();
    } finally {
      setIsReordering(false);
    }
  };

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!searchValue.trim()) {
      return data;
    }

    const searchTerm = searchValue.toLowerCase();
    return data.filter(recipe => {
      const recipeNameMatch = recipe.recipe_name.toLowerCase().includes(searchTerm);
      const guestNameMatch = recipe.guests && (
        recipe.guests.first_name.toLowerCase().includes(searchTerm) ||
        recipe.guests.last_name.toLowerCase().includes(searchTerm) ||
        (recipe.guests.printed_name && recipe.guests.printed_name.toLowerCase().includes(searchTerm))
      );
      const noteMatch = recipe.cookbook_recipes?.note?.toLowerCase().includes(searchTerm);
      
      return recipeNameMatch || guestNameMatch || noteMatch;
    });
  }, [data, searchValue]);

  const columns = React.useMemo(() => {
    if (!cookbookId) return [];
    return createCookbookColumns(
      cookbookId, 
      onRecipeRemoved || refreshData, 
      onAddNote,
      !!searchValue.trim()
    );
  }, [cookbookId, onRecipeRemoved, onAddNote, searchValue]);

  const table = useReactTable<RecipeInCookbook>({
    data: filteredData,
    columns,
    meta: {
      onRecipeRemoved: onRecipeRemoved || refreshData,
      onAddNote: onAddNote,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // Show error state
  if (error) {
    return (
      <div className="w-full p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error: {error}</p>
          <Button 
            onClick={refreshData} 
            className="mt-2"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!cookbookId) {
    return (
      <div className="w-full p-8 text-center">
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8">
          <h3 className="text-2xl font-serif font-semibold text-gray-500 mb-3">
            No Cookbook Selected
          </h3>
          <p className="text-lg text-gray-500">
            Please select a cookbook to view its recipes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Loading State */}
      {loading && (
        <div className="w-full p-4 text-center text-muted-foreground">
          Loading recipes...
        </div>
      )}

      {/* Desktop Table Layout */}
      <div className="hidden md:block">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full border-collapse bg-white">
              <thead className="bg-gray-50 border-b border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`px-8 py-3 tracking-wide ${
                          header.column.id === 'actions'
                            ? 'text-right'
                            : header.column.id === 'drag-handle'
                            ? 'w-12'
                            : 'text-left'
                        }`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <SortableContext
                items={filteredData.map((recipe) => recipe.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="divide-y divide-gray-200">
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className={`hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
                          isReordering ? 'opacity-50' : ''
                        }`}
                        onClick={(e: React.MouseEvent<HTMLTableRowElement>) => {
                          e.preventDefault();
                          handleRecipeClick(row.original);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isRightAlignedColumn = cell.column.id === 'actions';
                          const isDragHandleColumn = cell.column.id === 'drag-handle';
                          const isNoteColumn = cell.column.id === 'note';
                          return (
                            <td 
                              key={cell.id} 
                              className={`px-8 py-4 ${
                                isNoteColumn ? 'align-top' : ''
                              } ${
                                isRightAlignedColumn ? 'text-right' : ''
                              } ${isDragHandleColumn ? 'w-12' : ''}`}
                              onClick={(e) => {
                                if (isDragHandleColumn || isRightAlignedColumn) {
                                  e.stopPropagation();
                                }
                              }}
                              onMouseDown={(e) => {
                                // Also prevent on mousedown for actions column to prevent any event propagation
                                if (isRightAlignedColumn) {
                                  e.stopPropagation();
                                }
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-8 py-12"
                      >
                        <div className="text-center">
                          <div className="mb-6">
                            <h3 className="text-2xl font-serif font-semibold text-gray-500 mb-3">
                              No recipes yet
                            </h3>
                            <p className="text-lg text-gray-500 mb-6">
                              Add recipes to this cookbook to see them here.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>
      </div>

      {/* Mobile Cards Layout */}
      <div className="md:hidden">
        {table.getRowModel().rows?.length ? (
          <div className="space-y-3">
            {table.getRowModel().rows.map((row) => (
              <MobileCookbookCard
                key={row.id}
                recipe={row.original}
                cookbookId={cookbookId}
                onRecipeRemoved={onRecipeRemoved || refreshData}
                onAddNote={onAddNote}
                onRecipeClick={handleRecipeClick}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-2xl font-serif font-semibold text-gray-500 mb-3">
                  No recipes yet
                </h3>
                <p className="text-lg text-gray-500 mb-6">
                  Add recipes to this cookbook to see them here.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination - Responsive */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="text-sm text-gray-500 order-2 sm:order-1">
          Showing {table.getFilteredRowModel().rows.length} {table.getFilteredRowModel().rows.length === 1 ? 'recipe' : 'recipes'}
        </div>
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500 px-2">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Recipe Details Modal */}
      <RecipeDetailsModal
        recipe={selectedRecipe}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onRecipeUpdated={refreshData}
      />
    </div>
  );
}

