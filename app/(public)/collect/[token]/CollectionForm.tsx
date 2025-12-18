"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { validateCollectionToken, searchGuestInCollection } from '@/lib/supabase/collection';
import type { CollectionTokenInfo, Guest } from '@/lib/types/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Generate personalized request message based on user's full name
 * Always returns "A Personal Note:" as title, only the couple names change
 */
function generatePersonalizedMessage(fullName: string, rawFullName: string | null) {
  // Always show "A Personal Note:" as title
  // Only difference is if we show couple names or "our friends"
  
  if (!rawFullName) {
    // No name available - use generic fallback
    return {
      beforeName: 'A Personal Note:',
      name: '',
      afterName: '',
    };
  }

  // Check if it's a couple (contains " and ")
  if (fullName.includes(' and ')) {
    // Extract first names for couple
    const parts = fullName.split(' and ');
    const firstPersonFirstName = parts[0]?.split(' ')[0] || '';
    const secondPersonFirstName = parts[1]?.split(' ')[0] || '';
    
    return {
      beforeName: 'A Personal Note:',
      name: '',
      afterName: '',
    };
  } else {
    // Single person
    return {
      beforeName: 'A Personal Note:',
      name: '',
      afterName: '',
    };
  }
}

export default function CollectionForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  
  // Get cookbook/group context from query parameters to preserve during navigation
  const cookbookId = searchParams.get('cookbook');
  const groupId = searchParams.get('group');
  
  console.log('🔧 DEBUG CollectionForm: URL params detected:', {
    cookbookId,
    groupId,
    fullUrl: typeof window !== 'undefined' ? window.location.href : 'server-side',
    searchParams: typeof window !== 'undefined' ? window.location.search : 'server-side'
  });
  
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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  // Mobile debugging - console and visual logs
  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  // Guest search state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [fullName, setFullName] = useState('');
  // 1) Add showNameEntry state
  const [showNameEntry, setShowNameEntry] = useState(false);

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
        const { data, error } = await validateCollectionToken(token, groupId);
        
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
  }, [token, groupId]);

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

    // Store guest data AND context in session storage for the recipe form with error handling
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('collectionGuestData', JSON.stringify(guestData));
        // Store cookbook/group context as backup
        if (cookbookId || groupId) {
          const contextToStore = { cookbookId, groupId };
          console.log('🔧 DEBUG CollectionForm: Storing context in sessionStorage (existing guest):', contextToStore);
          sessionStorage.setItem('collectionContext', JSON.stringify(contextToStore));
        }
      }
    } catch (error) {
      console.warn('Failed to store data in sessionStorage:', error);
      // Continue anyway - we can handle missing sessionStorage in the recipe page
    }
    
    // Navigate to recipe form, preserving query parameters
    const queryString = cookbookId ? `?cookbook=${cookbookId}` : groupId ? `?group=${groupId}` : '';
    router.push(`/collect/${token}/recipe${queryString}`);
  };

  // Handle continue for new guest
  // 4) Update handleContinueAsNew to require fullName and derive names ONLY from there if showNameEntry is true
  const handleContinueAsNew = () => {
    let name = fullName.trim();
    if (!name) return;
    const parts = name.split(/\s+/);
    const derivedLast = parts.length > 1 ? parts.pop() as string : '';
    const derivedFirst = parts.length > 0 ? parts.join(' ') : name;
    const guestData = {
      firstName: derivedFirst.trim(),
      lastName: derivedLast.trim(),
      existing: false
    };
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('collectionGuestData', JSON.stringify(guestData));
        // Store cookbook/group context as backup
        if (cookbookId || groupId) {
          const contextToStore = { cookbookId, groupId };
          console.log('🔧 DEBUG CollectionForm: Storing context in sessionStorage (new guest):', contextToStore);
          sessionStorage.setItem('collectionContext', JSON.stringify(contextToStore));
        }
      }
    } catch {
      // ignore
    }
    // Navigate to recipe form, preserving query parameters
    const queryString = cookbookId ? `?cookbook=${cookbookId}` : groupId ? `?group=${groupId}` : '';
    router.push(`/collect/${token}/recipe${queryString}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white lg:bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4A854] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !tokenInfo) {
    return (
      <div className="min-h-screen bg-white lg:bg-[#FAF7F2] flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <p className="text-sm text-gray-500">
                Please check the link or contact the person who shared it with you.
              </p>
              
              {/* Debug info for troubleshooting */}
              <div className="mt-4 p-4 bg-gray-100 rounded text-left text-sm">
                <p><strong>Debug Info:</strong></p>
                <p>Token: {token}</p>
                <p>Error: {error}</p>
                <p>Debug Logs:</p>
                <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
                  {debugLogs.map((log, index) => (
                    <div key={index} className="text-xs font-mono">{log}</div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white lg:bg-[#FAF7F2]">
      {/* Header */}
      <div className="bg-white lg:bg-[#FAF7F2] border-b border-gray-200">
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
        <div className="hidden lg:block lg:w-2/5 relative bg-[#E8E0D5] h-[calc(100vh-4rem)] p-2">
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            <Image
              src={tokenInfo?.couple_image_url || "/images/collect/collect_1.jpg"}
              alt={tokenInfo?.couple_image_url ? "Couple Photo" : "Small Plates Cookbook Recipe Collection"}
              fill
              sizes="40vw"
              className={tokenInfo?.couple_image_url ? "object-cover" : "object-contain"}
              priority
            />
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="w-full lg:w-3/5 flex items-center justify-center px-4 sm:px-6 py-8 lg:py-12 min-h-[calc(100vh-8rem)] lg:min-h-[calc(100vh-4rem)]">
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
                  <div className="text-left">
                    {/* Mobile Couple Image - shown above Personal Note title */}
                    {tokenInfo?.couple_image_url && (
                      <div className="lg:hidden mb-6">
                        <div className="relative w-full h-64 bg-gray-100 rounded-2xl overflow-hidden">
                          <Image
                            src={tokenInfo.couple_image_url}
                            alt="Couple Photo"
                            fill
                            sizes="100vw"
                            className="object-cover"
                            priority
                          />
                        </div>
                      </div>
                    )}
                    
                    <h1 className="text-2xl lg:text-3xl font-semibold text-[#2D2D2D] mb-4 font-serif">
                      {personalizedMessage.beforeName}
                      {personalizedMessage.name && (
                        <span className="font-semibold text-gray-900 mx-1">
                          {personalizedMessage.name}
                        </span>
                      )}
                      {personalizedMessage.afterName}
                    </h1>
                    
                    {/* Personal Message from Share Collection Modal */}
                    <div className="mb-6">
                      <div>
                        {(() => {
                          // If there's a saved custom message, show it
                          if (tokenInfo?.custom_share_message) {
                            const note = tokenInfo.custom_share_message;
                            
                            return (
                              <div>
                                <p className="text-gray-700 text-base lg:text-lg xl:text-xl leading-relaxed font-light md:first-letter:text-6xl md:first-letter:font-serif md:first-letter:float-left md:first-letter:mr-3 md:first-letter:mt-1 mb-12">{note}</p>
                              </div>
                            );
                          } else {
                            // Default message with couple names
                            const coupleDisplayName = tokenInfo?.couple_names || 'your friends';
                            const defaultNote = `You're adding a recipe to ${coupleDisplayName}'s wedding cookbook. Doesn't have to be fancy—just something you actually make. It'll live in their kitchen forever.`;
                            
                            return (
                              <div>
                                <p className="text-gray-700 text-base lg:text-lg xl:text-xl leading-relaxed font-light md:first-letter:text-6xl md:first-letter:font-serif md:first-letter:float-left md:first-letter:mr-3 md:first-letter:mt-1 mb-12">{defaultNote}</p>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-6">
                      Find your name. Add your recipe. Done.
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
                    className="text-center bg-white"
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
                      const raw = e.target.value;
                      const next = (lastName.length === 0 && raw.length > 0)
                        ? raw.replace(/^./, (c) => c.toUpperCase())
                        : raw;
                      addDebugLog(`✏️ lastName: ${next}`);
                      setLastName(next);
                    }}
                    placeholder=""
                    disabled={searching}
                    className="bg-white"
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
                  className={`px-4 sm:px-8 py-2 rounded-full h-10 min-w-[80px] transition-colors ${
                    !firstName.trim() || searching 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#D4A854] text-white hover:bg-[#c49b4a]'
                  }`}
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

            {/* Name entry when user explicitly chooses "I don't see my name" */}
            {searchCompleted && showNameEntry && (
              <div className="space-y-2 mt-6">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <div className="flex gap-4 items-center">
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const next = (fullName.length === 0 && raw.length > 0)
                        ? raw.replace(/^./, (c) => c.toUpperCase())
                        : raw;
                      setFullName(next);
                    }}
                    placeholder="Your full name"
                    autoComplete="name"
                    className="h-10"
                  />
                  <Button
                    onClick={handleContinueAsNew}
                    disabled={!fullName.trim()}
                    className={`px-4 sm:px-8 py-2 rounded-full h-10 min-w-[100px] transition-colors ${!fullName.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#D4A854] text-white hover:bg-[#c49b4a]'}`}
                  >
                    Continue
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">This is how we'll print your name in the cookbook.</p>
              </div>
            )}

            {/* Search Results */}
            {searchCompleted && !showNameEntry && (
              <div className="border-t border-[#D4A854]/20 pt-6">
                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-medium text-[#2D2D2D] font-serif">
                      That&apos;s you, right?
                    </h3>
                    <div className="space-y-3">
                      {searchResults.map((guest) => (
                        <button
                          key={guest.id}
                          onClick={() => handleGuestSelect(guest)}
                          className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#D4A854]/50 hover:bg-[#FAF7F2] transition-colors text-left bg-white"
                        >
                          <span className="text-[#2D2D2D] font-medium">
                            {guest.first_name} {guest.last_name}
                          </span>
                          <svg 
                            className="w-5 h-5 text-[#D4A854]" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setShowNameEntry(true);
                          setSelectedGuest(null);
                          setFullName('');
                          // Optionally: scroll/focus
                          setTimeout(() => document.getElementById('fullName')?.focus(), 100);
                        }}
                        className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#D4A854]/50 hover:bg-[#FAF7F2] transition-colors text-left bg-white"
                      >
                        <span className="text-[#2D2D2D] font-medium">
                          I don&apos;t see my name
                        </span>
                        <svg 
                          className="w-5 h-5 text-[#D4A854]" 
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
                    <h3 className="text-xl font-medium text-[#2D2D2D] font-serif">
                      Not on the list yet? No problem.
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm">
                      We&apos;ll add you when you submit your recipe.
                    </p>
                    {/* Ask for full name with inline Continue button (visual match to search row) */}
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <div className="flex gap-4 items-center">
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const next = (fullName.length === 0 && raw.length > 0)
                              ? raw.replace(/^./, (c) => c.toUpperCase())
                              : raw;
                            setFullName(next);
                          }}
                          placeholder={firstName || lastName ? `e.g., John ${lastName}` : 'Your full name'}
                          autoComplete="name"
                          className="h-10"
                        />
                        <Button
                          onClick={handleContinueAsNew}
                          disabled={!((fullName || firstName).trim())}
                          className={`px-4 sm:px-8 py-2 rounded-full h-10 min-w-[100px] transition-colors ${!((fullName || firstName).trim()) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#D4A854] text-white hover:bg-[#c49b4a]'}`}
                        >
                          Continue
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">This is how we'll print your name in the cookbook.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}