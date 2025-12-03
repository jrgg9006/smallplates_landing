"use client";

import React from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GuestTable } from "@/components/profile/guests/GuestTable";
import { GuestTableControls } from "@/components/profile/guests/GuestTableControls";
import { GuestStatisticsComponent } from "@/components/profile/guests/GuestStatistics";
import { RecipeCollectorLink } from "@/components/profile/guests/RecipeCollectorLink";
import { AddGuestModal } from "@/components/profile/guests/AddGuestModal";
import { ProgressBar } from "@/components/profile/ProgressBar";
import { getUserProgress, UserProgress } from "@/lib/supabase/progress";
import { getGuests } from "@/lib/supabase/guests";
import { useProfileOnboarding, OnboardingSteps } from "@/lib/contexts/ProfileOnboardingContext";
import { WelcomeOverlay } from "@/components/onboarding/WelcomeOverlay";
import { OnboardingCards } from "@/components/onboarding/OnboardingCards";
import { FirstRecipeExperience } from "@/components/onboarding/FirstRecipeExperience";
import { FirstRecipeModal, RecipeData } from "@/components/profile/FirstRecipeModal";
import { ShareCollectionModal } from "@/components/profile/guests/ShareCollectionModal";
import { addUserRecipe, UserRecipeData } from "@/lib/supabase/recipes";
import { getUserCollectionToken } from "@/lib/supabase/collection";
import { createShareURL } from "@/lib/utils/sharing";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import { RecipeCollectorButton } from "@/components/profile/guests/RecipeCollectorButton";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { AddGuestDropdown } from "@/components/ui/AddGuestDropdown";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { 
    shouldShowOnboarding, 
    completedSteps,
    showWelcomeOverlay,
    showFirstRecipeExperience,
    dismissWelcome,
    skipAllOnboarding,
    startFirstRecipeExperience,
    skipFirstRecipeExperience,
    completeStep,
    skipOnboarding,
    resumeOnboarding
  } = useProfileOnboarding();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [progressData, setProgressData] = useState<UserProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [guestCounts, setGuestCounts] = useState<{all: number; pending: number; submitted: number}>({
    all: 0,
    pending: 0,
    submitted: 0
  });
  const [isFirstRecipeModalOpen, setIsFirstRecipeModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [collectionUrl, setCollectionUrl] = useState<string>('');
  const [userFullName, setUserFullName] = useState<string | null>(null);

  const handleAddGuest = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleGuestAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    loadProgressData(); // Reload progress when guest is added
    loadGuestCounts(); // Reload guest counts when guest is added
    
    // Auto-sync will detect the new guest and complete the step automatically
    // But we can also complete it directly for immediate UI feedback
    if (!completedSteps.includes(OnboardingSteps.FIRST_GUEST)) {
      completeStep(OnboardingSteps.FIRST_GUEST);
    }
  };

  // Handle onboarding actions
  const handleOnboardingAction = async (stepId: OnboardingSteps) => {
    switch (stepId) {
      case OnboardingSteps.FIRST_RECIPE:
        // Show first recipe experience (this also hides onboarding cards)
        startFirstRecipeExperience();
        break;
      case OnboardingSteps.FIRST_GUEST:
        setIsAddModalOpen(true);
        break;
      case OnboardingSteps.CUSTOMIZE_COLLECTOR:
        // Load collection token and user profile, then open share modal
        try {
          const { data: tokenData } = await getUserCollectionToken();
          const { data: profile } = await getCurrentProfile();
          
          if (tokenData && typeof window !== 'undefined') {
            const url = createShareURL(window.location.origin, tokenData);
            setCollectionUrl(url);
            setUserFullName(profile?.full_name || null);
            setIsShareModalOpen(true);
          }
        } catch (err) {
          console.error('Error loading collection data:', err);
        }
        break;
    }
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
      setRefreshTrigger(prev => prev + 1);
      loadProgressData();
      
      // The FirstRecipeExperience component will handle showing the confirmation message
    } catch (err) {
      console.error('Error saving recipe:', err);
      throw err; // Let the component handle the error display
    }
  };


  // Load user progress data
  const loadProgressData = async () => {
    if (!user?.id) return;

    try {
      setProgressLoading(true);
      const { data, error } = await getUserProgress(user.id);
      
      if (error) {
        console.error('Error loading progress data:', error);
        setProgressData(null);
      } else {
        setProgressData(data);
      }
    } catch (err) {
      console.error('Error in loadProgressData:', err);
      setProgressData(null);
    } finally {
      setProgressLoading(false);
    }
  };

  // Load guest counts for tab badges
  const loadGuestCounts = async () => {
    if (!user?.id) return;

    try {
      const { data: guests, error } = await getGuests(false);
      
      if (error) {
        console.error('Error loading guest counts:', error);
        return;
      }

      if (guests) {
        const counts = {
          all: guests.length,
          pending: guests.filter(guest => guest.status === 'pending').length,
          submitted: guests.filter(guest => guest.status === 'submitted').length,
        };
        console.log('Guest counts loaded:', counts); // Debug log
        setGuestCounts(counts);
      }
    } catch (err) {
      console.error('Error in loadGuestCounts:', err);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Load progress data when user is available
  useEffect(() => {
    if (user?.id) {
      loadProgressData();
      loadGuestCounts();
      
      // Check if user needs waitlist conversion (backup safety net)
      fetch('/api/v1/auth/check-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(error => {
        console.log('Conversion check failed (non-critical):', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Reload guest counts when refreshTrigger changes
  useEffect(() => {
    if (user?.id) {
      loadGuestCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isEmptyState = guestCounts.all === 0;
  const hasFirstRecipe = (progressData?.current_recipes || 0) > 0;

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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            {/* Title section with editorial text - centered on mobile */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8 mb-4 lg:mb-0 justify-center lg:justify-start">
              {/* Editorial Text Version */}
              <motion.div 
                className="text-center lg:text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h1 className="font-serif text-6xl md:text-6xl font-medium tracking-tight text-gray-900 mb-1">
                  Guest List
                </h1>
                <h3 className="text-lg font-light text-gray-600">
                  The people behind every recipe
                </h3>
              </motion.div>
              
              {/* HIDDEN: Original Images - Easy to revert */}
              {/* Mobile: Original pan image */}
              {/* <Image
                src="/images/profile/guest_list_image_pan.svg"
                alt="Guest List - Your Cookbook is Cooking"
                width={600}
                height={80}
                className="lg:hidden w-full max-w-2xl h-auto"
                priority
              /> */}
              
              {/* Desktop: New horizontal image */}
              {/* <Image
                src="/images/profile/Guest_list_horizontal.svg"
                alt="Guest List - Your Cookbook is Cooking"
                width={800}
                height={120}
                className="hidden lg:block w-full max-w-2xl h-auto"
                priority
              /> */}
            </div>
            
            {/* Right side - Action buttons + Complete Onboarding button - centered on mobile */}
            <div className="flex-shrink-0 flex items-center gap-4 justify-center lg:justify-end">
              {/* Complete Onboarding Button - Only show if onboarding is not complete */}
              {completedSteps.length < 3 && (
                <Button
                  onClick={resumeOnboarding}
                  className="bg-[#464665] text-white hover:bg-[#3a3a52] rounded-lg px-8 py-3 text-base font-medium flex items-center gap-2"
                >
                  Finish Onboarding
                </Button>
              )}
              
              {/* Add Guests Button - Teal Circle with Dropdown */}
              <AddGuestDropdown
                onAddGuest={handleAddGuest}
                title="Guest actions"
              />
              
              {/* Progress Bar - HIDDEN FOR NOW */}
              {/* <ProgressBar 
                current={progressData?.current_recipes || 0}
                goal={progressData?.goal_recipes || 40}
                loading={progressLoading}
              /> */}
            </div>
          </div>
        </div>

        {/* Main Content - Conditional rendering based on onboarding state */}
        {shouldShowOnboarding ? (
          <div className="fixed inset-0 z-40 bg-white/90 backdrop-blur-sm">
            <div className="flex h-full items-center justify-center p-8">
              <div className="max-w-6xl w-full">
                <OnboardingCards
                  completedSteps={completedSteps}
                  onAction={handleOnboardingAction}
                  onExit={skipOnboarding}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Statistics and Recipe Collector Section - HIDDEN FOR NOW */}
            {/* <div className="mb-8 lg:mb-16 flex flex-col lg:flex-row gap-4 lg:gap-8 items-stretch">
              <div className="flex-1">
                <GuestStatisticsComponent />
              </div>
              <div className="flex-1">
                <RecipeCollectorLink />
              </div>
            </div> */}

            {/* Guest Table Controls */}
            <GuestTableControls
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              guestCounts={guestCounts}
            />

            {/* Guest Table */}
            <div>
              <GuestTable 
                key={refreshTrigger} 
                searchValue={searchValue} 
                statusFilter={statusFilter}
                onDataLoaded={() => {
                  loadGuestCounts();
                  loadProgressData();
                }}
              />
            </div>
          </>
        )}


        {/* Add Guest Modal */}
        <AddGuestModal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          onGuestAdded={handleGuestAdded}
          isFirstGuest={guestCounts.all === 0}
        />

        {/* First Recipe Modal */}
        <FirstRecipeModal
          isOpen={isFirstRecipeModalOpen}
          onClose={() => setIsFirstRecipeModalOpen(false)}
          onSubmit={handleFirstRecipeSubmit}
          isFirstRecipe={true}
        />

        {/* Share Collection Modal */}
        {collectionUrl && (
          <ShareCollectionModal
            isOpen={isShareModalOpen}
            onClose={() => {
              setIsShareModalOpen(false);
            }}
            collectionUrl={collectionUrl}
            userName={userFullName}
            isOnboardingStep={shouldShowOnboarding && !completedSteps.includes(OnboardingSteps.CUSTOMIZE_COLLECTOR)}
            onStepComplete={() => {
              completeStep(OnboardingSteps.CUSTOMIZE_COLLECTOR);
            }}
          />
        )}
      </div>
    </div>
  );
}
