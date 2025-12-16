"use client";

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { CreateGroupModal } from "./CreateGroupModal";
import { EditGroupModal } from "./EditGroupModal";
import { DeleteGroupModal } from "./DeleteGroupModal";
import { RecipeCardGrid } from "./RecipeCardGrid";
import { AddRecipeModal } from "../recipes/AddRecipeModal";
import { AddRecipesToGroupModal } from "./AddRecipesToGroupModal";
import { AddFriendToGroupModal } from "./AddFriendToGroupModal";
import { getMyGroups, getUserRoleInGroup, deleteGroup, exitGroup } from "@/lib/supabase/groups";
import { getGroupRecipes } from "@/lib/supabase/groupRecipes";
import type { GroupWithMembers, RecipeWithGuest } from "@/lib/types/database";

interface GroupsSectionProps {
  onGroupChange?: (group: GroupWithMembers | null) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export interface GroupsSectionRef {
  openCreateModal: () => void;
  openInviteModal: () => void;
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
}

export const GroupsSection = forwardRef<GroupsSectionRef, GroupsSectionProps>(({ onGroupChange, onLoadingChange }, ref) => {
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [recipes, setRecipes] = useState<RecipeWithGuest[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addRecipesModalOpen, setAddRecipesModalOpen] = useState(false);
  const [addNewRecipeModalOpen, setAddNewRecipeModalOpen] = useState(false);
  const [inviteFriendModalOpen, setInviteFriendModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleGroupChange = useCallback((group: GroupWithMembers) => {
    setSelectedGroup(group);
    onGroupChange?.(group);
  }, [onGroupChange]);

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
    selectedGroup: selectedGroup,
    groups: groups,
    onEditGroup: handleEditGroup,
    openAddExistingRecipeModal: () => setAddRecipesModalOpen(true),
    openAddNewRecipeModal: () => setAddNewRecipeModalOpen(true),
    handleGroupChange: handleGroupChange,
    handleDeleteGroup: handleDeleteGroup,
    handleExitGroup: handleExitGroup,
    userRole: userRole,
    loading: loading
  }), [selectedGroup, groups, userRole, loading, handleEditGroup, handleGroupChange, handleDeleteGroup, handleExitGroup]);
  
  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notify parent when loading state changes
  useEffect(() => {
    console.log('GroupsSection loading state:', loading);
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const loadRecipes = useCallback(async () => {
    if (!selectedGroup) {
      setRecipes([]);
      return;
    }
    try {
      const { data: recipeData, error: recipeError } = await getGroupRecipes(selectedGroup.id);
      
      if (recipeError) {
        console.error('Error loading recipes:', recipeError);
        return;
      }
      
      setRecipes(recipeData || []);
    } catch (err) {
      console.error('Error loading recipes:', err);
    }
  }, [selectedGroup]);

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
  
  async function loadGroups() {
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
        console.log('DEBUG: Loaded cookbooks data:', data);
        setGroups(data);
        // Auto-select first group if no group is selected
        if (data.length > 0 && !selectedGroup) {
          console.log('DEBUG: Auto-selecting first cookbook:', data[0]);
          setSelectedGroup(data[0]);
          onGroupChange?.(data[0]);
        }
      }
    } catch (err) {
      setError('Failed to load cookbooks');
      console.error('Error loading cookbooks:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleGroupCreated = () => {
    // Refresh groups list and close modal
    loadGroups();
    setCreateModalOpen(false);
  };

  const handleRecipeClick = (recipe: RecipeWithGuest) => {
    // TODO: Implement recipe view/edit functionality
    console.log('Recipe clicked:', recipe);
  };

  const handleEditRecipe = (recipe: RecipeWithGuest) => {
    // TODO: Implement recipe editing functionality
    console.log('Edit recipe:', recipe);
  };

  const handleRemoveRecipe = (recipe: RecipeWithGuest) => {
    // TODO: Implement recipe removal functionality
    console.log('Remove recipe:', recipe);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
  };

  const handleGroupUpdated = (updatedGroup: GroupWithMembers) => {
    // Update the groups list
    setGroups(prev => 
      prev.map(g => g.id === updatedGroup.id ? updatedGroup : g)
    );
    // Update selected group
    setSelectedGroup(updatedGroup);
    // Notify parent component about the change
    onGroupChange?.(updatedGroup);
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
          // TODO: Show error toast
          return;
        }
      } else {
        const { error } = await exitGroup(selectedGroup.id);
        if (error) {
          console.error('Failed to exit cookbook:', error);
          // TODO: Show error toast
          return;
        }
      }

      // Refresh groups list
      await loadGroups();
      setDeleteModalOpen(false);
      
    } catch (err) {
      console.error('Unexpected error:', err);
      // TODO: Show error toast
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-gray-500">Loading cookbooks...</p>
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
              onClick={loadGroups} 
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
    <div className="space-y-6">
      {/* Content Section */}
      {groups.length === 0 ? (
        // No groups state
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md mx-auto">
            <h3 className="text-2xl font-serif font-semibold text-gray-500 mb-4">
              No cookbooks yet
            </h3>
            <p className="text-lg text-gray-500">
              Create your first cookbook to start collaborating on recipes with friends and family.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop: Show selected group recipes */}
          <div className="hidden md:block">
            {selectedGroup ? (
              <div>
                {/* Shared cookbook indicator */}
                {selectedGroup.cookbook && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Shared Cookbook:</span> {selectedGroup.cookbook.name}
                    </p>
                  </div>
                )}
                
                <RecipeCardGrid
                  recipes={recipes}
                  onRecipeClick={handleRecipeClick}
                  onEditRecipe={handleEditRecipe}
                  onRemoveRecipe={handleRemoveRecipe}
                />
              </div>
            ) : (
              // Loading selected group
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-gray-500">Loading cookbook...</p>
                </div>
              </div>
            )}
          </div>

          {/* Mobile: Show groups as cards, then selected group recipes */}
          <div className="md:hidden">
            {selectedGroup ? (
              <div>
                <RecipeCardGrid
                  recipes={recipes}
                  onRecipeClick={handleRecipeClick}
                  onEditRecipe={handleEditRecipe}
                  onRemoveRecipe={handleRemoveRecipe}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map((group: GroupWithMembers) => (
                  <Button
                    key={group.id}
                    variant="outline"
                    className="w-full justify-start p-4 h-auto"
                    onClick={() => handleGroupChange(group)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{group.name}</div>
                      {group.description && (
                        <div className="text-sm text-gray-500 mt-1">{group.description}</div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
      
      {/* Add New Recipe Modal */}
      <AddRecipeModal
        isOpen={addNewRecipeModalOpen}
        onClose={() => setAddNewRecipeModalOpen(false)}
        groupId={selectedGroup?.id}
        onRecipeAdded={() => {
          loadRecipes();
          setAddNewRecipeModalOpen(false);
        }}
      />
      
      {/* Add Existing Recipes Modal */}
      <AddRecipesToGroupModal
        isOpen={addRecipesModalOpen}
        onClose={() => setAddRecipesModalOpen(false)}
        groupId={selectedGroup?.id || null}
        onRecipesAdded={() => {
          loadRecipes();
          setAddRecipesModalOpen(false);
        }}
      />
      
      {/* Edit Group Modal */}
      <EditGroupModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        group={selectedGroup}
        onGroupUpdated={handleGroupUpdated}
      />

      {/* Delete/Exit Group Modal */}
      <DeleteGroupModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        group={selectedGroup}
        onConfirm={handleConfirmDeleteExit}
        loading={isDeleting}
        userRole={userRole}
      />

      {/* Add Friend to Group Modal */}
      <AddFriendToGroupModal
        isOpen={inviteFriendModalOpen}
        onClose={() => setInviteFriendModalOpen(false)}
        group={selectedGroup}
        onInviteSent={() => {
          setInviteFriendModalOpen(false);
          // Optionally refresh groups or show success toast
        }}
      />
    </div>
  );
});

GroupsSection.displayName = "GroupsSection";