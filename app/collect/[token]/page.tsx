"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { validateCollectionToken, searchGuestInCollection } from '@/lib/supabase/collection';
import type { CollectionTokenInfo, Guest } from '@/lib/types/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Generate personalized request message based on user's full name
 * Handles both single person and couple scenarios
 */
function generatePersonalizedMessage(fullName: string, rawFullName: string | null) {
  if (!rawFullName) {
    return {
      beforeName: 'Share Your Recipe',
      name: '',
      afterName: '',
      description: 'Please enter your first initial and last name to get started'
    };
  }

  // Check if it's a couple (contains " and ")
  if (fullName.includes(' and ')) {
    // Extract first names for couple
    const parts = fullName.split(' and ');
    const firstPersonFirstName = parts[0]?.split(' ')[0] || '';
    const secondPersonFirstName = parts[1]?.split(' ')[0] || '';
    
    return {
      beforeName: '',
      name: `${firstPersonFirstName} and ${secondPersonFirstName}`,
      afterName: ' request your recipe',
      description: 'Share a treasured family recipe to be included in their cookbook'
    };
  } else {
    // Single person - extract first name
    const firstName = fullName.split(' ')[0] || '';
    return {
      beforeName: '',
      name: firstName,
      afterName: ' is creating a cookbook, and would love to include your recipe!',
    };
  }
}

