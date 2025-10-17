"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const token = params.token as string;
  
  // State management
  const [tokenInfo, setTokenInfo] = useState<CollectionTokenInfo | null>(null);
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize component
  useEffect(() => {
    async function initialize() {
      // Validate token
      const { data, error } = await validateCollectionToken(token);
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
      
      setLoading(false);
    }

    initialize();
  }, [token, router]);

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

  // Main journey experience
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Co"
              width={200}
              height={40}
              priority
            />
          </Link>
          <div className="w-16"></div>
        </div>
      </div>

      {/* Recipe Journey */}
      <RecipeJourneyWrapper
        tokenInfo={tokenInfo}
        guestData={guestData}
        token={token}
      />
    </div>
  );
}