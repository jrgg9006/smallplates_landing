"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { CreateGroupModal } from "./CreateGroupModal";
import { EditGroupModal } from "./EditGroupModal";
import { GroupRecipeTable } from "./GroupRecipeTable";
import { AddRecipeModal } from "../recipes/AddRecipeModal";
import { AddRecipesToGroupModal } from "./AddRecipesToGroupModal";
import { AddButton } from "@/components/ui/AddButton";
import { getMyGroups } from "@/lib/supabase/groups";
import type { GroupWithMembers } from "@/lib/types/database";

interface GroupsSectionProps {
  onGroupChange?: (group: GroupWithMembers | null) => void;
}

export interface GroupsSectionRef {
  openCreateModal: () => void;
  selectedGroup: GroupWithMembers | null;
  onEditGroup: () => void;
}

export const GroupsSection = forwardRef<GroupsSectionRef, GroupsSectionProps>(({ onGroupChange }, ref) => {
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addRecipesModalOpen, setAddRecipesModalOpen] = useState(false);
  const [addNewRecipeModalOpen, setAddNewRecipeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    openCreateModal: () => setCreateModalOpen(true),
    selectedGroup: selectedGroup,
    onEditGroup: handleEditGroup
  }));
  
  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  async function loadGroups() {
    try {
      setLoading(true);
      setError(null);
      const { data, error: groupsError } = await getMyGroups();
      
      if (groupsError) {
        setError(groupsError);
        return;
      }
      
      if (data) {
        console.log('DEBUG: Loaded groups data:', data);
        setGroups(data);
        // Auto-select first group if no group is selected
        if (data.length > 0 && !selectedGroup) {
          console.log('DEBUG: Auto-selecting first group:', data[0]);
          setSelectedGroup(data[0]);
          onGroupChange?.(data[0]);
        }
      }
    } catch (err) {
      setError('Failed to load groups');
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleGroupCreated = () => {
    // Refresh groups list and close modal
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
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-gray-500">Loading groups...</p>
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
              No groups yet
            </h3>
            <p className="text-lg text-gray-500">
              Create your first group to start collaborating on recipes with friends and family.
            </p>
          </div>
        </div>
      ) : selectedGroup ? (
        // Groups content
        <div>
          {/* Shared cookbook indicator */}
          {selectedGroup.cookbook && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Shared Cookbook:</span> {selectedGroup.cookbook.name}
              </p>
            </div>
          )}
          
          <GroupRecipeTable 
            group={selectedGroup} 
            groups={groups}
            onGroupChange={handleGroupChange}
            onCreateGroup={() => setCreateModalOpen(true)}
            onRecipeAdded={loadGroups}
            onAddExistingRecipe={() => setAddRecipesModalOpen(true)}
            onAddNewRecipe={() => {
              console.log('🔥🔥🔥 DEBUG: Groups section - Opening Add Recipe Modal', { 
                selectedGroup: selectedGroup,
                selectedGroupId: selectedGroup?.id
              });
              setAddNewRecipeModalOpen(true);
            }}
          />
        </div>
      ) : (
        // Loading selected group
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-gray-500">Loading group...</p>
          </div>
        </div>
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
          loadGroups();
          setAddNewRecipeModalOpen(false);
        }}
      />
      
      {/* Add Existing Recipes Modal */}
      <AddRecipesToGroupModal
        isOpen={addRecipesModalOpen}
        onClose={() => setAddRecipesModalOpen(false)}
        groupId={selectedGroup?.id || null}
        onRecipesAdded={() => {
          loadGroups();
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
    </div>
  );
});

GroupsSection.displayName = "GroupsSection";