"use client";

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { CreateGroupModal } from "./CreateGroupModal";
import { EditGroupModal } from "./EditGroupModal";
import { DeleteGroupModal } from "./DeleteGroupModal";
import { RecipeCardGrid } from "./RecipeCardGrid";
import { AddRecipeModal } from "../recipes/AddRecipeModal";
import { AddRecipesToGroupModal } from "./AddRecipesToGroupModal";
import { AddFriendToGroupModal } from "./AddFriendToGroupModal";
import { RemoveRecipeFromGroupModal } from "./RemoveRecipeFromGroupModal";
import { AddGuestModal } from "../guests/AddGuestModal";
import { RecipeDetailsModal } from "../recipes/RecipeDetailsModal";
import { getMyGroups, getUserRoleInGroup, deleteGroup, exitGroup } from "@/lib/supabase/groups";
import { getGroupRecipes, searchGroupRecipes, removeRecipeFromGroup } from "@/lib/supabase/groupRecipes";
import type { GroupWithMembers, RecipeWithGuest } from "@/lib/types/database";

interface GroupsSectionProps {
  onGroupChange?: (group: GroupWithMembers | null) => void;
  onLoadingChange?: (loading: boolean) => void;
  onRecipeCountChange?: (count: number, uniqueContributors: number) => void;
}

export interface GroupsSectionRef {
  openCreateModal: () => void;
  openInviteModal: () => void;
  openAddGuestModal: () => void;
  selectedGroup: GroupWithMembers | null;
  groups: GroupWithMembers[];
  onEditGroup: () => void;
  openAddExistingRecipeModal: () => void;
  openAddNewRecipeModal: () => void;
  handleGroupChange: (group: GroupWithMembers) => void;
  handleDeleteGroup: () => void;
  handleExitGroup: () => void;
  userRole: string | null;
  loading: boolean;
  loadGroups: (forceRefreshSelected?: boolean) => Promise<void>;
}

