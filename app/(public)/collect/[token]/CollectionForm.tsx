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
      description: 'Share a treasured plate to be included in their book'
    };
  } else {
    // Single person - extract first name
    const firstName = fullName.split(' ')[0] || '';
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

    // Store guest data AND context in session storage for the recipe form with error handling
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('collectionGuestData', JSON.stringify(guestData));
        // Store cookbook/group context as backup
        if (cookbookId || groupId) {
          sessionStorage.setItem('collectionContext', JSON.stringify({ cookbookId, groupId }));
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
          sessionStorage.setItem('collectionContext', JSON.stringify({ cookbookId, groupId }));
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
        <div className="hidden lg:block lg:w-2/5 relative bg-gray-100 h-[calc(100vh-4rem)] p-2">
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            <Image
              src="/images/collect/collect_1.jpg"
              alt="Small Plates Cookbook Recipe Collection"
              fill
              sizes="40vw"
              className="object-contain"
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
                  <div className="text-center lg:text-left">
                    <h1 className="text-3xl font-semibold text-gray-900 mb-4">
                      {personalizedMessage.beforeName}
                      {personalizedMessage.name && (
                        <span className="font-semibold text-gray-900 mx-1">
                          {personalizedMessage.name}
                        </span>
                      )}
                      {personalizedMessage.afterName}
                    </h1>
                    <p className="text-gray-600 mb-6">
                      {personalizedMessage.description}
                    </p>
                    
                    {/* Personal Message from Share Collection Modal */}
                    <div className="mb-6">
                      <div>
                        {(() => {
                          // Check if we have the new separated fields
                          if (tokenInfo?.custom_share_signature !== undefined) {
                            // New format with separated fields
                            const note = tokenInfo.custom_share_message || 
                              `I'm putting together a book with my favorite people and their plates.
If there's one dish you love to make, I'd love to add it — anything goes.`;
                            const signature = tokenInfo.custom_share_signature || userName || '(Your friend)';
                            
                            return (
                              <div>
                                <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light md:first-letter:text-6xl md:first-letter:font-serif md:first-letter:float-left md:first-letter:mr-3 md:first-letter:mt-1 mb-3">{note}</p>
                                <div className="font-serif italic text-xl md:text-2xl text-gray-700 mt-6 mb-12">— {signature}</div>
                              </div>
                            );
                          } else {
                            // Legacy format - parse combined message
                            const message = tokenInfo?.custom_share_message || 
                              (userName 
                                ? `I'm putting together a book with my favorite people and their plates.
If there's one dish you love to make, I'd love to add it — anything goes.



— ${userName}`
                                : `I'm putting together a book with my favorite people and their plates.
If there's one dish you love to make, I'd love to add it — anything goes.



— (Your friend)`
                              );
                            
                            // Parse message to separate note and signature
                            const signatureMatch = message.match(/—\s*(.+)$/);
                            if (signatureMatch) {
                              const signature = signatureMatch[1].trim();
                              const note = message.replace(/\n*—\s*.+$/, '').trim();
                              return (
                                <div>
                                  <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light md:first-letter:text-6xl md:first-letter:font-serif md:first-letter:float-left md:first-letter:mr-3 md:first-letter:mt-1 mb-3">{note}</p>
                                  <div className="font-serif italic text-xl md:text-2xl text-gray-700 mt-6 mb-12">— {signature}</div>
                                </div>
                              );
                            } else {
                              return <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light md:first-letter:text-6xl md:first-letter:font-serif md:first-letter:float-left md:first-letter:mr-3 md:first-letter:mt-1">{message}</p>;
                            }
                          }
                        })()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-6">
                      Let&apos;s find your name so you can add your plate
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
                      const raw = e.target.value;
                      const next = (lastName.length === 0 && raw.length > 0)
                        ? raw.replace(/^./, (c) => c.toUpperCase())
                        : raw;
                      addDebugLog(`✏️ lastName: ${next}`);
                      setLastName(next);
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
                  className={`px-4 sm:px-8 py-2 rounded-full h-10 min-w-[80px] transition-colors ${
                    !firstName.trim() || searching 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-black text-white hover:bg-gray-800'
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
                    className={`px-4 sm:px-8 py-2 rounded-full h-10 min-w-[100px] transition-colors ${!fullName.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    Continue
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">This is how we’ll print your name in the cookbook.</p>
              </div>
            )}

            {/* Search Results */}
            {searchCompleted && !showNameEntry && (
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
                        onClick={() => {
                          setShowNameEntry(true);
                          setSelectedGuest(null);
                          setFullName('');
                          // Optionally: scroll/focus
                          setTimeout(() => document.getElementById('fullName')?.focus(), 100);
                        }}
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
                    <h3 className="text-sm font-medium text-gray-900">
                      Welcome! You&apos;re not in the list yet
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm">
                      No worries! We&apos;ll add you when you submit your plate.
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
                          className={`px-4 sm:px-8 py-2 rounded-full h-10 min-w-[100px] transition-colors ${!((fullName || firstName).trim()) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
                        >
                          Continue
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">This is how we’ll print your name in the cookbook.</p>
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