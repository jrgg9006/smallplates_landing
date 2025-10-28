"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUserCollectionToken } from "@/lib/supabase/collection";
import { createShareURL } from "@/lib/utils/sharing";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import { ShareCollectionModal } from "./ShareCollectionModal";

interface RecipeCollectorLinkProps {
  // No props needed
}

export function RecipeCollectorLink({}: RecipeCollectorLinkProps = {}) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Load collection token and user profile on component mount
  useEffect(() => {
    async function loadData() {
      try {
        // Load token
        const { data: tokenData, error: tokenError } = await getUserCollectionToken();
        if (tokenError) {
          setError(tokenError);
        } else {
          setToken(tokenData);
        }
        
        // Load user profile
        const { data: profile, error: profileError } = await getCurrentProfile();
        if (!profileError && profile) {
          setUserFullName(profile.full_name || null);
        }
      } catch (err) {
        setError('Failed to load collection link');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const collectorLink = token && typeof window !== 'undefined' ? createShareURL(window.location.origin, token) : '';

  const handleShareLink = () => {
    console.log('🔥 handleShareLink called!', {
      collectorLink,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    });
    
    if (!collectorLink) {
      console.log('❌ No collector link available');
      return;
    }
    
    console.log('✅ Opening share modal');
    setShowShareModal(true);
  };


  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg flex w-full overflow-hidden h-[88px]">
        <div className="px-4 sm:px-6 py-6 relative flex flex-col justify-center w-auto flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Recipe Collector</h3>
          <p className="hidden sm:block text-xs text-gray-600 leading-tight">Share with guests to collect<br />their favorite recipes</p>
        </div>
        <div className="hidden sm:block w-px bg-gray-300 self-stretch my-4"></div>
        <div className="px-3 sm:px-4 py-6 pr-4 sm:pr-8 flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="hidden sm:block animate-pulse bg-gray-200 h-8 flex-1 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-8 w-full sm:w-28 rounded sm:flex-shrink-0"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !token) {
    return (
      <div className="bg-gray-100 rounded-lg flex w-full overflow-hidden h-[88px]">
        <div className="px-4 sm:px-6 py-6 relative flex flex-col justify-center w-auto flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Recipe Collector</h3>
          <p className="hidden sm:block text-xs text-gray-600 leading-tight">Share with guests to collect<br />their favorite recipes</p>
        </div>
        <div className="hidden sm:block w-px bg-gray-300 self-stretch my-4"></div>
        <div className="px-3 sm:px-4 py-6 pr-4 sm:pr-8 flex items-center flex-1">
          <div className="text-red-600 text-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 rounded-lg flex w-full overflow-hidden h-[88px]">
      {/* Left side - Title and description */}
      <div className="px-4 sm:px-6 py-6 relative flex flex-col justify-center w-auto flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Recipe Collector</h3>
        <p className="hidden sm:block text-xs text-gray-600 leading-tight">
          Share with guests to collect<br />their favorite recipes
        </p>
        <p className="sm:hidden text-xs text-gray-600 leading-tight">
          Share link with guests
        </p>
      </div>
      
      {/* Vertical divider - hidden on very small screens */}
      <div className="hidden sm:block w-px bg-gray-300 self-stretch my-4"></div>
      
      {/* Right side - Input and button on larger screens, button only on small screens */}
      <div className="px-3 sm:px-4 py-6 pr-4 sm:pr-8 flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Input field - hidden on very small screens */}
        <Input
          value={collectorLink}
          readOnly
          className="hidden sm:block flex-1 min-w-0 bg-white text-xs h-8 border-gray-300"
          placeholder="Generating link..."
        />
        
        {/* Button - full width on small screens, normal width on larger screens */}
        <Button
          onClick={handleShareLink}
          className="bg-gray-900 text-white hover:bg-gray-800 px-3 sm:px-6 py-2 h-8 text-sm font-medium whitespace-nowrap w-full sm:w-auto sm:flex-shrink-0"
          disabled={!collectorLink}
          title="Copy link to share with guests via any messaging app"
        >
Copy Form Link
        </Button>
      </div>
      
      {error && (
        <div className="absolute bottom-1 right-4 text-red-600 text-xs">{error}</div>
      )}
    </div>
    
    {/* Share Modal */}
    <ShareCollectionModal
      isOpen={showShareModal}
      onClose={() => setShowShareModal(false)}
      collectionUrl={collectorLink}
      userName={userFullName}
    />
    </>
  );
}