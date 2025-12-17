"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { validateCollectionToken } from '@/lib/supabase/collection';
import type { CollectionTokenInfo } from '@/lib/types/database';
import { Card, CardContent } from '@/components/ui/card';
import RecipeJourneyWrapper from '@/components/recipe-journey/RecipeJourneyWrapper';

interface GuestData {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  existing: boolean;
}

export default function RecipeFormPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  
  // Get cookbook/group context from query parameters OR sessionStorage (fallback)
  const cookbookIdFromParams = searchParams.get('cookbook');
  const groupIdFromParams = searchParams.get('group');
  
  // State management
  const [tokenInfo, setTokenInfo] = useState<CollectionTokenInfo | null>(null);
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [cookbookId, setCookbookId] = useState<string | null>(cookbookIdFromParams);
  const [groupId, setGroupId] = useState<string | null>(groupIdFromParams);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize component
  useEffect(() => {
    async function initialize() {
      // Validate token (pass groupId for group-specific message)
      const { data, error } = await validateCollectionToken(token, groupIdFromParams);
      if (error || !data) {
        setError(error || 'Invalid collection link');
        setLoading(false);
        return;
      }
      setTokenInfo(data);

      // Get guest data from session storage
      const storedGuestData = sessionStorage.getItem('collectionGuestData');
      if (!storedGuestData) {
        // Redirect back to landing if no guest data
        router.push(`/collect/${token}`);
        return;
      }

      const parsedGuestData = JSON.parse(storedGuestData) as GuestData;
      setGuestData(parsedGuestData);
      
      // Get context from query params OR sessionStorage (fallback)
      let finalCookbookId = cookbookIdFromParams;
      let finalGroupId = groupIdFromParams;
      
      console.log('🔧 DEBUG RecipePage: Initial context from params:', {
        cookbookIdFromParams,
        groupIdFromParams
      });
      
      // If query params are missing, try sessionStorage
      if (!finalCookbookId && !finalGroupId) {
        const storedContext = sessionStorage.getItem('collectionContext');
        console.log('🔧 DEBUG RecipePage: Trying sessionStorage context:', storedContext);
        if (storedContext) {
          try {
            const context = JSON.parse(storedContext);
            finalCookbookId = context.cookbookId || null;
            finalGroupId = context.groupId || null;
            console.log('🔧 DEBUG RecipePage: Parsed context from sessionStorage:', context);
          } catch (e) {
            console.warn('Failed to parse stored context:', e);
          }
        }
      }
      
      console.log('🔧 DEBUG RecipePage: Final context to use:', {
        finalCookbookId,
        finalGroupId
      });
      
      setCookbookId(finalCookbookId);
      setGroupId(finalGroupId);
      
      setLoading(false);
    }

    initialize();
  }, [token, router, cookbookIdFromParams, groupIdFromParams]);

  // Handle back navigation
  const handleBack = () => {
    router.push(`/collect/${token}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your recipe journey...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !tokenInfo || !guestData) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-center">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image
                src="/images/SmallPlates_logo_horizontal.png"
                alt="Small Plates & Co"
                width={200}
                height={40}
                priority
              />
            </Link>
          </div>
        </div>
        
        {/* Error Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Oops!</h2>
                <p className="text-gray-600 mb-4">
                  {error || 'Something went wrong loading your recipe form.'}
                </p>
                <button
                  onClick={handleBack}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Go Back
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main journey experience - fullscreen like onboarding
  return (
    <div className="min-h-screen bg-white">
      {/* Recipe Journey - No header, fullscreen */}
      <RecipeJourneyWrapper
        tokenInfo={tokenInfo}
        guestData={guestData}
        token={token}
        cookbookId={cookbookId}
        groupId={groupId}
      />
    </div>
  );
}