"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RecipeJourneyWrapper from '@/components/recipe-journey/RecipeJourneyWrapper';
import type { CollectionTokenInfo } from '@/lib/types/database';

interface GuestData {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  existing: boolean;
}

export default function PreviewPage() {
  const router = useRouter();
  const [showRecipeJourney, setShowRecipeJourney] = useState(false);
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  
  // Mock data
  const mockTokenInfo: CollectionTokenInfo = {
    user_id: 'preview-user',
    user_name: 'Your Name',
    raw_full_name: 'Your Name',
    custom_share_message: null,
    custom_share_signature: null,
    token: 'preview-token',
    is_valid: true
  };

  // Guest search state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [fullName, setFullName] = useState('');

  const handleSearch = async () => {
    if (!firstName.trim()) return;
    
    setSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      setSearching(false);
      setSearchCompleted(true);
      // Always simulate "not found" for preview
    }, 1000);
  };

  const handleContinueAsNew = () => {
    let name = fullName.trim();
    if (!name) return;
    
    const parts = name.split(/\s+/);
    const derivedLast = parts.length > 1 ? parts.pop() || '' : '';
    const derivedFirst = parts.length > 0 ? parts.join(' ') : name;
    
    const newGuestData = {
      firstName: derivedFirst.trim(),
      lastName: derivedLast.trim(),
      existing: false
    };
    
    // Store guest data for the recipe journey (it expects this)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('collectionGuestData', JSON.stringify(newGuestData));
      // Set a flag to indicate this is preview mode
      sessionStorage.setItem('isPreviewMode', 'true');
    }
    
    setGuestData(newGuestData);
    setShowRecipeJourney(true);
    
    // Scroll to top when transitioning to recipe journey, especially on mobile
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleBackToSearch = () => {
    setShowRecipeJourney(false);
    setGuestData(null);
    // Clean up sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('collectionGuestData');
      sessionStorage.removeItem('isPreviewMode');
    }
    // Reset search state
    setSearchCompleted(false);
    setFirstName('');
    setLastName('');
    setFullName('');
  };

  if (showRecipeJourney && guestData) {
    return (
      <div className="min-h-screen bg-white relative">
        {/* Preview indicator in top right corner of header */}
        <div className="fixed top-4 right-6 z-50 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
          Preview Demo
        </div>
        
        <RecipeJourneyWrapper
          tokenInfo={mockTokenInfo}
          guestData={guestData}
          token="preview-token"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Preview indicator in top right corner of header */}
      <div className="fixed top-4 right-6 z-50 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
        Preview Demo
      </div>
      
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
              <div className="text-center lg:text-left">
                <h1 className="text-3xl font-semibold text-gray-900 mb-4">
                  <span className="font-semibold text-gray-900 mx-1">[Your Name]</span>
                  is creating a cookbook, and would love to include your plate!
                </h1>
                <div className="text-sm text-gray-500 mb-6">
                  Please enter your first initial and last name to find yourself
                </div>
              </div>

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
                        setFirstName(value);
                      }}
                      placeholder=""
                      disabled={searching}
                      maxLength={1}
                      className="text-center"
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
                        setLastName(next);
                      }}
                      placeholder=""
                      disabled={searching}
                    />
                  </div>
                  <Button 
                    onClick={handleSearch}
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

              {/* Search Results - Always show "not found" for preview */}
              {searchCompleted && (
                <div className="border-t pt-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      Welcome! You&apos;re not in the list yet
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm">
                      No worries! We&apos;ll add you when you submit your plate.
                    </p>
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
                      <p className="text-xs text-gray-500 mt-1">This is how we&apos;ll print your name in the cookbook.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}