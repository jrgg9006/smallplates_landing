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
import { Bell } from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [progressData, setProgressData] = useState<UserProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);

  const handleAddGuest = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleGuestAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    loadProgressData(); // Reload progress when guest is added
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

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Load progress data when user is available
  useEffect(() => {
    if (user?.id) {
      loadProgressData();
    }
  }, [user?.id]);

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
    <div className="min-h-screen bg-stone-50 text-gray-700">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Logo - Clickable to go back to landing */}
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <Image
                  src="/images/SmallPlates_logo_horizontal.png"
                  alt="Small Plates & Co."
                  width={200}
                  height={40}
                  className="h-14 w-auto cursor-pointer"
                />
              </Link>
              {/* Divider */}
              <div className="h-10 w-px bg-gray-300" />
              {/* Page Title */}
              <h1 className="text-4xl font-serif font-semibold text-gray-900">Guest List</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {/* Notification Badge */}
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">1</span>
                </span>
              </button>
              
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-serif font-medium text-gray-900 mb-8">
            Your Cookbook is Cooking...
          </h1>
        </div>

        {/* Statistics Section - Centered */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-2xl">
            <GuestStatisticsComponent />
          </div>
        </div>

        {/* Progress Bar Section - Centered */}
        <div className="flex justify-center mb-8">
          <ProgressBar 
            current={progressData?.current_recipes || 0}
            goal={progressData?.goal_recipes || 40}
            loading={progressLoading}
          />
        </div>

        {/* Recipe Collector Section - Centered */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-2xl">
            <RecipeCollectorLink userId={user?.id} />
          </div>
        </div>

        {/* Guest Table Controls */}
        <GuestTableControls
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onAddGuest={handleAddGuest}
        />

        {/* Guest Table */}
        <div>
          <GuestTable key={refreshTrigger} searchValue={searchValue} statusFilter={statusFilter} />
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
