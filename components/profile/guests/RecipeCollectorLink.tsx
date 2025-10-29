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
    if (!collectorLink) return;
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
      {/* Mobile layout */}
      <div className="sm:hidden bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Recipe Collector</h3>
          <p className="text-xs text-gray-600">Share link with guests</p>
        </div>
        <Button
          onClick={handleShareLink}
          className="bg-gray-900 text-white hover:bg-gray-800 w-full py-3 h-auto text-sm font-medium"
          disabled={!collectorLink}
          title="Copy link to share with guests via any messaging app"
        >
          Copy Form Link
        </Button>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex bg-gray-50 rounded-lg w-full overflow-hidden h-[88px]">
      {/* Left side - Title and description */}
      <div className="px-4 sm:px-6 py-6 relative flex flex-col justify-center w-auto flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Recipe Collector</h3>
        <p className="text-xs text-gray-600 leading-tight">
          Share with guests to collect<br />their favorite recipes
        </p>
      </div>
      
      {/* Vertical divider */}
      <div className="w-px bg-gray-300 self-stretch my-4"></div>
      
      {/* Right side - Input and button */}
      <div className="px-3 sm:px-4 py-6 pr-4 sm:pr-8 flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Input field */}
        <Input
          value={collectorLink}
          readOnly
          className="flex-1 min-w-0 bg-white text-xs h-8 border-gray-300"
          placeholder="Generating link..."
        />
        
        {/* Button */}
        <Button
          onClick={handleShareLink}
          className="bg-gray-900 text-white hover:bg-gray-800 px-3 sm:px-6 py-2 h-8 text-sm font-medium whitespace-nowrap sm:flex-shrink-0"
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