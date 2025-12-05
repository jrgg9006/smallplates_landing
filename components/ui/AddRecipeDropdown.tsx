"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronDown, Link2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ShareCollectionModal } from "@/components/profile/guests/ShareCollectionModal";
import { getUserCollectionToken } from "@/lib/supabase/collection";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import { createShareURL } from "@/lib/utils/sharing";

interface AddRecipeDropdownProps {
  buttonText?: string;
  onAddExistingRecipe: () => void;
  onAddNewRecipe: () => void;
  className?: string;
  disabled?: boolean;
  cookbookId?: string | null; // Optional cookbook ID for collection link context
  groupId?: string | null; // Optional group ID for collection link context
}

export function AddRecipeDropdown({
  buttonText = "Add a Plate",
  onAddExistingRecipe,
  onAddNewRecipe,
  className,
  disabled = false,
  cookbookId = null,
  groupId = null
}: AddRecipeDropdownProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [collectionUrl, setCollectionUrl] = useState<string>('');
  const [userFullName, setUserFullName] = useState<string | null>(null);

  const handleCollectionLink = async () => {
    try {
      const { data: tokenData } = await getUserCollectionToken();
      const { data: profile } = await getCurrentProfile();
      
      if (tokenData && typeof window !== 'undefined') {
        const url = createShareURL(window.location.origin, tokenData, { cookbookId, groupId });
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
          variant="outline"
          className={className || "border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-2 text-sm font-medium flex items-center gap-2"}
          disabled={disabled}
        >
          <BookOpen className="h-4 w-4" />
          {buttonText}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-3rem)] md:w-64 max-w-sm md:max-w-none rounded-lg md:rounded-md py-2 md:py-1">
        <DropdownMenuItem onClick={onAddExistingRecipe} className="px-4 md:px-2 py-3 md:py-1.5 text-base md:text-sm">
          Add a saved plate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddNewRecipe} className="px-4 md:px-2 py-3 md:py-1.5 text-base md:text-sm">
          Create a new plate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCollectionLink} className="px-4 md:px-2 py-3 md:py-1.5 text-base md:text-sm">
          <Link2 className="h-5 w-5 md:h-4 md:w-4 mr-2" />
          Collection link - Get Plates
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