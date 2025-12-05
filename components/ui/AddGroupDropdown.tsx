"use client";

import React, { useState } from "react";
import { Plus, UserPlus, BookOpen, Link2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShareCollectionModal } from "@/components/profile/guests/ShareCollectionModal";
import { getUserCollectionToken } from "@/lib/supabase/collection";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import { createShareURL } from "@/lib/utils/sharing";

interface AddGroupDropdownProps {
  onCreateNewGroup?: () => void;
  onInviteFriend?: () => void;
  onAddExistingRecipe?: () => void;
  onAddNewRecipe?: () => void;
  onCollectionLink?: () => void;
  groupId?: string | null;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export function AddGroupDropdown({
  onCreateNewGroup,
  onInviteFriend,
  onAddExistingRecipe,
  onAddNewRecipe,
  onCollectionLink,
  groupId = null,
  disabled = false,
  className,
  title = "Add plates"
}: AddGroupDropdownProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [collectionUrl, setCollectionUrl] = useState<string>('');
  const [userFullName, setUserFullName] = useState<string | null>(null);

  const handleCollectionLink = async () => {
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
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={disabled}
          className={cn(
            "bg-teal-600 text-white hover:bg-teal-700",
            "rounded-full w-20 h-20", 
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
      <DropdownMenuContent align="end" className="w-70">
        {onAddExistingRecipe && (
          <DropdownMenuItem onClick={onAddExistingRecipe}>
            <BookOpen className="h-4 w-4 mr-2" />
            Add a saved plate
          </DropdownMenuItem>
        )}
        {onAddNewRecipe && (
          <DropdownMenuItem onClick={onAddNewRecipe}>
            <Plus className="h-4 w-4 mr-2" />
            Create a new plate
          </DropdownMenuItem>
        )}
        {(onAddExistingRecipe || onAddNewRecipe) && onCollectionLink && (
          <DropdownMenuSeparator />
        )}
        <DropdownMenuItem onClick={handleCollectionLink}>
          <Link2 className="h-4 w-4 mr-2" />
          Collection link - Get Plates
        </DropdownMenuItem>
        {(onAddExistingRecipe || onAddNewRecipe || onCollectionLink) && onInviteFriend && (
          <DropdownMenuSeparator />
        )}
        {onInviteFriend && (
          <DropdownMenuItem onClick={onInviteFriend}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite a friend to this Book
          </DropdownMenuItem>
        )}
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