export default function CollectionLandingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  // Mobile debugging - log component mount
  useEffect(() => {
    console.log('🔥 CollectionLandingPage mounted on mobile', {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      token,
      timestamp: new Date().toISOString()
    });
  }, [token]);
  
  // State management
  const [tokenInfo, setTokenInfo] = useState<CollectionTokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mobile debugging - console only (no visual logs)
  const addDebugLog = (message: string) => {
    console.log(message);
  };
  
  // Guest search state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  // Validate token on component mount
  useEffect(() => {
    async function validateToken() {
      console.log('🔍 Mobile Debug - validateToken starting', { token });
      
      if (!token) {
        console.error('❌ Mobile Debug - No token provided');
        setError('No collection link provided');
        setLoading(false);
        return;
      }

      try {
        addDebugLog('📡 Calling validateCollectionToken');
        const { data, error } = await validateCollectionToken(token);
        
        addDebugLog(`📡 Response: ${error ? 'ERROR: ' + error : 'SUCCESS'}`);
        
        if (error || !data) {
          addDebugLog('❌ Token validation failed: ' + error);
          setError(error || 'Invalid collection link');
        } else {
          addDebugLog('✅ Token validation success');
          setTokenInfo(data);
        }
      } catch (err) {
        addDebugLog('💥 validateCollectionToken error: ' + String(err));
        setError('Failed to validate collection link');
      }
      
      setLoading(false);
      console.log('🏁 Mobile Debug - validateToken completed');
    }

    validateToken();
  }, [token]);

  // Handle guest search
  const handleSearch = async () => {
    console.log('Mobile Debug - handleSearch called', { tokenInfo: !!tokenInfo, firstName, lastName });
    
    if (!tokenInfo || !firstName.trim()) {
      console.log('Mobile Debug - Search cancelled: missing tokenInfo or firstName');
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const { data: guest, error } = await searchGuestInCollection(
        tokenInfo.user_id,
        firstName.trim(),
        lastName.trim()
      );

      if (error) {
        setError(error);
      } else {
        setSearchResults(guest || []);
        setSearchCompleted(true);
      }
    } catch (err) {
      setError('Failed to search for guest');
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Handle guest selection
  const handleGuestSelect = (guest: Guest) => {
    setSelectedGuest(guest);
    const guestData = {
      id: guest.id,
      firstName: guest.first_name,
      lastName: guest.last_name,
      email: guest.email,
      phone: guest.phone,
      existing: true
    };

    // Store guest data in session storage for the recipe form with error handling
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('collectionGuestData', JSON.stringify(guestData));
      }
    } catch (error) {
      console.warn('Failed to store guest data in sessionStorage:', error);
      // Continue anyway - we can handle missing sessionStorage in the recipe page
    }
    
    // Navigate to recipe form
    router.push(`/collect/${token}/recipe`);
  };

  // Handle continue for new guest
  const handleContinueAsNew = () => {
    const guestData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      existing: false
    };

    // Store guest data in session storage for the recipe form with error handling
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('collectionGuestData', JSON.stringify(guestData));
      }
    } catch (error) {
      console.warn('Failed to store guest data in sessionStorage:', error);
      // Continue anyway - we can handle missing sessionStorage in the recipe page
    }
    
    // Navigate to recipe form
    router.push(`/collect/${token}/recipe`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !tokenInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <p className="text-sm text-gray-500">
                Please check the link or contact the person who shared it with you.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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

      {/* Main Content - Two Column Layout */}
      <div className="min-h-screen lg:min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
        {/* Left Column - Image */}
        <div className="hidden lg:flex lg:w-1/2 bg-gray-100 items-center justify-center lg:min-h-[calc(100vh-4rem)]">
          <div className="w-80 h-80 bg-gray-300 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 text-lg">Recipe Collection Image</span>
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 py-8 lg:py-12 min-h-[calc(100vh-8rem)] lg:min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md mx-auto">
            <div className="space-y-6">
              {(() => {
                const userName = tokenInfo?.user_name || '';
                const rawFullName = tokenInfo?.raw_full_name || null;
                console.log('Debug - tokenInfo:', tokenInfo);
                console.log('Debug - user_name:', userName);
                console.log('Debug - raw_full_name:', rawFullName);
                const personalizedMessage = generatePersonalizedMessage(userName, rawFullName);
                console.log('Debug - personalizedMessage:', personalizedMessage);
                return (
                  <div className="text-center lg:text-left">
                    <h1 className="text-3xl font-semibold text-gray-900 mb-4">
                      {personalizedMessage.beforeName}
                      {personalizedMessage.name && (
                        <span className="font-serif text-4xl font-bold text-gray-900 mx-1">
                          {personalizedMessage.name}
                        </span>
                      )}
                      {personalizedMessage.afterName}
                    </h1>
                    <p className="text-gray-600 mb-6">
                      {personalizedMessage.description}
                    </p>
                    <div className="text-sm text-gray-500 mb-6">
                      Please enter your first initial and last name to find yourself
                    </div>
                  </div>
                );
              })()}

              {/* Search Form */}
              <div className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="w-20">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First initial
                  </label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 1).toUpperCase();
                      addDebugLog(`✏️ firstName: ${value}`);
                      setFirstName(value);
                    }}
                    placeholder=""
                    disabled={searching}
                    maxLength={1}
                    className="text-center"
                    autoComplete="given-name"
                    inputMode="text"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last name
                  </label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => {
                      const value = e.target.value;
                      addDebugLog(`✏️ lastName: ${value}`);
                      setLastName(value);
                    }}
                    placeholder=""
                    disabled={searching}
                    autoComplete="family-name"
                    inputMode="text"
                  />
                </div>
                <Button 
                  onClick={() => {
                    addDebugLog('🔍 Search button clicked');
                    handleSearch();
                  }}
                  disabled={!firstName.trim() || searching}
                  className="bg-gray-400 text-white hover:bg-gray-500 px-4 sm:px-8 py-2 rounded-full h-10 min-w-[80px]"
                >
                  {searching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>

            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Search Results */}
            {searchCompleted && (
              <div className="border-t pt-6">
                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Select your name to unlock your private form
                    </h3>
                    <div className="space-y-3">
                      {searchResults.map((guest) => (
                        <button
                          key={guest.id}
                          onClick={() => handleGuestSelect(guest)}
                          className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                        >
                          <span className="text-gray-900 font-medium">
                            {guest.first_name} {guest.last_name}
                          </span>
                          <svg 
                            className="w-5 h-5 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                      <button
                        onClick={handleContinueAsNew}
                        className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="text-gray-900 font-medium">
                          I don&apos;t see my name
                        </span>
                        <svg 
                          className="w-5 h-5 text-gray-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Welcome! You&apos;re not in the list yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      No worries! We&apos;ll add you when you submit your recipe.
                      {lastName.trim() && (
                        <span> We&apos;ll use <strong>{firstName} {lastName}</strong> as your name.</span>
                      )}
                      {!lastName.trim() && (
                        <span> We&apos;ll use <strong>{firstName}</strong> as your name.</span>
                      )}
                    </p>
                    <button
                      onClick={handleContinueAsNew}
                      className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-gray-900 font-medium">
                        Continue to Recipe Form
                      </span>
                      <svg 
                        className="w-5 h-5 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
              {/* Instructions */}
              <div className="text-center text-sm text-gray-500 mt-6">
                <p>
                  After finding yourself, you&apos;ll be able to submit your favorite recipe 
                  to be included in the collection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}