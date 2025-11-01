"use client";

import React from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GuestTable } from "@/components/profile/guests/GuestTable";
import { GuestTableControls } from "@/components/profile/guests/GuestTableControls";
import { GuestStatisticsComponent } from "@/components/profile/guests/GuestStatistics";
import { RecipeCollectorLink } from "@/components/profile/guests/RecipeCollectorLink";
import { AddGuestModal } from "@/components/profile/guests/AddGuestModal";
import { ProgressBar } from "@/components/profile/ProgressBar";
import { getUserProgress, UserProgress } from "@/lib/supabase/progress";
import ProfileDropdown from "@/components/profile/ProfileDropdown";
import { getGuests } from "@/lib/supabase/guests";

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await signOut();
  };

  const handleAccount = () => {
    setIsMobileMenuOpen(false);
    router.push('/profile/account');
  };

  const handleOrders = () => {
    setIsMobileMenuOpen(false);
    router.push('/profile/orders');
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

  return (
    <div className="min-h-screen bg-white text-gray-700">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo - Aligned with content */}
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Co."
              width={200}
              height={40}
              className="cursor-pointer"
              priority
            />
          </Link>
          
          {/* Desktop: Notification Bell + Profile */}
          <div className="hidden lg:flex items-center gap-3">
            
            <ProfileDropdown />
          </div>

          {/* Mobile: Burger Menu */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <svg 
                className="h-6 w-6 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-gray-50">
          <div className="px-6 py-4 space-y-3">
            <button
              onClick={handleAccount}
              className="block w-full text-center py-3 px-5 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Account Settings
            </button>
            <button
              onClick={handleOrders}
              className="block w-full text-center py-3 px-5 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Orders & Shipping
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-center py-3 px-5 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            {/* Title section with image - centered on mobile */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8 mb-4 lg:mb-0 justify-center lg:justify-start">
              <Image
                src="/images/profile/guest_list_image_pan.svg"
                alt="Guest List - Your Cookbook is Cooking"
                width={600}
                height={80}
                className="w-full max-w-2xl h-auto"
                priority
              />
            </div>
            
            {/* Right side - Progress bar - centered on mobile */}
            <div className="flex-shrink-0 flex justify-center lg:justify-end">
              <ProgressBar 
                current={progressData?.current_recipes || 0}
                goal={progressData?.goal_recipes || 40}
                loading={progressLoading}
              />
            </div>
          </div>
        </div>

        {/* Statistics and Recipe Collector Section */}
        <div className="mb-8 lg:mb-16 flex flex-col lg:flex-row gap-4 lg:gap-8 items-stretch">
          <div className="flex-1">
            <GuestStatisticsComponent />
          </div>
          <div className="flex-1">
            <RecipeCollectorLink />
          </div>
        </div>

        {/* Guest Table Controls */}
        <GuestTableControls
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onAddGuest={handleAddGuest}
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
            onDataLoaded={loadGuestCounts}
          />
        </div>


        {/* Add Guest Modal */}
        <AddGuestModal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          onGuestAdded={handleGuestAdded}
        />
      </div>
    </div>
  );
}
