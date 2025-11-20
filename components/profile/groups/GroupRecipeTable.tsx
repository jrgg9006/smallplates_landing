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
import { AddFriendToGroupModal } from "./AddFriendToGroupModal";
import { MobileGroupRecipeCard } from "./MobileGroupRecipeCard";
import "@/lib/types/table";

interface GroupRecipeTableProps {
  group: GroupWithMembers;
  groups: GroupWithMembers[];
  onGroupChange: (group: GroupWithMembers) => void;
  onCreateGroup: () => void;
  onRecipeAdded?: () => void;
  onAddExistingRecipe?: () => void;
  onAddNewRecipe?: () => void;
  onDeleteGroup?: () => void;
  onExitGroup?: () => void;
  userRole?: string | null;
}

export function GroupRecipeTable({ 
  group, 
  groups,
  onGroupChange,
  onCreateGroup,
  onRecipeAdded,
  onAddExistingRecipe,
  onAddNewRecipe,
  onDeleteGroup,
  onExitGroup,
  userRole
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
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);

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
    setIsInviteModalOpen(true);
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
          onDeleteGroup={onDeleteGroup || (() => {})}
          onExitGroup={onExitGroup || (() => {})}
          userRole={userRole}
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
          onDeleteGroup={onDeleteGroup || (() => {})}
          onExitGroup={onExitGroup || (() => {})}
          userRole={userRole}
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
    <div className="w-full space-y-6">
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
          <div className="md:hidden space-y-4 px-1">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <MobileGroupRecipeCard
                  key={row.id}
                  recipe={row.original}
                  onRecipeClick={handleRowClick}
                  onRecipeRemoved={() => {
                    // Call the meta function to handle recipe removal
                    table.options.meta?.onRecipeRemoved?.();
                  }}
                  onRecipeCopied={() => {
                    // Call the meta function to handle recipe copying
                    table.options.meta?.onRecipeCopied?.();
                  }}
                />
              ))
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <div className="text-center max-w-sm mx-auto">
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    No recipes yet
                  </h3>
                  <p className="text-sm text-gray-500">
                    Start adding recipes to this cookbook to see them here.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination - Responsive */}
          {table.getPageCount() > 1 && (
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

      {/* Add Friend to Group Modal */}
      <AddFriendToGroupModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        group={group}
        onInviteSent={() => {
          console.log('Invite sent successfully!');
          // Could trigger a refresh of group members here if needed
        }}
      />
    </div>
  );
}