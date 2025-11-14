"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { ShareCollectionModal } from "./ShareCollectionModal";
import { getUserCollectionToken } from "@/lib/supabase/collection";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import { createShareURL } from "@/lib/utils/sharing";

interface RecipeCollectorButtonProps {
  label: string;
  className?: string; // Optional for custom styling
}

export function RecipeCollectorButton({ 
  label, 
  className 
}: RecipeCollectorButtonProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [collectionUrl, setCollectionUrl] = useState<string>('');
  const [userFullName, setUserFullName] = useState<string | null>(null);

  const handleClick = async () => {
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
      <Button
        onClick={handleClick}
        variant="outline"
        className={className || "border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-8 py-3 text-base font-medium flex items-center gap-2"}
      >
        <Link2 className="h-5 w-5" />
        {label}
      </Button>

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

