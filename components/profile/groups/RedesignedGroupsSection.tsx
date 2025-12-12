"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
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
import { getMyGroups, getUserRoleInGroup, deleteGroup, exitGroup } from "@/lib/supabase/groups";
import { getGroupRecipes, searchGroupRecipes } from "@/lib/supabase/groupRecipes";
import type { GroupWithMembers, RecipeWithGuest } from "@/lib/types/database";

interface GroupsSectionProps {
  onGroupChange?: (group: GroupWithMembers | null) => void;
  onLoadingChange?: (loading: boolean) => void;
  onRecipeCountChange?: (count: number) => void;
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
  
  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
  }), [selectedGroup, groups, userRole, loading]);
  
  useEffect(() => {
    loadGroups();
  }, []);

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
  }, [selectedGroup]);

  // Update recipe count for parent
  useEffect(() => {
    onRecipeCountChange?.(recipes.length);
  }, [recipes.length, onRecipeCountChange]);
  
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
        setGroups(data);
        // Auto-select first group if no group is selected
        if (data.length > 0 && !selectedGroup) {
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

  async function loadRecipes() {
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
  }

  const handleGroupCreated = () => {
    loadGroups();
    setCreateModalOpen(false);
  };

  const handleGroupChange = (group: GroupWithMembers) => {
    setSelectedGroup(group);
    onGroupChange?.(group);
  };

  const handleEditGroup = () => {
    setEditModalOpen(true);
  };

  const handleGroupUpdated = (updatedGroup: GroupWithMembers) => {
    setGroups(prev => 
      prev.map(g => g.id === updatedGroup.id ? updatedGroup : g)
    );
    setSelectedGroup(updatedGroup);
    onGroupChange?.(updatedGroup);
  };

  const handleDeleteGroup = () => {
    setDeleteModalOpen(true);
  };

  const handleExitGroup = () => {
    setDeleteModalOpen(true);
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

      await loadGroups();
      setDeleteModalOpen(false);
      
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRecipeClick = (recipe: RecipeWithGuest) => {
    // TODO: Open recipe details modal
    console.log('Recipe clicked:', recipe);
  };

  const handleEditRecipe = (recipe: RecipeWithGuest) => {
    // TODO: Open edit recipe modal
    console.log('Edit recipe:', recipe);
  };

  const handleRemoveRecipe = (recipe: RecipeWithGuest) => {
    // TODO: Open remove recipe modal
    console.log('Remove recipe:', recipe);
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
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
        groupId={selectedGroup?.id}
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
    </div>
  );
});

RedesignedGroupsSection.displayName = "RedesignedGroupsSection";