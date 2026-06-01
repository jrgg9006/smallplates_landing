"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { RedesignedGroupsSection as GroupsSection, type GroupsSectionRef } from "@/components/profile/groups/RedesignedGroupsSection";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { CaptainsDropdown } from "@/components/profile/groups/CaptainsDropdown";
import { MoreMenuDropdown } from "@/components/profile/groups/MoreMenuDropdown";
import { AddFriendToGroupModal } from "@/components/profile/groups/AddFriendToGroupModal";
import { CoupleNamesModal } from "@/components/profile/groups/CoupleNamesModal";
import { ChevronDown, Image as ImageIcon, Upload, X, Move } from "lucide-react";
import Image from "next/image";
import type { GroupWithMembers } from "@/lib/types/database";
import { useProfileOnboarding, OnboardingSteps } from "@/lib/contexts/ProfileOnboardingContext";
import { WelcomeOverlay } from "@/components/onboarding/WelcomeOverlay";
import { FirstRecipeExperience } from "@/components/onboarding/FirstRecipeExperience";
import { SetupChecklist } from "@/components/onboarding/SetupChecklist";
import { FirstRecipeModal, RecipeData } from "@/components/profile/FirstRecipeModal";
import { addUserRecipe, UserRecipeData } from "@/lib/supabase/recipes";
import { getWeddingDisplayText, type WeddingTimeline } from "@/lib/utils/dateFormatting";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import { ShareCollectionModal } from "@/components/profile/guests/ShareCollectionModal";
import { GuestNavigationSheet } from "@/components/profile/guests/GuestNavigationSheet";
import { SendRemindersModal } from "@/components/profile/guests/SendRemindersModal";
import { GuestDetailsModal } from "@/components/profile/guests/GuestDetailsModal";
import { getUserCollectionToken } from "@/lib/supabase/collection";
import { createShareURL, extractOgVersion } from "@/lib/utils/sharing";
import type { Guest } from "@/lib/types/database";
import { ImportGuestsModal } from "@/components/profile/guests/ImportGuestsModal";
import { SendInvitationsPage } from "@/components/profile/guests/SendInvitationsPage";
import { BookReviewFlow } from "@/components/profile/groups/review/BookReviewFlow";
import BrandLoader from "@/components/ui/BrandLoader";
import { InviteDropdown } from "@/components/dashboard/InviteDropdown";
import { DashboardChecklist } from "@/components/dashboard/DashboardChecklist";
import { BookPreviewPanel } from "@/components/profile/groups/BookPreviewPanel";

