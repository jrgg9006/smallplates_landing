"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, BookOpen, Link2 } from "lucide-react";
import { ShareCollectionModal } from "@/components/profile/guests/ShareCollectionModal";
import { getUserCollectionToken } from "@/lib/supabase/collection";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import { createShareURL } from "@/lib/utils/sharing";

interface AddGroupPageDropdownProps {
  onCreateNewGroup: () => void;
  onInviteFriend: () => void;
  onAddExistingRecipe?: () => void;
  onAddNewRecipe?: () => void;
  groupId?: string | null;
  title?: string;
  className?: string;
}

export function AddGroupPageDropdown({ 
  onCreateNewGroup, 
  onInviteFriend,
  onAddExistingRecipe,
  onAddNewRecipe,
  groupId = null,
  title = "Group actions",
  className = ""
}: AddGroupPageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [collectionUrl, setCollectionUrl] = useState<string>('');
  const [userFullName, setUserFullName] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCreateNewGroup = () => {
    setIsOpen(false);
    onCreateNewGroup();
  };

  const handleInviteFriend = () => {
    setIsOpen(false);
    onInviteFriend();
  };

  const handleAddExistingRecipe = () => {
    setIsOpen(false);
    onAddExistingRecipe?.();
  };

  const handleAddNewRecipe = () => {
    setIsOpen(false);
    onAddNewRecipe?.();
  };

  const handleCollectionLink = async () => {
    setIsOpen(false);
    try {
      const { data: tokenData } = await getUserCollectionToken();
      const { data: profile } = await getCurrentProfile();
      
      if (tokenData && typeof window !== 'undefined') {
        const url = createShareURL(window.location.origin, tokenData, { groupId });
        setCollectionUrl(url);
        setUserFullName(profile?.full_name || null);
        setIsShareModalOpen(true);
      }
    } catch (err) {
      console.error('Error loading collection data:', err);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-teal-600 text-white hover:bg-teal-700 rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        aria-label={title}
        title={title}
      >
        <Plus className="h-6 w-6" />
      </Button>
      
      {isOpen && (
        <>
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[calc(100vw-3rem)] max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
            {/* Recipe Options */}
            {onAddExistingRecipe && (
              <button
                onClick={handleAddExistingRecipe}
                className="w-full px-4 py-3 text-left text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-3"
              >
                <BookOpen className="h-5 w-5" />
                Add a saved plate
              </button>
            )}
            {onAddNewRecipe && (
              <button
                onClick={handleAddNewRecipe}
                className="w-full px-4 py-3 text-left text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-3"
              >
                <Plus className="h-5 w-5" />
                Create a new plate
              </button>
            )}
            
            {/* Collection Link - Always show */}
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={handleCollectionLink}
              className="w-full px-4 py-3 text-left text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-3"
            >
              <Link2 className="h-5 w-5" />
              Collection link - Get Plates
            </button>
            
            {/* Group Options */}
            <button
              onClick={handleCreateNewGroup}
              className="w-full px-4 py-3 text-left text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-3"
            >
              <Plus className="h-5 w-5" />
              Create new book
            </button>
            <button
              onClick={handleInviteFriend}
              className="w-full px-4 py-3 text-left text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-3"
            >
              <UserPlus className="h-5 w-5" />
              Invite a friend to this Book
            </button>
          </div>
          {/* Overlay to close dropdown */}
          <div 
            className="fixed inset-0 z-[5]" 
            onClick={() => setIsOpen(false)}
          ></div>
        </>
      )}

      {/* Share Collection Modal */}
      {collectionUrl && (
        <ShareCollectionModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          collectionUrl={collectionUrl}
          userName={userFullName}
        />
      )}
    </div>
  );
}

