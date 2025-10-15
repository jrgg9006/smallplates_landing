"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Image from 'next/image';
import { validateCollectionToken, searchGuestInCollection } from '@/lib/supabase/collection';
import type { CollectionTokenInfo, Guest } from '@/lib/types/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CollectionLandingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  // State management
  const [tokenInfo, setTokenInfo] = useState<CollectionTokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Guest search state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Guest | null>(null);
  const [searchCompleted, setSearchCompleted] = useState(false);

  // Validate token on component mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('No collection link provided');
        setLoading(false);
        return;
      }

      const { data, error } = await validateCollectionToken(token);
      
      if (error || !data) {
        setError(error || 'Invalid collection link');
      } else {
        setTokenInfo(data);
      }
      
      setLoading(false);
    }

    validateToken();
  }, [token]);

  // Handle guest search
  const handleSearch = async () => {
    if (!tokenInfo || !firstName.trim()) {
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
        setSearchResults(guest);
        setSearchCompleted(true);
      }
    } catch (err) {
      setError('Failed to search for guest');
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Handle continue to recipe form
  const handleContinue = () => {
    const guestData = searchResults ? {
      id: searchResults.id,
      firstName: searchResults.first_name,
      lastName: searchResults.last_name,
      email: searchResults.email,
      phone: searchResults.phone,
      existing: true
    } : {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      existing: false
    };

    // Store guest data in session storage for the recipe form
    sessionStorage.setItem('collectionGuestData', JSON.stringify(guestData));
    
    // Navigate to recipe form
    router.push(`/collect/${token}/recipe`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-center">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates & Co"
            width={200}
            height={40}
            priority
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Find Yourself</CardTitle>
            <p className="text-center text-gray-600">
              Type your first and last name to see if you're already in the guest list
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name"
                    disabled={searching}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Your last name"
                    disabled={searching}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSearch}
                disabled={!firstName.trim() || searching}
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Find Me
                  </>
                )}
              </Button>
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
                {searchResults ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h3 className="text-lg font-medium text-green-900 mb-2">
                      Great! We found you
                    </h3>
                    <p className="text-green-700 mb-4">
                      Hi <strong>{searchResults.first_name} {searchResults.last_name}</strong>! 
                      Ready to share a recipe with {tokenInfo?.user_name}?
                    </p>
                    <Button 
                      onClick={handleContinue}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      Continue to Recipe Form
                    </Button>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">
                      Welcome! You're not in the list yet
                    </h3>
                    <p className="text-blue-700 mb-4">
                      No worries! We'll add you when you submit your recipe.
                      {lastName.trim() && (
                        <span> We'll use <strong>{firstName} {lastName}</strong> as your name.</span>
                      )}
                      {!lastName.trim() && (
                        <span> We'll use <strong>{firstName}</strong> as your name.</span>
                      )}
                    </p>
                    <Button 
                      onClick={handleContinue}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Continue to Recipe Form
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            After finding yourself, you'll be able to submit your favorite recipe 
            to be included in {tokenInfo?.user_name}'s collection.
          </p>
        </div>
      </div>
    </div>
  );
}