// Reason: Format book_close_date as "Month Dth" with ordinal suffix (no year)
function getDeadlineText(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    const d = date.getDate();
    const suffix = (d >= 11 && d <= 13) ? 'th' : ['th','st','nd','rd','th','th','th','th','th','th'][d % 10];
    return `${monthName} ${d}${suffix}`;
  } catch {
    return 'soon';
  }
}

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
  const [showInviteDropdown, setShowInviteDropdown] = useState(false);
  const [showAddCaptainModal, setShowAddCaptainModal] = useState(false);
  const [invitationsRefreshTrigger, setInvitationsRefreshTrigger] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showGuestSheet, setShowGuestSheet] = useState(false);
  const [showGuestDetailsModal, setShowGuestDetailsModal] = useState(false);
  const [importSource, setImportSource] = useState<"zola" | "the_knot" | null>(null);
  const [activeView, setActiveView] = useState<'book' | 'send-invitations' | 'book-review'>('book');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [collectionToken, setCollectionToken] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  
  // Profile state
  const [senderName, setSenderName] = useState<string | null>(null);
  
  // Dashboard image state
  const [selectedDashboardFile, setSelectedDashboardFile] = useState<File | null>(null);
  const [isUploadingDashboardImage, setIsUploadingDashboardImage] = useState(false);
  const [dashboardImageError, setDashboardImageError] = useState<string | null>(null);

  // Dashboard image controls + reposition state
  const [showImageControls, setShowImageControls] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [tempPositionY, setTempPositionY] = useState(50);
  const [isSavingPosition, setIsSavingPosition] = useState(false);
  const repositionContainerRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragStartPositionRef = useRef(50);
  
  // Onboarding context
  const {
    showWelcomeOverlay,
    showFirstRecipeExperience,
    dismissWelcome,
    skipAllOnboarding,
    startFirstRecipeExperience,
    skipFirstRecipeExperience,
    completeStep,
    markSharedToWhatsapp,
  } = useProfileOnboarding();

  // Reason: after dismissing the WelcomeOverlay, trigger SetupChecklist to auto-open
  // the wizard at step 1 — the welcome is the entry, the wizard is the guided path.
  const [shouldAutoOpenSetup, setShouldAutoOpenSetup] = useState(false);

  // Reason: when the Setup wizard opens the share modal, we want the modal to land
  // directly on the expanded customization view (photo + message editor). A normal
  // click on "Collect Recipes" still opens it in the default collapsed view.
  const [shareOpenExpanded, setShareOpenExpanded] = useState(false);

  // Handler functions
  const handleWelcomeStart = () => {
    skipAllOnboarding();
    setShouldAutoOpenSetup(true);
  };

  const handleAddGroup = () => {
    groupsSectionRef.current?.openCreateModal();
  };

  const handleSendInvitations = async () => {
    if (!collectionToken) {
      const { data: token } = await getUserCollectionToken();
      if (token) setCollectionToken(token);
    }
    setActiveView('send-invitations');
  };

  const handleCollectRecipes = async () => {
    // Get the collection token first
    const { data: token, error } = await getUserCollectionToken();
    if (error || !token) {
      console.error('Error getting collection token:', error);
      return;
    }
    setCollectionToken(token);
    setShareOpenExpanded(false);
    setShowShareModal(true);
  };

  // Reason: variant used by the Setup wizard — opens the share modal directly in the
  // expanded customization view (photo + message editor visible from the start).
  const handleCollectRecipesExpanded = async () => {
    const { data: token, error } = await getUserCollectionToken();
    if (error || !token) {
      console.error('Error getting collection token:', error);
      return;
    }
    setCollectionToken(token);
    setShareOpenExpanded(true);
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

  // Reason: All three close-book CTAs now open the unified book-review stepper
  // directly (no intermediate modal). The book only closes on confirmed Stripe
  // payment, handled by the ?from=book-close-purchase effect on return.
  const handleOpenBookReview = () => {
    setActiveView('book-review');
  };

  const handleGroupChange = (group: GroupWithMembers | null) => {
    setSelectedGroup(group);
  };

  const handleGroupSelectFromNav = (group: GroupWithMembers) => {
    setSelectedGroup(group);
    // Also update via ref to sync RedesignedGroupsSection
    groupsSectionRef.current?.handleGroupChange(group);
  };

  // Reason: deep-link via ?group=ID — used by GroupJoinForm after a successful
  // join to pre-select the just-joined group. Polls until the section ref's
  // groups list populates, selects the match, then cleans the URL so refreshes
  // don't re-fire.
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('group');
    if (!groupId) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      const groups = groupsSectionRef.current?.groups;
      if (groups && groups.length > 0) {
        const found = groups.find(g => g.id === groupId);
        if (found) {
          setSelectedGroup(found);
          groupsSectionRef.current?.handleGroupChange(found);
          window.history.replaceState({}, '', window.location.pathname);
        }
        clearInterval(interval);
      } else if (attempts > 30) {
        // 3s timeout — give up if groups never load.
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [user]);

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

  // Dashboard image reposition handlers
  const handleStartReposition = () => {
    const savedY = selectedGroup?.dashboard_image_position_y ?? 50;
    setTempPositionY(savedY);
    dragStartPositionRef.current = savedY;
    setIsRepositioning(true);
  };

  const handleRepositionMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartYRef.current = clientY;
    dragStartPositionRef.current = tempPositionY;
  };

  const handleRepositionMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragStartYRef.current === null) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const containerHeight = repositionContainerRef.current?.clientHeight || 200;
    const deltaPercent = ((clientY - dragStartYRef.current) / containerHeight) * 70;
    const newPosition = Math.max(0, Math.min(100, dragStartPositionRef.current - deltaPercent));
    setTempPositionY(newPosition);
  };

  const handleRepositionMouseUp = () => {
    dragStartYRef.current = null;
  };

  const handleSaveReposition = async () => {
    if (!selectedGroup) return;
    setIsSavingPosition(true);
    try {
      const response = await fetch(`/api/v1/groups/${selectedGroup.id}/dashboard-image`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position_y: Math.round(tempPositionY) }),
      });
      if (response.ok) {
        setIsRepositioning(false);
        if (groupsSectionRef.current) {
          await groupsSectionRef.current.loadGroups(true);
          setTimeout(() => {
            const updatedGroup = groupsSectionRef.current?.selectedGroup;
            if (updatedGroup && updatedGroup.id === selectedGroup.id) {
              setSelectedGroup(updatedGroup);
            }
          }, 100);
        }
      } else {
        const result = await response.json();
        setDashboardImageError(result.error || 'Failed to save position');
      }
    } catch {
      setDashboardImageError('Failed to save position');
    } finally {
      setIsSavingPosition(false);
    }
  };

  const handleCancelReposition = () => {
    setIsRepositioning(false);
    dragStartYRef.current = null;
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

  // Fetch senderName (full_name) for invitation signatures.
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        const { data: profile } = await getCurrentProfile();
        if (profile) {
          setSenderName(profile.full_name || null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    loadProfile();
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Reason: After returning from Stripe Checkout (extras upsell during close in
  // Phase 7A, or dashboard "Get more copies" in Phase 7B), refresh group data so
  // BookClosedStatus reflects the new extra_copy order, then strip the query
  // param so a browser refresh doesn't re-trigger this.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    const closedGroupId = params.get("group");
    if (
      from === "extras-purchase" ||
      from === "dashboard-extras-purchase" ||
      from === "book-close-purchase"
    ) {
      (async () => {
        await groupsSectionRef.current?.loadGroups(true);
        // Reason: after the reload, GroupsSection auto-selects the first NON-closed
        // book. For a just-closed purchase that lands the owner on the wrong book
        // (e.g. another open book). Re-select the book we just paid for so they see
        // its BookClosedStatus. Poll briefly since loadGroups populates async.
        if (closedGroupId) {
          let attempts = 0;
          const interval = setInterval(() => {
            attempts += 1;
            const groups = groupsSectionRef.current?.groups;
            const found = groups?.find((g) => g.id === closedGroupId);
            if (found) {
              setSelectedGroup(found);
              groupsSectionRef.current?.handleGroupChange(found);
              clearInterval(interval);
            } else if (attempts > 30) {
              clearInterval(interval);
            }
          }, 100);
        }
        router.replace("/profile/groups");
      })();
    }
  }, [router]);

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
      return <BrandLoader />;
    }
    return null;
  }

  // uniqueContributors now comes from the RedesignedGroupsSection component

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-background))]">
      {/* Loading overlay */}
      {(loading || groupsLoading) && <BrandLoader fixed />}

      {/* Post-payment setup modal — blocks the dashboard until the owner fills in couple details. */}
      {selectedGroup?.status === "pending_setup" &&
        selectedGroup.created_by === user.id && (
          <CoupleNamesModal
            open={true}
            groupId={selectedGroup.id}
            userEmail={user.email || ""}
            // Reason: If the user already owns at least one active (non-pending) group they created,
            // this new setup is for a second/third/Nth book — swap the headline copy accordingly.
            isFirstBook={
              (groupsSectionRef.current?.groups || []).filter(
                (g) => g.created_by === user.id && g.status === "active"
              ).length === 0
            }
            onComplete={async () => {
              await groupsSectionRef.current?.loadGroups(true);
              setTimeout(() => {
                const refreshed = groupsSectionRef.current?.selectedGroup;
                if (refreshed) setSelectedGroup(refreshed);
              }, 100);
            }}
          />
        )}

      {/* Onboarding overlays — gated on group being fully set up (status='active').
          While the group is `pending_setup`, only the CoupleNamesModal should be visible. */}
      {selectedGroup?.status === "active" && !selectedGroup?.book_closed_by_user && showWelcomeOverlay && (
        <WelcomeOverlay
          userName={user.email?.split('@')[0] || 'there'}
          onStart={handleWelcomeStart}
          onDismiss={skipAllOnboarding}
          isVisible={showWelcomeOverlay}
        />
      )}

      {selectedGroup?.status === "active" && !selectedGroup?.book_closed_by_user && showFirstRecipeExperience && (
        <FirstRecipeExperience
          onSubmit={handleFirstRecipeSubmit}
          onSkip={skipFirstRecipeExperience}
        />
      )}

      {/* Header — stays visible during the book-review stepper (Storyworth-style);
          only the full-screen send-invitations view hides it. */}
      {activeView !== 'send-invitations' && (
        <ProfileHeader
          onGroupSelect={handleGroupSelectFromNav}
          currentGroupId={selectedGroup?.id}
        />
      )}

      {/* Send Invitations — full-screen, outside max-w container */}
      {activeView === 'send-invitations' && selectedGroup && (
        <SendInvitationsPage
          groupId={selectedGroup.id}
          coupleNames={selectedGroup.name}
          coupleImageUrl={selectedGroup.couple_image_url}
          onBack={() => setActiveView('book')}
          onOpenGuestSheet={() => setShowGuestSheet(true)}
        />
      )}

      {/* Book Review — unified 4-step stepper (names/photo → recipes → quantity →
          checkout). Renders under the persistent ProfileHeader, outside max-w main. */}
      {activeView === 'book-review' && selectedGroup && (
        <BookReviewFlow
          group={selectedGroup}
          isOwner={selectedGroup.created_by === user.id}
          recipeCount={recipeCount}
          onExit={() => setActiveView('book')}
        />
      )}

      {/* Main Content — book view (hidden but not unmounted during send-invitations) */}
      <main className={`max-w-[1240px] mx-auto px-4 sm:px-8 ${activeView !== 'book' ? 'hidden' : ''}`}>
            {/* Reason: Hide dashboard/buttons when book is closed — BookClosedStatus in GroupsSection handles the view */}
            {selectedGroup?.book_closed_by_user ? null : (<>
            {/* Two-column layout: Title + Book Cover */}
            <div className="mt-8 flex flex-col md:flex-row gap-8 items-start">

            {/* Left column — Title, stats, action bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-5">
                {selectedGroup?.couple_image_url && (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-[hsl(var(--brand-border))]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedGroup.couple_image_url}
                      alt="Couple"
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${selectedGroup.couple_image_position_x ?? 50}% ${selectedGroup.couple_image_position_y ?? 50}%`,
                      }}
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="cookbook-title">
                    {selectedGroup?.name || 'My Cookbook'}
                  </h1>
              {/* Reason: plain flowing text (not flex) so the meta wraps naturally
                  on mobile instead of each fragment becoming a squeezed flex item. */}
              <div className="cookbook-metadata mt-1">
                <button
                  onClick={handleEditProfile}
                  className="text-[hsl(var(--brand-honey))] hover:text-[hsl(var(--brand-honey-dark))] transition-colors"
                >
                  Edit Profile
                </button>
                <span className="mx-1.5 text-[hsl(var(--brand-border-button))]">·</span>
                {selectedGroup?.book_close_date ? (
                  <>Recipes due {getDeadlineText(selectedGroup.book_close_date)}</>
                ) : selectedGroup?.gift_date_undecided ? (
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); /* TODO: open date edit flow */ }}
                    className="hover:underline"
                  >
                    No deadline set
                  </a>
                ) : (
                  getWeddingDisplayText(
                    selectedGroup?.wedding_date || null,
                    selectedGroup?.wedding_date_undecided || false,
                    null
                  )
                )} · {recipeCount} recipes{uniqueContributors > 0 && (<>{` from ${uniqueContributors} people `}<button
                      onClick={() => setShowGuestSheet(true)}
                      className="text-[hsl(var(--brand-honey))] hover:text-[hsl(var(--brand-honey-dark))] hover:underline transition-colors"
                    >(view)</button></>)}
              </div>
                </div>{/* end title+stats wrapper */}
              </div>{/* end avatar+content flex */}

              {/* Gamified checklist */}
              <DashboardChecklist
                group={selectedGroup}
                recipeCount={recipeCount}
                hasCaptains={(selectedGroup?.group_members || []).some(m => m.role !== 'owner')}
                hasEventInvite={!!(selectedGroup?.event_date && selectedGroup?.event_location)}
                onCreateEventInvite={() => router.push(`/event-invite?groupId=${selectedGroup?.id}`)}
                onInviteCaptain={() => setShowAddCaptainModal(true)}
                onAddRecipe={() => groupsSectionRef.current?.openAddNewRecipeModal()}
                onPrintBook={handleOpenBookReview}
              />

            </div>{/* end left column */}

            {/* Right column — Book cover mockup */}
            <div className="w-full md:w-[340px] flex-shrink-0 self-stretch">
              <BookPreviewPanel
                group={selectedGroup}
                recipeCount={recipeCount}
                onPreviewClick={() => groupsSectionRef.current?.onEditGroup()}
              />
            </div>

            </div>{/* end two-column layout */}

            {/* Action Bar — separate section below */}
            <div className="mt-10 pt-6 border-t border-[hsl(var(--brand-border))]">
              <div className="flex flex-wrap items-center gap-3">
                {/* PRIMARY - Invite dropdown (HONEY, ROUNDED) */}
                <div className="relative">
                  <button
                    className="btn btn-sm btn-honey gap-2 px-6 sm:px-14"
                    onClick={() => setShowInviteDropdown(!showInviteDropdown)}
                    disabled={!selectedGroup}
                  >
                    Invite
                    <ChevronDown size={12} />
                  </button>
                  <InviteDropdown
                    isOpen={showInviteDropdown}
                    onClose={() => setShowInviteDropdown(false)}
                    onInviteToEvent={() => router.push(`/event-invite?groupId=${selectedGroup?.id}`)}
                    onSendCollectionLink={handleCollectRecipes}
                    onInviteCaptain={() => setShowAddCaptainModal(true)}
                  />
                </div>

                {/* SECONDARY - Add Your Own (OUTLINE, ROUNDED) */}
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => groupsSectionRef.current?.openAddNewRecipeModal()}
                  disabled={!selectedGroup}
                >
                  Add a Recipe
                </button>

                {/* Send Reminders */}
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setShowRemindersModal(true)}
                  disabled={!selectedGroup}
                >
                  Send Reminders
                </button>

                {/* More Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="btn btn-subtle px-3.5"
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
                    showSendInvitationsOption={true}
                    onSendInvitationsClick={handleSendInvitations}
                    onCloseBookClick={!selectedGroup?.book_closed_by_user ? handleOpenBookReview : undefined}
                  />
                  {/* Captains dropdown for mobile */}
                  <div className="sm:hidden">
                    {showCaptains && <CaptainsDropdown isOpen={showCaptains} selectedGroup={selectedGroup} onClose={() => setShowCaptains(false)} onInviteCaptain={handleInviteCaptain} refreshTrigger={invitationsRefreshTrigger} />}
                  </div>
                </div>
              </div>
            </div>
            </>)}

            {/* Recipe Grid */}
            <div className="mt-8 pb-16">
              <GroupsSection
                ref={groupsSectionRef}
                onGroupChange={handleGroupChange}
                onLoadingChange={handleGroupsLoadingChange}
                onRecipeCountChange={handleRecipeCountChange}
                onImportGuests={(source) => setImportSource(source)}
                onCloseBookClick={!selectedGroup?.book_closed_by_user ? handleOpenBookReview : undefined}
                bookClosed={!!selectedGroup?.book_closed_by_user}
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
          collectionUrl={createShareURL(window.location.origin, collectionToken, {
            groupId: selectedGroup.id,
            imgVersion: extractOgVersion(selectedGroup.couple_image_og_url),
          })}
          userName={user?.email?.split('@')[0] || null}
          groupId={selectedGroup.id}
          coupleNames={selectedGroup.name || null}
          currentCoupleImage={selectedGroup.couple_image_url}
          currentCoupleImagePositionY={selectedGroup.couple_image_position_y ?? 50}
          currentCoupleImagePositionX={selectedGroup.couple_image_position_x ?? 50}
          onLinkCopied={() => markSharedToWhatsapp(selectedGroup.id)}
          onImageChange={async () => {
            // Reason: refresh selectedGroup so collectionUrl picks up the new
            // couple_image_og_url and rebuilds with a fresh &v=<og_ts>. Without
            // this the modal copies a URL WhatsApp considers identical to the
            // pre-upload one and serves a stale (or missing) preview from cache.
            if (groupsSectionRef.current) {
              await groupsSectionRef.current.loadGroups(true);
              setTimeout(() => {
                const updatedGroup = groupsSectionRef.current?.selectedGroup;
                if (updatedGroup && updatedGroup.id === selectedGroup.id) {
                  setSelectedGroup(updatedGroup);
                }
              }, 100);
            }
          }}
          openExpanded={shareOpenExpanded}
        />
      )}

      {/* Send Reminders modal */}
      {selectedGroup && (
        <SendRemindersModal
          isOpen={showRemindersModal}
          onClose={() => setShowRemindersModal(false)}
          groupId={selectedGroup.id}
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

      {/* Import Guests Modal (from empty state) */}
      {importSource && selectedGroup && (
        <ImportGuestsModal
          groupId={selectedGroup.id}
          initialSource={importSource}
          onClose={() => setImportSource(null)}
          onImportComplete={() => {
            setImportSource(null);
            // Reason: Refresh group data to reflect new guests
            groupsSectionRef.current?.loadGroups(true);
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
          setShowGuestSheet(true);
        }}
        onGuestUpdated={() => {
          // Refresh guests in the navigation sheet by reloading
          setInvitationsRefreshTrigger(prev => prev + 1);
        }}
      />
    </div>
  );
}