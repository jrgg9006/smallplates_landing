"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUserCollectionToken } from "@/lib/supabase/collection";

interface RecipeCollectorLinkProps {
  // No props needed
}

export function RecipeCollectorLink({}: RecipeCollectorLinkProps = {}) {
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load collection token on component mount
  useEffect(() => {
    async function loadToken() {
      try {
        const { data, error } = await getUserCollectionToken();
        if (error) {
          setError(error);
        } else {
          setToken(data);
        }
      } catch (err) {
        setError('Failed to load collection link');
      } finally {
        setLoading(false);
      }
    }

    loadToken();
  }, []);

  const collectorLink = token ? `${window.location.origin}/collect/${token}` : '';

  const handleCopyLink = async () => {
    if (!collectorLink) return;
    
    try {
      await navigator.clipboard.writeText(collectorLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };


  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg flex w-fit max-w-full overflow-hidden h-[88px]">
        <div className="px-4 sm:px-6 py-6 relative flex flex-col justify-center w-auto sm:w-56">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Recipe Collector</h3>
          <p className="hidden sm:block text-xs text-gray-600 leading-tight">Share with guests to collect<br />their favorite recipes</p>
        </div>
        <div className="w-px bg-gray-300 self-stretch my-4"></div>
        <div className="px-3 sm:px-4 py-6 pr-4 sm:pr-8 flex items-center gap-2 sm:gap-3">
          <div className="animate-pulse bg-gray-200 h-8 w-40 sm:w-72 lg:w-80 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-8 w-20 sm:w-28 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !token) {
    return (
      <div className="bg-gray-100 rounded-lg flex w-fit max-w-full overflow-hidden h-[88px]">
        <div className="px-4 sm:px-6 py-6 relative flex flex-col justify-center w-auto sm:w-56">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Recipe Collector</h3>
          <p className="hidden sm:block text-xs text-gray-600 leading-tight">Share with guests to collect<br />their favorite recipes</p>
        </div>
        <div className="w-px bg-gray-300 self-stretch my-4"></div>
        <div className="px-3 sm:px-4 py-6 pr-4 sm:pr-8 flex items-center">
          <div className="text-red-600 text-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg flex w-fit max-w-full overflow-hidden h-[88px]">
      {/* Left side - Title and description */}
      <div className="px-4 sm:px-6 py-6 relative flex flex-col justify-center w-auto sm:w-56">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Recipe Collector</h3>
        <p className="hidden sm:block text-xs text-gray-600 leading-tight">Share with guests to collect<br />their favorite recipes</p>
      </div>
      
      {/* Vertical divider */}
      <div className="w-px bg-gray-300 self-stretch my-4"></div>
      
      {/* Right side - Input and button */}
      <div className="px-3 sm:px-4 py-6 pr-4 sm:pr-8 flex items-center gap-2 sm:gap-3">
        <Input
          value={collectorLink}
          readOnly
          className="w-40 sm:w-72 lg:w-80 bg-white text-xs h-8 border-gray-300"
          placeholder="Generating link..."
        />
        <Button
          onClick={handleCopyLink}
          className="bg-gray-900 text-white hover:bg-gray-800 px-3 sm:px-6 py-2 h-8 text-xs font-medium whitespace-nowrap"
          disabled={!collectorLink}
        >
          {copied ? "Copied!" : "Copy Form Link"}
        </Button>
      </div>
      
      {error && (
        <div className="absolute bottom-1 right-4 text-red-600 text-xs">{error}</div>
      )}
    </div>
  );
}