export const RedesignedGroupsSection = forwardRef<GroupsSectionRef, GroupsSectionProps>(({ 
  onGroupChange, 
  onLoadingChange,
  onRecipeCountChange 
}, ref) => {
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [recipes, setRecipes] = useState<RecipeWithGuest[]>([]);
  const [searchValue, setSearchValue] = useState("");
  
  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addRecipesModalOpen, setAddRecipesModalOpen] = useState(false);
  const [addNewRecipeModalOpen, setAddNewRecipeModalOpen] = useState(false);
  const [inviteFriendModalOpen, setInviteFriendModalOpen] = useState(false);
  const [removeRecipeModalOpen, setRemoveRecipeModalOpen] = useState(false);
  const [addGuestModalOpen, setAddGuestModalOpen] = useState(false);
  const [recipeToRemove, setRecipeToRemove] = useState<RecipeWithGuest | null>(null);
  const [recipeDetailsModalOpen, setRecipeDetailsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithGuest | null>(null);
  const [recipeDetailsEditMode, setRecipeDetailsEditMode] = useState(false);
  
  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Use ref to avoid dependency issues
  const onGroupChangeRef = useRef(onGroupChange);
  onGroupChangeRef.current = onGroupChange;
  
  const loadGroups = useCallback(async (forceRefreshSelected = false) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: groupsError } = await getMyGroups();
      
      if (groupsError) {
        setError(groupsError);
        setLoading(false);
        return;
      }
      
      if (data) {
        setGroups(data);
        // Auto-select first group if no group is selected
        // OR refresh the selected group with fresh data if forceRefreshSelected is true
        setSelectedGroup(prev => {
          if (data.length > 0 && !prev) {
            // First time load - select first group
            const firstGroup = data[0];
            // Defer the callback to avoid setState during render
            setTimeout(() => onGroupChangeRef.current?.(firstGroup), 0);
            return firstGroup;
          } else if (forceRefreshSelected && prev) {
            // Refresh selected group with fresh data from database
            const refreshedGroup = data.find(g => g.id === prev.id);
            if (refreshedGroup) {
              // console.log removed for production
              // Defer the callback to avoid setState during render
              setTimeout(() => onGroupChangeRef.current?.(refreshedGroup), 0);
              return refreshedGroup;
            }
          }
          return prev;
        });
      }
    } catch (err) {
      setError('Failed to load cookbooks');
      console.error('Error loading cookbooks:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Remove onGroupChange from dependencies to prevent infinite loop

  const loadRecipes = useCallback(async () => {
    if (!selectedGroup) {
      setRecipes([]);
      return;
    }

    try {
      const { data: recipeData, error: recipeError } = await getGroupRecipes(selectedGroup.id);
      
      if (recipeError) {
        console.error('Error loading recipes:', recipeError);
        setRecipes([]);
        return;
      }
      
      if (recipeData) {
        setRecipes(recipeData);
      }
    } catch (err) {
      console.error('Error loading recipes:', err);
      setRecipes([]);
    }
  }, [selectedGroup]);

  const handleGroupChange = useCallback((group: GroupWithMembers) => {
    setSelectedGroup(group);
    onGroupChangeRef.current?.(group);
  }, []);

  const handleEditGroup = useCallback(() => {
    setEditModalOpen(true);
  }, []);

  const handleDeleteGroup = useCallback(() => {
    setDeleteModalOpen(true);
  }, []);

  const handleExitGroup = useCallback(() => {
    setDeleteModalOpen(true);
  }, []);

  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    openCreateModal: () => setCreateModalOpen(true),
    openInviteModal: () => setInviteFriendModalOpen(true),
    openAddGuestModal: () => setAddGuestModalOpen(true),
    selectedGroup: selectedGroup,
    groups: groups,
    onEditGroup: handleEditGroup,
    openAddExistingRecipeModal: () => setAddRecipesModalOpen(true),
    openAddNewRecipeModal: () => {
      if (!selectedGroup) {
        console.error('Cannot open AddRecipeModal: No group selected');
        return;
      }
      // console.log removed for production
      setAddNewRecipeModalOpen(true);
    },
    handleGroupChange: handleGroupChange,
    handleDeleteGroup: handleDeleteGroup,
    handleExitGroup: handleExitGroup,
    userRole: userRole,
    loading: loading,
    loadGroups: loadGroups
  }), [selectedGroup, groups, userRole, loading, handleEditGroup, handleGroupChange, handleDeleteGroup, handleExitGroup, loadGroups]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Notify parent when loading state changes
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  // Load user role when selected group changes
  useEffect(() => {
    const loadUserRole = async () => {
      if (!selectedGroup) {
        setUserRole(null);
        return;
      }

      const { data: role, error: roleError } = await getUserRoleInGroup(selectedGroup.id);
      if (!roleError && role) {
        setUserRole(role);
      }
    };

    loadUserRole();
    loadRecipes();
  }, [selectedGroup, loadRecipes]);

  // Update recipe count and unique contributors for parent
  useEffect(() => {
    // Calculate unique contributors
    const uniqueContributors = new Set(
      recipes
        .map(recipe => {
          // For guest recipes, use guest_id
          if (recipe.guest_id && recipe.guests) {
            return recipe.guest_id;
          }
          // For user recipes, use user_id
          if (recipe.user_id) {
            return recipe.user_id;
          }
          return null;
        })
        .filter(id => id !== null)
    ).size;
    
    onRecipeCountChange?.(recipes.length, uniqueContributors);
  }, [recipes.length, recipes, onRecipeCountChange]);


  const handleGroupCreated = () => {
    loadGroups();
    setCreateModalOpen(false);
  };

  const handleGroupUpdated = (updatedGroup: GroupWithMembers) => {
    setGroups(prev => 
      prev.map(g => g.id === updatedGroup.id ? updatedGroup : g)
    );
    setSelectedGroup(updatedGroup);
    // Defer the callback to avoid setState during render
    setTimeout(() => onGroupChange?.(updatedGroup), 0);
  };

  const handleConfirmDeleteExit = async () => {
    if (!selectedGroup || !userRole) return;
    
    setIsDeleting(true);
    try {
      const isOwner = userRole === 'owner';
      
      if (isOwner) {
        const { error } = await deleteGroup(selectedGroup.id);
        if (error) {
          console.error('Failed to delete cookbook:', error);
          return;
        }
      } else {
        const { error } = await exitGroup(selectedGroup.id);
        if (error) {
          console.error('Failed to exit cookbook:', error);
          return;
        }
      }

      await loadGroups(true); // Force refresh to update state
      setDeleteModalOpen(false);
      
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRecipeClick = (recipe: RecipeWithGuest) => {
    setSelectedRecipe(recipe);
    setRecipeDetailsEditMode(false);
    setRecipeDetailsModalOpen(true);
  };

  const handleEditRecipe = (recipe: RecipeWithGuest) => {
    setSelectedRecipe(recipe);
    setRecipeDetailsEditMode(true);
    setRecipeDetailsModalOpen(true);
  };

  const handleRemoveRecipe = (recipe: RecipeWithGuest) => {
    setRecipeToRemove(recipe);
    setRemoveRecipeModalOpen(true);
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleConfirmRemoveRecipe = async () => {
    if (!recipeToRemove || !selectedGroup) return;
    
    try {
      setIsRemoving(true);
      const { error } = await removeRecipeFromGroup(recipeToRemove.id, selectedGroup.id);
      
      if (error) {
        console.error('Error removing recipe:', error);
        // TODO: Show error toast
        return;
      }
      
      // Refresh recipes
      await loadRecipes();
      
      // Close modal
      setRemoveRecipeModalOpen(false);
      setRecipeToRemove(null);
    } catch (err) {
      console.error('Error removing recipe:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-[hsl(var(--brand-warm-gray))]">Loading cookbooks...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">Error: {error}</p>
            <Button 
              onClick={() => loadGroups()} 
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

  // No groups state
  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md mx-auto">
          <h3 className="text-h2 text-[hsl(var(--brand-warm-gray))] mb-4">
            No cookbooks yet
          </h3>
          <p className="text-body-small">
            Create your first cookbook to start collaborating on recipes with friends and family.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      {selectedGroup && recipes.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[hsl(var(--brand-warm-gray))]" />
            <input
              type="text"
              placeholder="Search recipes"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      )}

      {/* Recipe Grid */}
      {selectedGroup ? (
        <RecipeCardGrid
          recipes={recipes}
          onRecipeClick={handleRecipeClick}
          onEditRecipe={handleEditRecipe}
          onRemoveRecipe={handleRemoveRecipe}
          searchValue={searchValue}
        />
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-[hsl(var(--brand-warm-gray))]">Loading cookbook...</p>
          </div>
        </div>
      )}
      
      {/* Modals */}
      <CreateGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
      
      <AddRecipeModal
        isOpen={addNewRecipeModalOpen}
        onClose={() => setAddNewRecipeModalOpen(false)}
        groupId={selectedGroup?.id || ''}
        onRecipeAdded={() => {
          loadRecipes();
          setAddNewRecipeModalOpen(false);
        }}
      />
      
      <AddRecipesToGroupModal
        isOpen={addRecipesModalOpen}
        onClose={() => setAddRecipesModalOpen(false)}
        groupId={selectedGroup?.id || null}
        onRecipesAdded={() => {
          loadRecipes();
          setAddRecipesModalOpen(false);
        }}
      />
      
      <EditGroupModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        group={selectedGroup}
        onGroupUpdated={handleGroupUpdated}
      />

      <DeleteGroupModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        group={selectedGroup}
        onConfirm={handleConfirmDeleteExit}
        loading={isDeleting}
        userRole={userRole}
      />

      <AddFriendToGroupModal
        isOpen={inviteFriendModalOpen}
        onClose={() => setInviteFriendModalOpen(false)}
        group={selectedGroup}
        onInviteSent={() => {
          setInviteFriendModalOpen(false);
        }}
      />
      
      <RemoveRecipeFromGroupModal
        isOpen={removeRecipeModalOpen}
        recipeName={recipeToRemove?.recipe_name || ''}
        isOwnRecipe={recipeToRemove?.guests?.is_self || false}
        onClose={() => {
          setRemoveRecipeModalOpen(false);
          setRecipeToRemove(null);
        }}
        onConfirm={handleConfirmRemoveRecipe}
        loading={isRemoving}
      />

      <AddGuestModal
        isOpen={addGuestModalOpen}
        onClose={() => setAddGuestModalOpen(false)}
        groupId={selectedGroup?.id}
        onGuestAdded={() => {
          setAddGuestModalOpen(false);
          // Optionally refresh recipes if needed to show new guest's contributions
          loadRecipes();
        }}
      />

      <RecipeDetailsModal
        recipe={selectedRecipe}
        isOpen={recipeDetailsModalOpen}
        onClose={() => {
          setRecipeDetailsModalOpen(false);
          setSelectedRecipe(null);
          setRecipeDetailsEditMode(false);
        }}
        onRecipeUpdated={() => {
          loadRecipes();
        }}
        initialEditMode={recipeDetailsEditMode}
      />
    </div>
  );
});

RedesignedGroupsSection.displayName = "RedesignedGroupsSection";