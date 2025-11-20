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
import { Pencil } from "lucide-react";
import { AddGroupDropdown } from "@/components/ui/AddGroupDropdown";
import { AddGroupPageDropdown } from "@/components/ui/AddGroupPageDropdown";

export default function GroupsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const groupsSectionRef = useRef<GroupsSectionRef>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);

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
                  <h3 className="text-lg font-light text-gray-600 mb-2 lg:mb-0">
                    {selectedGroup?.description?.trim() || 'Collaborative recipes'}
                  </h3>
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
            
            {/* Right side - Action buttons - centered on mobile, stacked vertically */}
            <div className="flex-shrink-0 flex flex-col lg:flex-row items-center gap-3 lg:gap-4 justify-center lg:justify-end w-full lg:w-auto">
              {/* Placeholder for future action buttons */}
            </div>

            {/* Desktop: Add Group button */}
            <div className="hidden lg:block">
              <AddGroupDropdown
                onCreateNewGroup={handleAddGroup}
                onInviteFriend={handleInviteFriend}
                title="Group actions"
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