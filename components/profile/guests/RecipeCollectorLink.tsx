"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Link as LinkIcon, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserCollectionToken, regenerateCollectionToken } from "@/lib/supabase/collection";

interface RecipeCollectorLinkProps {
  userId?: string;
}

export function RecipeCollectorLink({ userId }: RecipeCollectorLinkProps) {
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
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

  const handleRegenerateToken = async () => {
    if (!userId) return;
    
    setRegenerating(true);
    setError(null);
    
    try {
      const { data, error } = await regenerateCollectionToken(userId);
      if (error) {
        setError(error);
      } else {
        setToken(data);
      }
    } catch (err) {
      setError('Failed to regenerate link');
    } finally {
      setRegenerating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Recipe Collector</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && !token) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Recipe Collector</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-red-600 text-sm">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Your Recipe Collector</CardTitle>
          <Button 
            variant="link" 
            className="p-0 h-auto text-sm"
            onClick={handleRegenerateToken}
            disabled={regenerating}
          >
            {regenerating ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Regenerating...
              </>
            ) : (
              'Regenerate'
            )}
          </Button>
        </div>
        {error && (
          <p className="text-red-600 text-xs mt-1">{error}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-muted-foreground overflow-hidden">
              <span className="block truncate text-sm">
                {collectorLink || 'Loading...'}
              </span>
            </div>
            
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              disabled={!collectorLink}
            >
              <LinkIcon className="h-3 w-3" />
              <span className="text-xs">{copied ? "Copied!" : "Copy link"}</span>
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Share this link with family and friends to collect their recipes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}