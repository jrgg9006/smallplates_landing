"use client";

import React from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GuestTable } from "@/components/profile/guests/GuestTable";
import { GuestTableControls } from "@/components/profile/guests/GuestTableControls";
import { GuestStatisticsComponent } from "@/components/profile/guests/GuestStatistics";
import { RecipeCollectorLink } from "@/components/profile/guests/RecipeCollectorLink";
import { AddGuestModal } from "@/components/profile/guests/AddGuestModal";
import { Guest, GuestStatistics } from "@/lib/types/guest";
import ProfileDropdown from "@/components/profile/ProfileDropdown";
import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for development
const mockGuests: Guest[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    recipeStatus: "submitted",
    invitedAt: new Date("2024-01-15"),
    submittedAt: new Date("2024-01-20"),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    recipeStatus: "invited",
    invitedAt: new Date("2024-01-18"),
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-18"),
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "m.brown@example.com",
    phone: "(555) 987-6543",
    recipeStatus: "not_invited",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
];

const mockStats: GuestStatistics = {
  totalGuests: 12,
  invitesSent: 8,
  recipesReceived: 5,
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [guests] = useState<Guest[]>(mockGuests);
  const [stats] = useState<GuestStatistics>(mockStats);
  const [searchValue, setSearchValue] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleFilterChange = (value: string) => {
    // This will be handled by the table internally
    console.log("Filter changed to:", value);
  };

  const handleAddGuest = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
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
            <div>
              <h1 className="text-4xl font-serif font-semibold text-gray-900">Guest Management</h1>
              <p className="mt-1 text-gray-600">Manage your cookbook contributors</p>
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
        {/* Recipe Collector Link */}
        <RecipeCollectorLink userId={user?.id} />
        
        {/* Statistics */}
        <GuestStatisticsComponent stats={stats} />

        {/* Guest Table Controls */}
        <GuestTableControls
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onFilterChange={handleFilterChange}
          onAddGuest={handleAddGuest}
        />

        {/* Guest Table */}
        <Card>
          <CardContent className="p-0">
            <GuestTable 
              data={guests}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              onFilterChange={handleFilterChange}
              onAddGuest={handleAddGuest}
            />
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
                You have {stats.recipesReceived} recipes ready for your cookbook
              </p>
              <Button size="lg">Preview & Order Book</Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Guest Modal */}
        <AddGuestModal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
        />
      </div>
    </div>
  );
}
