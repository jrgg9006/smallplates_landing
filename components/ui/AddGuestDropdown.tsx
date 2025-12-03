"use client";

import React, { useState } from "react";
import { Plus, Link2, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShareCollectionModal } from "@/components/profile/guests/ShareCollectionModal";
import { getUserCollectionToken } from "@/lib/supabase/collection";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import { createShareURL } from "@/lib/utils/sharing";

interface AddGuestDropdownProps {
  onAddGuest: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export function AddGuestDropdown({
  onAddGuest,
  disabled = false,
  className,
  title = "Guest actions"
}: AddGuestDropdownProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [collectionUrl, setCollectionUrl] = useState<string>('');
  const [userFullName, setUserFullName] = useState<string | null>(null);

  const handleShareLink = async () => {
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
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={disabled}
            className={cn(
              "bg-teal-600 text-white hover:bg-teal-700",
              "rounded-full w-16 h-16", 
              "flex items-center justify-center",
              "shadow-lg hover:shadow-xl transition-shadow",
              "p-0",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg",
              className
            )}
            title={title}
          >
            <Plus className="h-12 w-12" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[calc(100vw-3rem)] md:w-64 max-w-sm md:max-w-none rounded-lg md:rounded-md py-2 md:py-1">
          <DropdownMenuItem onClick={onAddGuest} className="px-4 md:px-2 py-3 md:py-1.5 text-base md:text-sm">
            <UserPlus className="h-5 w-5 md:h-4 md:w-4 mr-2" />
            Add a Guest
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareLink} className="px-4 md:px-2 py-3 md:py-1.5 text-base md:text-sm">
            <Link2 className="h-5 w-5 md:h-4 md:w-4 mr-2" />
            Invite a new Guest - Share Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {collectionUrl && (
        <ShareCollectionModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          collectionUrl={collectionUrl}
          userName={userFullName}
        />
      )}
    </>
  );
}