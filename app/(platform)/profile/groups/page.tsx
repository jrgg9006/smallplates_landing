"use client";

import React from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GroupsSection, type GroupsSectionRef } from "@/components/profile/groups/GroupsSection";
import type { GroupWithMembers } from "@/lib/types/database";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { Button } from "@/components/ui/button";
import { Pencil, ChevronDown, Users, Plus, BookOpen } from "lucide-react";
import { AddGroupDropdown } from "@/components/ui/AddGroupDropdown";
import { AddGroupPageDropdown } from "@/components/ui/AddGroupPageDropdown";
import { GroupMembersDropdown } from "@/components/profile/groups/GroupMembersDropdown";
import { GroupActionsDropdown } from "@/components/profile/groups/GroupActionsDropdown";
import { useProfileOnboarding, OnboardingSteps } from "@/lib/contexts/ProfileOnboardingContext";
import { WelcomeOverlay } from "@/components/onboarding/WelcomeOverlay";
import { FirstRecipeExperience } from "@/components/onboarding/FirstRecipeExperience";
import { FirstRecipeModal, RecipeData } from "@/components/profile/FirstRecipeModal";
import { addUserRecipe, UserRecipeData } from "@/lib/supabase/recipes";

export default function GroupsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const groupsSectionRef = useRef<GroupsSectionRef>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Onboarding context
  const { 
    showWelcomeOverlay,
    showFirstRecipeExperience,
    dismissWelcome,
    skipAllOnboarding,
    startFirstRecipeExperience,
    skipFirstRecipeExperience,
    completeStep
  } = useProfileOnboarding();

  const handleAddGroup = () => {
    groupsSectionRef.current?.openCreateModal();
  };

  const handleInviteFriend = () => {
    groupsSectionRef.current?.openInviteModal();
  };

  const handleEditGroup = () => {
    groupsSectionRef.current?.onEditGroup();
  };

  const handleGroupChange = (group: GroupWithMembers | null) => {
    setSelectedGroup(group);
  };

  const handleFirstRecipeSubmit = async (recipeData: RecipeData) => {
    try {
      const userRecipeData: UserRecipeData = {
        recipeName: recipeData.recipeName,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        personalNote: recipeData.personalNote
      };

      const { data, error } = await addUserRecipe(userRecipeData);
      
      if (error) {
        console.error('Failed to add recipe:', error);
        throw new Error('Failed to save recipe. Please try again.');
      }

      // Complete the onboarding step
      completeStep(OnboardingSteps.FIRST_RECIPE);
      
      // The FirstRecipeExperience component will handle showing the confirmation message
    } catch (err) {
      console.error('Error saving recipe:', err);
      throw err; // Let the component handle the error display
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login redirect
  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-white text-gray-700">
      {/* Welcome Overlay */}
      {showWelcomeOverlay && (
        <WelcomeOverlay
          userName={user.email?.split('@')[0] || 'there'}
          onStart={startFirstRecipeExperience}
          onDismiss={skipAllOnboarding}
          isVisible={showWelcomeOverlay}
        />
      )}

      {/* First Recipe Experience */}
      {showFirstRecipeExperience && (
        <FirstRecipeExperience
          onSubmit={handleFirstRecipeSubmit}
          onSkip={skipFirstRecipeExperience}
        />
      )}

      <ProfileHeader />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            {/* Title section with editorial text - centered on mobile */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8 mb-4 lg:mb-0 justify-center lg:justify-start w-full lg:w-auto">
              {/* Editorial Text Version */}
              <motion.div 
                className="text-center lg:text-left w-full lg:w-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Privacy indicator */}
                {selectedGroup && (
                  <div className="mb-2">
                    <span className="text-sm font-light text-gray-500 tracking-widest uppercase">
                      COOKBOOK
                      {/* {selectedGroup.visibility === 'public' ? 'SHARED GROUP' : 'PRIVATE GROUP'} */}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-gray-900 mb-1">
                    {selectedGroup?.name || 'My Cookbooks'}
                  </h1>
                  {/* Desktop edit icon - hidden on mobile */}
                  {selectedGroup && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditGroup}
                      className="hidden lg:flex h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                      title="Edit cookbook name"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-col items-center lg:items-start">
                  <h3 className="text-lg font-light text-gray-600 mb-4 text-center lg:text-left">
                    {selectedGroup?.description?.trim() || 'Created by TEAM'}
                  </h3>
                  
                  {/* Group Selector Dropdown and Print Book Button - Side by side - Desktop only */}
                  <div className="hidden lg:flex items-center gap-3 mb-4">
                    {/* Group Selector Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 min-w-[200px] justify-between"
                      >
                        <span className="truncate">
                          {selectedGroup ? selectedGroup.name : 'Select Cookbook'}
                        </span>
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      </button>
                      
                      {isDropdownOpen && (
                        <>
                          <div className="absolute top-12 left-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            {groupsSectionRef.current?.groups.map((group) => (
                              <button
                                key={group.id}
                                onClick={() => {
                                  groupsSectionRef.current?.handleGroupChange(group);
                                  setSelectedGroup(group);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                                  selectedGroup?.id === group.id
                                    ? 'bg-gray-100 text-gray-900 font-medium'
                                    : 'text-gray-700'
                                }`}
                              >
                                <Users className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{group.name}</span>
                              </button>
                            ))}
                            <div className="border-t border-gray-200 mt-1 pt-1">
                              <button
                                onClick={() => {
                                  setIsDropdownOpen(false);
                                  handleAddGroup();
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Create New Cookbook
                              </button>
                            </div>
                          </div>
                          {/* Overlay to close dropdown */}
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsDropdownOpen(false)}
                          />
                        </>
                      )}
                    </div>
                    
                    {/* Print Book Button */}
                    <Button
                      onClick={() => {
                        // Placeholder - to be implemented
                        console.log('Print Book clicked');
                      }}
                      className="bg-black text-white hover:bg-gray-900 rounded-lg px-6 py-2 text-sm font-medium flex items-center gap-2 flex-shrink-0"
                    >
                      <BookOpen className="h-4 w-4" />
                      Print Book
                    </Button>
                  </div>
                  
                  {/* Mobile edit icon - shown only on mobile, below description */}
                  {selectedGroup && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditGroup}
                      className="lg:hidden h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 self-center mb-4"
                      title="Edit cookbook name"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Mobile: Add Group dropdown - positioned after subtitle */}
                <div className="lg:hidden mb-0 flex justify-center">
                  <AddGroupPageDropdown
                    onCreateNewGroup={handleAddGroup}
                    onInviteFriend={handleInviteFriend}
                    title="Group actions"
                  />
                </div>

              </motion.div>
            </div>
            
            {/* Right side - Action buttons - Desktop only */}
            <div className="hidden lg:flex flex-shrink-0 flex-col lg:flex-row items-center gap-3 lg:gap-4 justify-center w-full lg:w-auto">
              {/* Members Dropdown */}
              {selectedGroup && <GroupMembersDropdown group={selectedGroup} onInviteFriend={handleInviteFriend} />}

              {/* Group Actions Dropdown - Three dots menu */}
              {selectedGroup && (
                <GroupActionsDropdown
                  group={selectedGroup}
                  userRole={groupsSectionRef.current?.selectedGroup ? 'admin' : null}
                  onDeleteGroup={() => {}}
                  onExitGroup={() => {}}
                />
              )}

              <AddGroupDropdown
                onAddExistingRecipe={() => groupsSectionRef.current?.openAddExistingRecipeModal()}
                onAddNewRecipe={() => groupsSectionRef.current?.openAddNewRecipeModal()}
                onInviteFriend={handleInviteFriend}
                groupId={selectedGroup?.id || null}
                title="Add plates to this cookbook"
                className="hidden lg:flex"
              />
            </div>
          </div>
        </div>

        {/* Groups Content */}
        <GroupsSection ref={groupsSectionRef} onGroupChange={handleGroupChange} />
      </div>
    </div>
  );
}