"use client";

import React from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { GroupsSection, type GroupsSectionRef } from "@/components/profile/groups/GroupsSection";
import { BookPreviewPanel } from "@/components/profile/groups/BookPreviewPanel";
import type { GroupWithMembers } from "@/lib/types/database";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { Button } from "@/components/ui/button";
import { Pencil, ChevronDown, Users, Plus, BookOpen } from "lucide-react";
import { GroupMembersDropdown } from "@/components/profile/groups/GroupMembersDropdown";
import { GroupActionsDropdown } from "@/components/profile/groups/GroupActionsDropdown";
import { useProfileOnboarding, OnboardingSteps } from "@/lib/contexts/ProfileOnboardingContext";
import { WelcomeOverlay } from "@/components/onboarding/WelcomeOverlay";
import { FirstRecipeExperience } from "@/components/onboarding/FirstRecipeExperience";
import { FirstRecipeModal, RecipeData } from "@/components/profile/FirstRecipeModal";
import { addUserRecipe, UserRecipeData } from "@/lib/supabase/recipes";

export default function RedesignedGroupsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const groupsSectionRef = useRef<GroupsSectionRef>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [recipeCount, setRecipeCount] = useState(0);
  
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

  // Handler functions
  const handleWelcomeStart = () => {
    skipAllOnboarding();
  };

  const handleAddGroup = () => {
    groupsSectionRef.current?.openCreateModal();
  };

  const handleInviteFriend = () => {
    groupsSectionRef.current?.openInviteModal();
  };

  const handleEditGroup = () => {
    groupsSectionRef.current?.onEditGroup();
  };

  const handleDeleteGroup = () => {
    groupsSectionRef.current?.handleDeleteGroup();
  };

  const handleExitGroup = () => {
    groupsSectionRef.current?.handleExitGroup();
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

      completeStep(OnboardingSteps.FIRST_RECIPE);
    } catch (err) {
      console.error('Error saving recipe:', err);
      throw err;
    }
  };

  const handlePreviewBook = () => {
    console.log('Preview Book clicked');
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Handle GroupsSection loading state changes
  const handleGroupsLoadingChange = useCallback((isLoading: boolean) => {
    setGroupsLoading(isLoading);
  }, []);

  // Show login redirect
  if (!user) {
    if (loading) {
      return (
        <div className="min-h-screen bg-[hsl(var(--brand-warm-white))] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--brand-honey))] mx-auto mb-4"></div>
            <p className="text-[hsl(var(--brand-warm-gray))]">Loading...</p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-warm-white))] text-[hsl(var(--brand-charcoal))]">
      {/* Loading overlay */}
      {(loading || groupsLoading) && (
        <div className="fixed inset-0 bg-[hsl(var(--brand-warm-white))] z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--brand-honey))] mx-auto mb-4"></div>
            <p className="text-[hsl(var(--brand-warm-gray))]">Loading...</p>
          </div>
        </div>
      )}

      {/* Onboarding overlays */}
      {showWelcomeOverlay && (
        <WelcomeOverlay
          userName={user.email?.split('@')[0] || 'there'}
          onStart={handleWelcomeStart}
          onDismiss={skipAllOnboarding}
          isVisible={showWelcomeOverlay}
        />
      )}

      {showFirstRecipeExperience && (
        <FirstRecipeExperience
          onSubmit={handleFirstRecipeSubmit}
          onSkip={skipFirstRecipeExperience}
        />
      )}

      {/* Header */}
      <ProfileHeader />

      {/* Main two-zone layout */}
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Book Zone - Left Panel (30%) */}
        <div className="hidden lg:block w-80 bg-[hsl(var(--brand-cream))] p-8">
          <BookPreviewPanel 
            group={selectedGroup}
            recipeCount={recipeCount}
            onPreviewClick={handlePreviewBook}
          />
        </div>

        {/* Content Zone - Right Panel (70%) */}
        <div className="flex-1 p-6 lg:p-12 max-w-none">
          {/* Header Section */}
          <div className="mb-8">
            {/* Book Title */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-h1">
                  {selectedGroup?.name || 'My Cookbooks'}
                </h1>
                {selectedGroup && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditGroup}
                    className="h-8 w-8 p-0 text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-sand))]"
                    title="Edit book name"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-body-small">
                Recipes from the people who love you.
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-6 mb-8">
              {/* Primary Action: Add Recipe */}
              <Button
                onClick={() => groupsSectionRef.current?.openAddNewRecipeModal()}
                className="btn-primary"
                disabled={!selectedGroup}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add a Recipe
              </Button>

              {/* Secondary Action: Invite Captain */}
              <button
                onClick={handleInviteFriend}
                className="text-link"
                disabled={!selectedGroup}
              >
                Invite a Captain
              </button>

              {/* Utility Actions */}
              <div className="flex items-center gap-3 ml-auto">
                {/* Group Selector Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 border border-[hsl(var(--brand-sand))] rounded-lg bg-white text-sm font-medium text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-cream))] min-w-[200px] justify-between"
                  >
                    <span className="truncate">
                      {selectedGroup ? selectedGroup.name : 'Select Cookbook'}
                    </span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </button>
                  
                  {isDropdownOpen && (
                    <>
                      <div className="absolute top-12 left-0 w-64 bg-white rounded-lg shadow-lg border border-[hsl(var(--brand-sand))] py-2 z-50">
                        {groupsSectionRef.current?.groups.map((group) => (
                          <button
                            key={group.id}
                            onClick={() => {
                              groupsSectionRef.current?.handleGroupChange(group);
                              setSelectedGroup(group);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-[hsl(var(--brand-cream))] flex items-center gap-2 ${
                              selectedGroup?.id === group.id
                                ? 'bg-[hsl(var(--brand-cream))] text-[hsl(var(--brand-charcoal))] font-medium'
                                : 'text-[hsl(var(--brand-warm-gray))]'
                            }`}
                          >
                            <Users className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{group.name}</span>
                          </button>
                        ))}
                        <div className="border-t border-[hsl(var(--brand-sand))] mt-1 pt-1">
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              handleAddGroup();
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-[hsl(var(--brand-warm-gray))] hover:bg-[hsl(var(--brand-cream))] flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Create New Book
                          </button>
                        </div>
                      </div>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsDropdownOpen(false)}
                      />
                    </>
                  )}
                </div>

                {/* Members Dropdown */}
                {selectedGroup && (
                  <GroupMembersDropdown 
                    group={selectedGroup} 
                    onInviteFriend={handleInviteFriend} 
                  />
                )}

                {/* Group Actions Dropdown */}
                {selectedGroup && (
                  <GroupActionsDropdown
                    group={selectedGroup}
                    userRole={groupsSectionRef.current?.userRole || null}
                    onDeleteGroup={handleDeleteGroup}
                    onExitGroup={handleExitGroup}
                  />
                )}

                {/* Print Book Button */}
                <Button
                  onClick={handlePreviewBook}
                  variant="outline"
                  className="btn-secondary"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Preview Book
                </Button>
              </div>
            </div>
          </div>

          {/* Recipe Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h3">
                Recipes ({recipeCount})
              </h2>
              
              {/* Search will be handled by GroupsSection */}
            </div>

            {/* Groups Content */}
            <GroupsSection 
              ref={groupsSectionRef} 
              onGroupChange={handleGroupChange} 
              onLoadingChange={handleGroupsLoadingChange}
            />
          </div>
        </div>

        {/* Mobile Book Preview - show at top on mobile */}
        <div className="lg:hidden fixed top-16 left-0 right-0 z-30 bg-[hsl(var(--brand-cream))] border-b border-[hsl(var(--brand-sand))] p-4">
          <BookPreviewPanel 
            group={selectedGroup}
            recipeCount={recipeCount}
            onPreviewClick={handlePreviewBook}
          />
        </div>
      </div>
    </div>
  );
}