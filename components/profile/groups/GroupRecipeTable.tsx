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
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { RecipeWithGuest, GroupWithMembers } from "@/lib/types/database";
import { getGroupRecipes, searchGroupRecipes } from "@/lib/supabase/groupRecipes";
import { createGroupRecipeColumns } from "./GroupRecipeTableColumns";
import { GroupRecipeTableControls } from "./GroupRecipeTableControls";
import { Button } from "@/components/ui/button";
import { RecipeDetailsModal } from "@/components/profile/recipes/RecipeDetailsModal";
import "@/lib/types/table";

interface GroupRecipeTableProps {
  group: GroupWithMembers;
  groups: GroupWithMembers[];
  onGroupChange: (group: GroupWithMembers) => void;
  onCreateGroup: () => void;
  onRecipeAdded?: () => void;
  onAddExistingRecipe?: () => void;
  onAddNewRecipe?: () => void;
}

export function GroupRecipeTable({ 
  group, 
  groups,
  onGroupChange,
  onCreateGroup,
  onRecipeAdded,
  onAddExistingRecipe,
  onAddNewRecipe 
}: GroupRecipeTableProps) {
  // Data management
  const [data, setData] = React.useState<RecipeWithGuest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Table state - sort by created_at descending to show most recently added recipes first
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ created_at: false });
  
  // Search state
  const [searchValue, setSearchValue] = React.useState<string>('');
  
  // Refresh trigger for forcing data reload
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  
  // Modal state
  const [selectedRecipe, setSelectedRecipe] = React.useState<RecipeWithGuest | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Create columns with group ID
  const columns = React.useMemo(() => createGroupRecipeColumns(group.id), [group.id]);

  // Force refresh function
  const forceRefresh = React.useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Load recipes effect
  React.useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        let result;
        if (searchValue.trim()) {
          result = await searchGroupRecipes(group.id, searchValue);
        } else {
          result = await getGroupRecipes(group.id);
        }

        const { data: recipesData, error: recipesError } = result;

        if (recipesError) {
          setError(recipesError);
          return;
        }

        setData(recipesData || []);
      } catch (err) {
        setError('Failed to load recipes');
        console.error('Error loading group recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    if (group.id) {
      loadRecipes();
    }
  }, [group.id, searchValue, refreshTrigger]);

  // Handle search with debouncing
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Search is handled in the loadRecipes effect above
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    meta: {
      onRecipeRemoved: () => {
        forceRefresh();
        if (onRecipeAdded) {
          onRecipeAdded(); // Call this to refresh parent components
        }
      },
      onRecipeCopied: () => {
        // Could show a success message here
        console.log('Recipe copied to personal collection');
      },
    },
  });

  const handleRowClick = (recipe: RecipeWithGuest) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleInviteFriend = () => {
    // TODO: Implement invite member functionality
    console.log('Invite friend clicked');
  };

  // Show loading state
  if (loading && data.length === 0) {
    return (
      <div className="w-full">
        <GroupRecipeTableControls
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          groups={groups}
          selectedGroup={group}
          onGroupChange={onGroupChange}
          onCreateGroup={onCreateGroup}
          onInviteFriend={handleInviteFriend}
          onAddExistingRecipe={onAddExistingRecipe || (() => {})}
          onAddNewRecipe={onAddNewRecipe || (() => {})}
        />
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="text-center">
            <p className="text-gray-500">Loading recipes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full">
        <GroupRecipeTableControls
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          groups={groups}
          selectedGroup={group}
          onGroupChange={onGroupChange}
          onCreateGroup={onCreateGroup}
          onInviteFriend={handleInviteFriend}
          onAddExistingRecipe={onAddExistingRecipe || (() => {})}
          onAddNewRecipe={onAddNewRecipe || (() => {})}
        />
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">Error: {error}</p>
            <Button 
              onClick={forceRefresh} 
              className="mt-2"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <GroupRecipeTableControls
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        groups={groups}
        selectedGroup={group}
        onGroupChange={onGroupChange}
        onCreateGroup={onCreateGroup}
        onInviteFriend={handleInviteFriend}
        onAddExistingRecipe={onAddExistingRecipe || (() => {})}
        onAddNewRecipe={onAddNewRecipe || (() => {})}
      />

      {/* Empty State */}
      {data.length === 0 && !loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-gray-500 mb-3">
                {searchValue ? 'No recipes found' : 'No recipes yet'}
              </h3>
              <p className="text-lg text-gray-500">
                {searchValue 
                  ? `No recipes match "${searchValue}" in "${group.name}".`
                  : `Start collaborating by adding your first recipe to "${group.name}".`
                }
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-gray-200 bg-gray-50">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="text-left py-3 px-4 font-medium text-gray-900 text-sm"
                          style={{ width: header.getSize() }}
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
                <tbody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleRowClick(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="py-4 px-4">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <div
                  key={row.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleRowClick(row.original)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-base text-gray-900 truncate">
                          {row.original.recipe_name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Added by {row.original.guests?.first_name || 'Unknown'} {row.original.guests?.last_name || ''}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(row.original.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        {/* Actions would go here */}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500">No results found.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {table.getPageCount() > 1 && (
            <div className="flex items-center justify-between py-4">
              <div className="flex-1 text-sm text-gray-500">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} recipe(s) selected.
              </div>
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Rows per page</p>
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => {
                      table.setPageSize(Number(e.target.value))
                    }}
                    className="h-8 w-16 rounded border border-gray-300 text-sm"
                  >
                    {[10, 20, 30, 40, 50].map(pageSize => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex w-24 items-center justify-center text-sm font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronLeft className="h-4 w-4 -ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to last page</span>
                    <ChevronRight className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4 -ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Recipe Details Modal */}
      {selectedRecipe && (
        <RecipeDetailsModal
          recipe={selectedRecipe}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRecipe(null);
          }}
        />
      )}
    </div>
  );
}