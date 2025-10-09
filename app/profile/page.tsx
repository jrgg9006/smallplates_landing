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
import ProfileDropdown from "@/components/profile/ProfileDropdown";
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchValue, setSearchValue] = useState('');

  const handleAddGuest = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleGuestAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

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
    <div className="min-h-screen bg-gray-50">
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
        {/* Two Column Layout: Statistics + Recipe Collector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
          {/* Statistics - Left Side */}
          <div className="h-full">
            <GuestStatisticsComponent />
          </div>
          
          {/* Recipe Collector - Right Side */}
          <div className="h-full">
            <RecipeCollectorLink userId={user?.id} />
          </div>
        </div>

        {/* Guest Table Controls */}
        <GuestTableControls
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onFilterChange={() => {}} // TODO: Implement filter functionality
          onAddGuest={handleAddGuest}
        />

        {/* Guest Table */}
        <Card>
          <CardContent className="p-0">
            <GuestTable key={refreshTrigger} searchValue={searchValue} />
          </CardContent>
        </Card>

        {/* Book Preview Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Cookbook</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Your recipes are being collected for your cookbook
              </p>
              <Button size="lg">Preview & Order Book</Button>
            </div>
          </CardContent>
        </Card>

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
