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
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RecipeWithGuest } from "@/lib/types/database";
import { getAllRecipes, searchRecipes } from "@/lib/supabase/recipes";
import { columns } from "./RecipeTableColumns";
import { Button } from "@/components/ui/button";
import { MobileRecipeCard } from "./MobileRecipeCard";
import { RecipeDetailsModal } from "./RecipeDetailsModal";
import "@/lib/types/table";

interface RecipeTableProps {
  searchValue?: string; // External search value
  filterType?: string; // External filter type: 'all', 'myOwn', 'collected'
  onDataLoaded?: () => void; // Callback when data is loaded
  onSelectionChange?: (selectedRecipes: RecipeWithGuest[]) => void; // Callback when selection changes
  clearSelectionTrigger?: number; // Trigger to clear selection from parent
}

export function RecipeTable({ searchValue: externalSearchValue = '', filterType = 'all', onDataLoaded, onSelectionChange, clearSelectionTrigger }: RecipeTableProps = {}) {
  // Data management
  const [data, setData] = React.useState<RecipeWithGuest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Table state - sort by updated_at descending to show most recently modified recipes first
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'updated_at', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ updated_at: false });
  const [rowSelection, setRowSelection] = React.useState({});
  
  // Refresh trigger for forcing data reload
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  
  // Modal state
  const [selectedRecipe, setSelectedRecipe] = React.useState<RecipeWithGuest | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  // Use external search value instead of internal state
  const searchValue = externalSearchValue;

  // Combined effect to handle search and filter
  React.useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        let recipes: RecipeWithGuest[] = [];

        // If there's a search query, use search function
        if (searchValue.trim()) {
          const { data: searchResults, error: searchError } = await searchRecipes(searchValue);
          
          if (searchError) {
            setError(searchError);
            return;
          }
          
          recipes = searchResults || [];
        } else {
          // No search query - load all recipes
          const { data: allRecipes, error: recipesError } = await getAllRecipes();
          
          if (recipesError) {
            setError(recipesError);
            return;
          }
          
          recipes = allRecipes || [];
        }

        // Apply filter based on filterType
        let filteredRecipes = recipes;
        if (filterType === 'myOwn') {
          // Filter for recipes where guest.is_self === true
          filteredRecipes = recipes.filter(recipe => recipe.guests?.is_self === true);
        } else if (filterType === 'collected') {
          // Filter for recipes where guest.is_self === false (or null)
          filteredRecipes = recipes.filter(recipe => recipe.guests?.is_self === false || recipe.guests?.is_self === null);
        } else if (filterType === 'discovered') {
          // Placeholder - currently shows all recipes, will be implemented later
          filteredRecipes = recipes;
        }
        // If filterType === 'all', no additional filtering needed
        
        setData(filteredRecipes);
        
        // Call the callback to update counts in parent component
        if (onDataLoaded) {
          onDataLoaded();
        }
      } catch (err) {
        setError('Failed to load recipes');
        console.error('Error loading recipes:', err);
      } finally {
        setLoading(false);
      }
    }, searchValue.trim() ? 300 : 0); // Only debounce search, not filter changes

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, filterType, refreshTrigger]);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRecipeClick = (recipe: RecipeWithGuest) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  const table = useReactTable<RecipeWithGuest>({
    data,
    columns,
    meta: {
      onRecipeDeleted: refreshData,
      onRecipeClick: handleRecipeClick,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Store callback in ref to avoid infinite loops
  const onSelectionChangeRef = React.useRef(onSelectionChange);
  React.useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChangeRef.current) {
      const selectedRows = table.getFilteredSelectedRowModel().rows;
      const selectedRecipes = selectedRows.map(row => row.original);
      onSelectionChangeRef.current(selectedRecipes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, data]);

  // Clear selection when trigger changes
  React.useEffect(() => {
    if (clearSelectionTrigger !== undefined && clearSelectionTrigger > 0) {
      setRowSelection({});
    }
  }, [clearSelectionTrigger]);

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
                          : header.column.id === 'select'
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
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                    onClick={(e: React.MouseEvent<HTMLTableRowElement>) => {
                      e.preventDefault();
                      handleRecipeClick(row.original);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      // Right align for actions column
                      const isRightAlignedColumn = cell.column.id === 'actions';
                      // Left align for select column
                      const isSelectColumn = cell.column.id === 'select';
                      // Notes column should allow wrapping
                      const isNotesColumn = cell.column.id === 'notes';
                      return (
                        <td 
                          key={cell.id} 
                          className={`px-8 py-4 ${
                            isNotesColumn ? 'align-top' : ''
                          } ${
                            isRightAlignedColumn ? 'text-right' : ''
                          } ${isSelectColumn ? 'w-12' : ''} ${
                            !isNotesColumn && !isSelectColumn ? 'whitespace-nowrap' : ''
                          }`}
                          onClick={(e) => {
                            // Prevent row click when clicking on checkbox or actions column
                            if (isSelectColumn || isRightAlignedColumn) {
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
                          Start adding recipes to see them here.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards Layout */}
      <div className="md:hidden">
        {table.getRowModel().rows?.length ? (
          <div className="space-y-3">
            {table.getRowModel().rows.map((row) => (
              <MobileRecipeCard
                key={row.id}
                recipe={row.original}
                onRecipeDeleted={refreshData}
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
                  Start adding recipes to see them here.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination - Responsive */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <div className="text-sm text-gray-500 order-2 sm:order-1">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} recipe(s) selected.
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
      />
    </div>
  );
}

