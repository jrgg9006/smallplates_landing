"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { RecipeWithGuest, GroupWithMembers } from "@/lib/types/database";
import { getGroupRecipes, searchGroupRecipes, updateGroupRecipeOrder } from "@/lib/supabase/groupRecipes";
import { createGroupRecipeColumns } from "./GroupRecipeTableColumns";
import { GroupRecipeTableControls } from "./GroupRecipeTableControls";
import { Button } from "@/components/ui/button";
import { RecipeDetailsModal } from "@/components/profile/recipes/RecipeDetailsModal";
import { AddFriendToGroupModal } from "./AddFriendToGroupModal";
import { MobileGroupRecipeCard } from "./MobileGroupRecipeCard";
import { DesktopGroupRecipeCard } from "./DesktopGroupRecipeCard";
import { ShareCollectionModal } from "@/components/profile/guests/ShareCollectionModal";
import { getUserCollectionToken } from "@/lib/supabase/collection";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import { createShareURL } from "@/lib/utils/sharing";
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
  const [isReordering, setIsReordering] = React.useState(false);
  
  // Table state - disable sorting when using drag and drop
  const [sorting, setSorting] = React.useState<SortingState>([]);
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
  const [isCollectionModalOpen, setIsCollectionModalOpen] = React.useState(false);
  const [collectionUrl, setCollectionUrl] = React.useState<string>('');
  const [userFullName, setUserFullName] = React.useState<string | null>(null);

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

  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !group.id) {
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
      const updates: Promise<{ data: any; error: string | null }>[] = [];
      
      // Determine the range of affected indices
      const startIndex = Math.min(oldIndex, newIndex);
      const endIndex = Math.max(oldIndex, newIndex);
      
      // Update all recipes in the affected range with their new display_order
      for (let i = startIndex; i <= endIndex; i++) {
        if (newData[i]) {
          updates.push(
            updateGroupRecipeOrder(group.id, newData[i].id, i)
          );
        }
      }

      // Wait for all updates to complete
      const results = await Promise.all(updates);
      const hasError = results.some((result) => result.error);

      if (hasError) {
        // If there's an error, refresh from server
        console.error('Error updating recipe order');
        forceRefresh();
      }
    } catch (err) {
      console.error('Error updating recipe order:', err);
      // Refresh from server on error
      forceRefresh();
    } finally {
      setIsReordering(false);
    }
  };

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
        pageSize: 100,
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

  const handleCollectPlate = async () => {
    try {
      const { data: tokenData } = await getUserCollectionToken();
      const { data: profile } = await getCurrentProfile();
      
      if (tokenData && typeof window !== 'undefined') {
        const url = createShareURL(window.location.origin, tokenData, { groupId: group.id });
        setCollectionUrl(url);
        setUserFullName(profile?.full_name || null);
        setIsCollectionModalOpen(true);
      }
    } catch (err) {
      console.error('Error loading collection data:', err);
    }
  };


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
    <div className="w-full">
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
        onDeleteGroup={onDeleteGroup || (() => {})}
        onExitGroup={onExitGroup || (() => {})}
        userRole={userRole}
      />

      {/* Spacing between controls and content */}
      <div className="mt-2"></div>

      {/* Empty State */}
      {data.length === 0 && !loading && !searchValue.trim() ? (
        <div className="max-w-5xl mx-auto py-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={onAddNewRecipe || (() => {})}
              variant="outline"
              className="font-sans text-base font-light text-gray-900 bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 px-8 py-6 rounded-lg shadow-sm transition-all"
            >
              Create a new plate
            </Button>
            <Button
              onClick={onAddExistingRecipe || (() => {})}
              variant="outline"
              className="font-sans text-base font-light text-gray-900 bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 px-8 py-6 rounded-lg shadow-sm transition-all"
            >
              Add a Saved Plate
            </Button>
            <Button
              onClick={handleCollectPlate}
              variant="outline"
              className="font-sans text-base font-light text-gray-900 bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 px-8 py-6 rounded-lg shadow-sm transition-all"
            >
              Collect a new plate
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Card Grid */}
          <div className="hidden md:block">
            {table.getRowModel().rows?.length ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={data.map((recipe) => recipe.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="max-w-5xl mx-auto space-y-4">
                    {table.getRowModel().rows.map((row, index) => (
                      <DesktopGroupRecipeCard
                        key={row.id}
                        id={row.original.id}
                        recipe={row.original}
                        groupId={group.id}
                        onRecipeClick={handleRowClick}
                        onRecipeRemoved={() => {
                          table.options.meta?.onRecipeRemoved?.();
                        }}
                        onRecipeCopied={() => {
                          table.options.meta?.onRecipeCopied?.();
                        }}
                        colorIndex={index}
                        recipeNumber={index + 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : null}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 px-1">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <MobileGroupRecipeCard
                  key={row.id}
                  recipe={row.original}
                  groupId={group.id}
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
            ) : null}
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

      {/* Share Collection Modal */}
      {collectionUrl && (
        <ShareCollectionModal
          isOpen={isCollectionModalOpen}
          onClose={() => setIsCollectionModalOpen(false)}
          collectionUrl={collectionUrl}
          userName={userFullName}
        />
      )}
    </div>
  );
}