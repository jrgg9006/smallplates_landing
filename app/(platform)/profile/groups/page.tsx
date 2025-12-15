"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { RedesignedGroupsSection as GroupsSection, type GroupsSectionRef } from "@/components/profile/groups/RedesignedGroupsSection";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { CaptainsDropdown } from "@/components/profile/groups/CaptainsDropdown";
import { MoreMenuDropdown } from "@/components/profile/groups/MoreMenuDropdown";
import { AddFriendToGroupModal } from "@/components/profile/groups/AddFriendToGroupModal";
import { ChevronDown, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import type { GroupWithMembers } from "@/lib/types/database";
import { useProfileOnboarding, OnboardingSteps } from "@/lib/contexts/ProfileOnboardingContext";
import { WelcomeOverlay } from "@/components/onboarding/WelcomeOverlay";
import { FirstRecipeExperience } from "@/components/onboarding/FirstRecipeExperience";
import { FirstRecipeModal, RecipeData } from "@/components/profile/FirstRecipeModal";
import { addUserRecipe, UserRecipeData } from "@/lib/supabase/recipes";
import { getWeddingDisplayText, type WeddingTimeline } from "@/lib/utils/dateFormatting";
import { EmailVerificationBanner } from "@/components/profile/EmailVerificationBanner";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import { ShareCollectionModal } from "@/components/profile/guests/ShareCollectionModal";
import { getUserCollectionToken } from "@/lib/supabase/collection";
import { createShareURL } from "@/lib/utils/sharing";

export default function GroupsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const groupsSectionRef = useRef<GroupsSectionRef>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [recipeCount, setRecipeCount] = useState(0);
  const [showCaptains, setShowCaptains] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAddCaptainModal, setShowAddCaptainModal] = useState(false);
  const [invitationsRefreshTrigger, setInvitationsRefreshTrigger] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [collectionToken, setCollectionToken] = useState<string | null>(null);
  
  // Email verification state
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [showEmailBanner, setShowEmailBanner] = useState(false);
  
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

  const handleCollectRecipes = async () => {
    // Get the collection token first
    const { data: token, error } = await getUserCollectionToken();
    if (error || !token) {
      console.error('Error getting collection token:', error);
      return;
    }
    setCollectionToken(token);
    setShowShareModal(true);
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

  const handleEditProfile = () => {
    groupsSectionRef.current?.onEditGroup();
  };

  const handleInviteCaptain = () => {
    setShowAddCaptainModal(true);
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

  // Check email verification status and URL params
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!user?.id) return;

      try {
        const { data: profile } = await getCurrentProfile();
        if (profile) {
          setEmailVerified(profile.email_verified);
          setShowEmailBanner(!profile.email_verified);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    // Check URL params for verification messages
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    const error = params.get('error');

    if (message === 'email-verified') {
      setEmailVerified(true);
      setShowEmailBanner(false);
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      // Handle verification errors if needed
      console.error('Email verification error:', error);
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    }

    checkEmailVerification();
  }, [user]);

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

  // Handle recipe count changes
  const handleRecipeCountChange = useCallback((count: number) => {
    setRecipeCount(count);
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

  // Calculate unique contributors - simplified for now
  const uniqueContributors = recipeCount > 0 ? Math.min(recipeCount, 5) : 0;

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-background))]">
      {/* Loading overlay */}
      {(loading || groupsLoading) && (
        <div className="fixed inset-0 bg-[hsl(var(--brand-background))] z-50 flex items-center justify-center">
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

      {/* Main Content */}
      <main className="max-w-[1000px] mx-auto px-10">
        
        {/* Email Verification Banner */}
        {showEmailBanner && (
          <EmailVerificationBanner
            isVisible={showEmailBanner}
            onDismiss={() => setShowEmailBanner(false)}
            userEmail={user?.email}
          />
        )}
        {/* Hero Image */}
        <div className="relative w-full h-[200px] mt-6 rounded-2xl overflow-hidden">
          <Image
            src="/images/profile/Hero_Profile_2400.jpg"
            alt="Couple cooking together"
            fill
            className="object-cover"
            sizes="1000px"
          />
          {/* Overlay with text - sutil para no competir con la imagen */}
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="flex flex-col items-center text-white/70">
              <ImageIcon size={40} strokeWidth={1} className="opacity-60" />
              <span className="text-[12px] mt-1.5 font-normal opacity-80">Click to add your photo</span>
            </div>
          </div>
        </div>
        
        {/* Title Section */}
        <div className="mt-6">
          <h1 className="cookbook-title mb-1.5">
            {selectedGroup?.name || 'My Cookbook'}
          </h1>
          <p className="cookbook-metadata">
            {getWeddingDisplayText(
              selectedGroup?.wedding_date || null,
              selectedGroup?.wedding_date_undecided || false,
              selectedGroup?.timeline as WeddingTimeline
            )} · {recipeCount} recipes{uniqueContributors > 0 ? ` from ${uniqueContributors} people` : ''}
          </p>
        </div>
        
        {/* Action Bar */}
        <div className="flex items-center gap-3 mt-5 pb-6 border-b border-[hsl(var(--brand-border))]">
          {/* PRIMARY - Collect Recipes (HONEY, ROUNDED) */}
          <button 
            className="btn-primary"
            onClick={handleCollectRecipes}
            disabled={!selectedGroup}
          >
            Collect Recipes
          </button>
          
          {/* SECONDARY - Add Your Own (OUTLINE, ROUNDED) */}
          <button 
            className="btn-secondary"
            onClick={() => groupsSectionRef.current?.openAddNewRecipeModal()}
            disabled={!selectedGroup}
          >
            Add Your Own
          </button>
          
          {/* Captains Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowCaptains(!showCaptains)}
              className="btn-tertiary flex items-center gap-1.5"
            >
              Captains 
              <ChevronDown size={10} />
            </button>
            {showCaptains && <CaptainsDropdown isOpen={showCaptains} selectedGroup={selectedGroup} onClose={() => setShowCaptains(false)} onInviteCaptain={handleInviteCaptain} refreshTrigger={invitationsRefreshTrigger} />}
          </div>
          
          {/* More Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="btn-tertiary px-3.5"
            >
              ⋯
            </button>
            <MoreMenuDropdown 
              isOpen={showMoreMenu} 
              onClose={() => setShowMoreMenu(false)}
              onEditProfile={handleEditProfile}
            />
          </div>
        </div>
        
        {/* Recipe Grid */}
        <div className="mt-8 pb-16">
          <GroupsSection 
            ref={groupsSectionRef} 
            onGroupChange={handleGroupChange} 
            onLoadingChange={handleGroupsLoadingChange}
            onRecipeCountChange={handleRecipeCountChange}
          />
        </div>
      </main>

      {/* Add Captain Modal */}
      <AddFriendToGroupModal
        isOpen={showAddCaptainModal}
        onClose={() => setShowAddCaptainModal(false)}
        group={selectedGroup}
        onInviteSent={() => {
          // Refresh pending invitations when a new invitation is sent
          setInvitationsRefreshTrigger(prev => prev + 1);
        }}
      />

      {/* Share Collection Modal */}
      {selectedGroup && collectionToken && (
        <ShareCollectionModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          collectionUrl={createShareURL(window.location.origin, collectionToken, { groupId: selectedGroup.id })}
          userName={user?.email?.split('@')[0] || null}
        />
      )}
    </div>
  );
}