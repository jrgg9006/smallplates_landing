"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { RedesignedGroupsSection as GroupsSection, type GroupsSectionRef } from "@/components/profile/groups/RedesignedGroupsSection";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { CaptainsDropdown } from "@/components/profile/groups/CaptainsDropdown";
import { MoreMenuDropdown } from "@/components/profile/groups/MoreMenuDropdown";
import { AddFriendToGroupModal } from "@/components/profile/groups/AddFriendToGroupModal";
import { ChevronDown, Image as ImageIcon, Upload, X } from "lucide-react";
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
import { GuestNavigationSheet } from "@/components/profile/guests/GuestNavigationSheet";
import { GuestDetailsModal } from "@/components/profile/guests/GuestDetailsModal";
import { getUserCollectionToken } from "@/lib/supabase/collection";
import { createShareURL } from "@/lib/utils/sharing";
import type { Guest } from "@/lib/types/database";

export default function GroupsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const groupsSectionRef = useRef<GroupsSectionRef>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [recipeCount, setRecipeCount] = useState(0);
  const [uniqueContributors, setUniqueContributors] = useState(0);
  const [showCaptains, setShowCaptains] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAddCaptainModal, setShowAddCaptainModal] = useState(false);
  const [invitationsRefreshTrigger, setInvitationsRefreshTrigger] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showGuestSheet, setShowGuestSheet] = useState(false);
  const [showGuestDetailsModal, setShowGuestDetailsModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [collectionToken, setCollectionToken] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Email verification state
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [showEmailBanner, setShowEmailBanner] = useState(false);
  
  // Dashboard image state
  const [selectedDashboardFile, setSelectedDashboardFile] = useState<File | null>(null);
  const [isUploadingDashboardImage, setIsUploadingDashboardImage] = useState(false);
  const [dashboardImageError, setDashboardImageError] = useState<string | null>(null);
  
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

  const handleAddGuest = () => {
    groupsSectionRef.current?.openAddGuestModal();
  };

  const handleViewGuests = () => {
    setShowGuestSheet(true);
  };

  const handleGroupChange = (group: GroupWithMembers | null) => {
    setSelectedGroup(group);
  };

  const handleGroupSelectFromNav = (group: GroupWithMembers) => {
    setSelectedGroup(group);
    // Also update via ref to sync RedesignedGroupsSection
    groupsSectionRef.current?.handleGroupChange(group);
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
    // console.log removed for production
  };

  // Dashboard image functions
  const handleDashboardImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setDashboardImageError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      // Reset input on error
      event.target.value = '';
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setDashboardImageError('File too large. Maximum size is 5MB.');
      // Reset input on error
      event.target.value = '';
      return;
    }

    // Clear previous file and error
    setSelectedDashboardFile(file);
    setDashboardImageError(null);
    
    // Auto-upload the file
    handleUploadDashboardImage(file);
  };

  const handleUploadDashboardImage = async (file?: File) => {
    const fileToUpload = file || selectedDashboardFile;
    if (!fileToUpload || !selectedGroup) {
      setDashboardImageError('No file selected or group not found');
      return;
    }

    setIsUploadingDashboardImage(true);
    setDashboardImageError(null);

    try {
      const formData = new FormData();
      formData.append('image', fileToUpload);

      const response = await fetch(`/api/v1/groups/${selectedGroup.id}/dashboard-image`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setDashboardImageError(result.error || 'Failed to upload image');
        return;
      }

      setSelectedDashboardFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('dashboardImageInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // console.log removed for production
      // console.log removed for production

      // Refresh groups data to get the latest state
      if (groupsSectionRef.current) {
        // console.log removed for production
        await groupsSectionRef.current.loadGroups(true); // Force refresh selected group
        // console.log removed for production
        
        // Force a small delay to ensure state is updated, then update selectedGroup
        setTimeout(async () => {
          // Get the updated group from the ref
          const updatedGroup = groupsSectionRef.current?.selectedGroup;
          if (updatedGroup && updatedGroup.id === selectedGroup.id) {
            setSelectedGroup(updatedGroup);
          }
        }, 100);
      } else {
        console.error('🔍 groupsSectionRef.current is null!');
      }

    } catch (err) {
      setDashboardImageError('Failed to upload image');
    } finally {
      setIsUploadingDashboardImage(false);
    }
  };

  const handleDeleteDashboardImage = async () => {
    if (!selectedGroup) {
      setDashboardImageError('Group not found');
      return;
    }

    setIsUploadingDashboardImage(true);
    setDashboardImageError(null);

    try {
      const response = await fetch(`/api/v1/groups/${selectedGroup.id}/dashboard-image`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setDashboardImageError(result.error || 'Failed to delete image');
        return;
      }

      setSelectedDashboardFile(null);

      // Reset file input
      const fileInput = document.getElementById('dashboardImageInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh groups data to get the latest state
      if (groupsSectionRef.current) {
        // console.log removed for production
        await groupsSectionRef.current.loadGroups(true); // Force refresh selected group
      }

    } catch (err) {
      setDashboardImageError('Failed to delete image');
    } finally {
      setIsUploadingDashboardImage(false);
    }
  };

  const handleDashboardImageClick = () => {
    const input = document.getElementById('dashboardImageInput') as HTMLInputElement;
    if (input) {
      // Reset input value before clicking to ensure onChange always fires
      input.value = '';
      // Use click() method directly
      input.click();
    } else {
      console.error('dashboardImageInput not found');
    }
  };

  // Derive dashboard image directly from selectedGroup to avoid sync issues
  const currentDashboardImage = selectedGroup?.image_group_dashboard || null;

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint in Tailwind
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const handleRecipeCountChange = useCallback((count: number, contributors: number) => {
    setRecipeCount(count);
    setUniqueContributors(contributors);
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

  // uniqueContributors now comes from the RedesignedGroupsSection component

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
      <ProfileHeader 
        onGroupSelect={handleGroupSelectFromNav}
        currentGroupId={selectedGroup?.id}
      />

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
        <div className="relative w-full h-[200px] mt-6 rounded-2xl overflow-hidden group">
          {currentDashboardImage ? (
            /* Show uploaded dashboard image */
            <>
              <Image
                key={currentDashboardImage}
                src={currentDashboardImage}
                alt="Group dashboard image"
                fill
                className="object-cover"
                sizes="1000px"
              />
              {/* Hover overlay with edit buttons - only show on hover */}
              <div 
                className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                onMouseEnter={(e) => e.stopPropagation()}
                onMouseLeave={(e) => e.stopPropagation()}
              >
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDashboardImageClick();
                    }}
                    disabled={isUploadingDashboardImage}
                    className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--brand-warm-white))] text-[hsl(var(--brand-charcoal))] font-semibold text-sm rounded-lg hover:bg-[hsl(var(--brand-honey))] hover:text-black transition-all duration-200 shadow-sm z-10"
                  >
                    <Upload size={16} />
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteDashboardImage();
                    }}
                    disabled={isUploadingDashboardImage}
                    className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--brand-charcoal))] text-[hsl(var(--brand-warm-white))] font-semibold text-sm rounded-lg hover:bg-[hsl(var(--brand-warm-gray))] transition-all duration-200 shadow-sm z-10"
                  >
                    <X size={16} />
                    Remove
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Show placeholder with upload prompt */
            <>
              <Image
                src="/images/profile/Hero_Profile_2400.jpg"
                alt="Couple cooking together"
                fill
                className="object-cover"
                sizes="1000px"
              />
              {/* Clickable overlay */}
              <div 
                className="absolute inset-0 bg-black/10 flex items-center justify-center cursor-pointer hover:bg-black/15 transition-colors"
                onClick={handleDashboardImageClick}
              >
                <div className="flex flex-col items-center text-white/70">
                  {isUploadingDashboardImage ? (
                    <>
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/50 mb-2"></div>
                      <span className="text-[12px] mt-1.5 font-normal opacity-80">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={40} strokeWidth={1} className="opacity-60" />
                      <span className="text-[12px] mt-1.5 font-normal opacity-80">Click to add your photo</span>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Hidden file input */}
          <input
            id="dashboardImageInput"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleDashboardImageSelect}
            className="hidden"
          />
        </div>

        {/* Error Message */}
        {dashboardImageError && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{dashboardImageError}</p>
          </div>
        )}
        
        {/* Title Section */}
        <div className="mt-6">
          <h1 className="cookbook-title mb-1.5">
            {selectedGroup?.name || 'My Cookbook'}
          </h1>
          <p className="cookbook-metadata">
            {getWeddingDisplayText(
              selectedGroup?.wedding_date || null,
              selectedGroup?.wedding_date_undecided || false,
              selectedGroup?.wedding_timeline as WeddingTimeline
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
            Add Recipes
          </button>

          {/* Guests Button - Hidden on mobile */}
          <button 
            className="btn-secondary hidden sm:block"
            onClick={handleViewGuests}
            disabled={!selectedGroup}
          >
            Guests
          </button>
          
          {/* Captains Dropdown - Hidden on mobile */}
          <div className="relative hidden sm:block">
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
              showCaptainsOption={isMobile}
              onCaptainsClick={() => setShowCaptains(true)}
              onViewGuestsClick={handleViewGuests}
              showAddGuestOption={isMobile}
            />
            {/* Captains dropdown for mobile */}
            <div className="sm:hidden">
              {showCaptains && <CaptainsDropdown isOpen={showCaptains} selectedGroup={selectedGroup} onClose={() => setShowCaptains(false)} onInviteCaptain={handleInviteCaptain} refreshTrigger={invitationsRefreshTrigger} />}
            </div>
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
          groupId={selectedGroup.id}
          coupleNames={
            selectedGroup.couple_first_name && selectedGroup.partner_first_name
              ? `${selectedGroup.couple_first_name} & ${selectedGroup.partner_first_name}`
              : selectedGroup.couple_first_name || selectedGroup.partner_first_name || null
          }
          currentCoupleImage={selectedGroup.couple_image_url}
        />
      )}

      {/* Guest Navigation Sheet */}
      {selectedGroup && (
        <GuestNavigationSheet
          isOpen={showGuestSheet}
          onClose={() => setShowGuestSheet(false)}
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          onGuestSelect={(guest) => {
            setSelectedGuest(guest);
            setShowGuestDetailsModal(true);
            setShowGuestSheet(false);
          }}
          onAddGuest={() => {
            setShowGuestSheet(false);
            handleAddGuest();
          }}
        />
      )}

      {/* Guest Details Modal */}
      <GuestDetailsModal
        guest={selectedGuest}
        isOpen={showGuestDetailsModal}
        onClose={() => {
          setShowGuestDetailsModal(false);
          setSelectedGuest(null);
        }}
        onGuestUpdated={() => {
          // Refresh guests in the navigation sheet by reloading
          setInvitationsRefreshTrigger(prev => prev + 1);
        }}
      />
    </div>
  );
}