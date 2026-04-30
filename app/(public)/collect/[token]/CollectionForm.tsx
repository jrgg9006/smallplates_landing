"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { validateCollectionToken, searchGuestInCollection, getCollectionSocialProof } from '@/lib/supabase/collection';
import SocialProofBanner from '@/components/recipe-journey/SocialProofBanner';
import type { CollectionTokenInfo, Guest } from '@/lib/types/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { captureAttribution, trackEvent, getAttribution } from '@/lib/analytics';

// Reason: Format book_close_date as "Month Dth" for the deadline line, returns null if date is in the past
function formatDeadlineDate(dateString: string): string | null {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    // Reason: Compare date-only (ignore time) to avoid timezone edge cases
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return null;
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    const d = date.getDate();
    const suffix = (d >= 11 && d <= 13) ? 'th' : ['th','st','nd','rd','th','th','th','th','th','th'][d % 10];
    return `${monthName} ${d}${suffix}`;
  } catch {
    return null;
  }
}

const EASE_OUT_QUART: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function CollectionForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const reduceMotion = useReducedMotion();

  const cookbookId = searchParams.get('cookbook');
  const groupId = searchParams.get('group');

  const [tokenInfo, setTokenInfo] = useState<CollectionTokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socialProofCount, setSocialProofCount] = useState<number>(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [fullName, setFullName] = useState('');
  const [showNameEntry, setShowNameEntry] = useState(false);

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('No collection link provided');
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await validateCollectionToken(token, groupId);
        if (error || !data) {
          setError(error || 'Invalid collection link');
        } else {
          setTokenInfo(data);
          if (groupId) {
            const { data: proofData } = await getCollectionSocialProof(groupId);
            if (proofData) setSocialProofCount(proofData.count);
          }
        }
      } catch {
        setError('Failed to validate collection link');
      }
      setLoading(false);
    }
    validateToken();
  }, [token, groupId]);

  useEffect(() => {
    captureAttribution(token);
  }, [token]);

  const handleSearch = async () => {
    if (!tokenInfo || !firstName.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const { data: guest, error } = await searchGuestInCollection(
        tokenInfo.user_id,
        firstName.trim(),
        lastName.trim(),
        groupId
      );
      if (error) {
        setError(error);
      } else {
        setSearchResults(guest || []);
        setSearchCompleted(true);
      }
    } catch {
      setError('Failed to search for guest');
    } finally {
      setSearching(false);
    }
  };

  const handleGuestSelect = (guest: Guest) => {
    trackEvent('start_recipe', { book_id: token, ...getAttribution(token) });
    setSelectedGuest(guest);
    const guestData = {
      id: guest.id,
      firstName: guest.first_name,
      lastName: guest.last_name,
      email: guest.email,
      phone: guest.phone,
      existing: true
    };
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('collectionGuestData', JSON.stringify(guestData));
        if (cookbookId || groupId) {
          sessionStorage.setItem('collectionContext', JSON.stringify({ cookbookId, groupId }));
        }
      }
    } catch { /* ignore */ }
    const queryString = cookbookId ? `?cookbook=${cookbookId}` : groupId ? `?group=${groupId}` : '';
    router.push(`/collect/${token}/recipe${queryString}`);
  };

  const handleContinueAsNew = () => {
    const name = fullName.trim();
    if (!name) return;
    trackEvent('start_recipe', { book_id: token, ...getAttribution(token) });
    const parts = name.split(/\s+/);
    const derivedLast = parts.length > 1 ? parts.pop() as string : '';
    const derivedFirst = parts.length > 0 ? parts.join(' ') : name;
    const guestData = { firstName: derivedFirst.trim(), lastName: derivedLast.trim(), existing: false };
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('collectionGuestData', JSON.stringify(guestData));
        if (cookbookId || groupId) {
          sessionStorage.setItem('collectionContext', JSON.stringify({ cookbookId, groupId }));
        }
      }
    } catch { /* ignore */ }
    const queryString = cookbookId ? `?cookbook=${cookbookId}` : groupId ? `?group=${groupId}` : '';
    router.push(`/collect/${token}/recipe${queryString}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-warm-white-airy flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-honey mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !tokenInfo) {
    return (
      <div className="min-h-screen bg-brand-warm-white-airy flex items-center justify-center">
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

  // Reason: Show closed state when book_closed_by_user is set — no recipes can be added
  if (tokenInfo?.book_closed_by_user) {
    const coupleDisplayName = tokenInfo.couple_names || 'the couple';
    return (
      <div className="min-h-screen bg-brand-warm-white-airy">
        <div className="bg-brand-warm-white-airy border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-center">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image src="/images/SmallPlates_logo_horizontal.png" alt="Small Plates & Co" width={200} height={40} priority />
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <div className="text-center max-w-md">
            {tokenInfo.couple_image_url && (
              <div className="relative w-32 h-32 mx-auto mb-8 rounded-full overflow-hidden">
                <Image
                  src={tokenInfo.couple_image_url}
                  alt="Couple Photo"
                  fill
                  className="object-cover"
                  style={{ objectPosition: `${tokenInfo.couple_image_position_x ?? 50}% ${tokenInfo.couple_image_position_y ?? 50}%` }}
                />
              </div>
            )}
            <h1 className="text-2xl lg:text-3xl font-semibold text-brand-charcoal font-serif mb-4">
              This book has been closed.
            </h1>
            <p className="text-gray-600 text-base lg:text-lg leading-relaxed mb-2">
              {coupleDisplayName}&apos;s cookbook is being created and will be delivered soon.
            </p>
            <p className="text-gray-500 text-sm">Thank you for being part of it.</p>
          </div>
        </div>
      </div>
    );
  }

  const coupleDisplayName = tokenInfo?.couple_names || 'your friends';
  const deadlineFormatted = tokenInfo?.book_close_date ? formatDeadlineDate(tokenInfo.book_close_date) : null;
  const defaultNote = `You're adding a recipe to ${coupleDisplayName}'s wedding cookbook. Doesn't have to be fancy, just something you actually make.`;
  const hasPhoto = Boolean(tokenInfo?.couple_image_url);

  return (
    <div className="min-h-screen bg-brand-warm-white-airy">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-center">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image src="/images/SmallPlates_logo_horizontal.png" alt="Small Plates & Co" width={200} height={40} priority />
          </Link>
        </div>
      </div>

      {/* Mobile book cover hero — couple photo full-bleed with couple names overlaid */}
      {hasPhoto && (
        <div className="lg:hidden relative h-72 w-full overflow-hidden">
          <Image
            src={tokenInfo!.couple_image_url!}
            alt="Couple Photo"
            fill
            sizes="100vw"
            className="object-cover"
            priority
            quality={100}
            style={{ objectPosition: `${tokenInfo?.couple_image_position_x ?? 50}% ${tokenInfo?.couple_image_position_y ?? 50}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <motion.div
            className="absolute bottom-0 left-0 px-5 pb-6"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: EASE_OUT_QUART, delay: reduceMotion ? 0 : 0.15 }}
          >
            <p className="text-[11px] tracking-[0.22em] uppercase text-white/65 font-medium mb-1.5">
              Wedding Cookbook
            </p>
            <h1 className="font-serif text-[2.1rem] font-semibold text-white leading-tight">
              {coupleDisplayName}
            </h1>
          </motion.div>
        </div>
      )}

      {/* Main Content - Two Column Layout */}
      <div className="lg:min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">

        {/* Left Column - Image (desktop only) */}
        <div className="hidden lg:block lg:w-2/5 relative bg-gray-100 h-[calc(100vh-4rem)] p-2">
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white shadow-sm">
            {tokenInfo?.couple_image_url ? (
              <Image
                src={tokenInfo.couple_image_url}
                alt="Couple Photo"
                fill
                sizes="40vw"
                className="object-cover"
                priority
                quality={100}
                style={{ objectPosition: `${tokenInfo?.couple_image_position_x ?? 50}% ${tokenInfo?.couple_image_position_y ?? 50}%` }}
              />
            ) : (
              <Image
                src="/images/onboarding/onboarding_lemon.png"
                alt="Welcome"
                fill
                sizes="40vw"
                className="object-cover"
                priority
              />
            )}
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="w-full lg:w-3/5 flex items-start lg:items-center justify-center px-4 sm:px-6 py-8 lg:py-12 lg:min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md mx-auto">
            <div className="space-y-6">
              <div className="text-left">

                {/* Couple names heading — desktop always visible, mobile only when no photo */}
                <div className={`mb-6 ${hasPhoto ? 'hidden lg:block' : ''}`}>
                  <p className="text-xs tracking-[0.22em] uppercase text-brand-charcoal/50 font-medium mb-2">
                    Wedding Cookbook
                  </p>
                  <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-brand-charcoal leading-tight mb-4">
                    {coupleDisplayName}
                  </h1>
                </div>

                {/* Copy */}
                <div className="mb-6">
                  <p className="text-gray-700 text-base lg:text-lg leading-relaxed font-light mb-12">
                    {tokenInfo?.custom_share_message || defaultNote}
                    {deadlineFormatted && (
                      <><br /><br /><span>Add yours by {deadlineFormatted}.</span></>
                    )}
                  </p>
                </div>

                <SocialProofBanner count={socialProofCount} />

                <div className="text-sm text-gray-500 mb-6">
                  Find your name. Add your recipe. Done.
                </div>
              </div>

              {/* Search Form */}
              <div className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="w-20">
                    <label htmlFor="firstName" className="block text-form-label font-medium text-gray-700 mb-1">
                      First initial
                    </label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value.slice(0, 1).toUpperCase())}
                      placeholder=""
                      disabled={searching}
                      maxLength={1}
                      className="text-center bg-white"
                      autoComplete="given-name"
                      inputMode="text"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="lastName" className="block text-form-label font-medium text-gray-700 mb-1">
                      Last name
                    </label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setLastName(lastName.length === 0 && raw.length > 0 ? raw.replace(/^./, (c) => c.toUpperCase()) : raw);
                      }}
                      placeholder=""
                      disabled={searching}
                      className="bg-white"
                      autoComplete="family-name"
                      inputMode="text"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={!firstName.trim() || searching}
                    className={`px-4 sm:px-8 py-2 rounded-full h-10 min-w-[80px] transition-colors ${
                      !firstName.trim() || searching
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-brand-honey text-white hover:bg-brand-honey-dark'
                    }`}
                  >
                    {searching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>
              </div>

              {/* Name entry when user explicitly chooses "I don't see my name" */}
              {searchCompleted && showNameEntry && (
                <div className="space-y-2 mt-6">
                  <label htmlFor="fullName" className="block text-form-label font-medium text-gray-700 mb-1">Name</label>
                  <div className="flex gap-4 items-center">
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setFullName(fullName.length === 0 && raw.length > 0 ? raw.replace(/^./, (c) => c.toUpperCase()) : raw);
                      }}
                      placeholder="Your full name"
                      autoComplete="name"
                      className="h-10 bg-white"
                    />
                    <Button
                      onClick={handleContinueAsNew}
                      disabled={!fullName.trim()}
                      className={`px-4 sm:px-8 py-2 rounded-full h-10 min-w-[100px] transition-colors ${
                        !fullName.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-honey text-white hover:bg-brand-honey-dark'
                      }`}
                    >
                      Continue
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">This is how we&apos;ll print your name in the cookbook.</p>
                </div>
              )}

              {/* Search Results */}
              {searchCompleted && !showNameEntry && (
                <div className="border-t border-brand-honey/20 pt-6">
                  {searchResults.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-xl font-medium text-brand-charcoal font-serif">
                        That&apos;s you, right?
                      </h3>
                      <div className="space-y-3">
                        {searchResults.map((guest) => (
                          <button
                            key={guest.id}
                            onClick={() => handleGuestSelect(guest)}
                            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-honey/50 hover:bg-brand-warm-white-warm transition-colors text-left bg-white"
                          >
                            <span className="text-brand-charcoal font-medium">
                              {guest.first_name} {guest.last_name}
                            </span>
                            <svg className="w-5 h-5 text-brand-honey" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            setShowNameEntry(true);
                            setSelectedGuest(null);
                            setFullName('');
                            setTimeout(() => document.getElementById('fullName')?.focus(), 100);
                          }}
                          className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-honey/50 hover:bg-brand-warm-white-warm transition-colors text-left bg-white"
                        >
                          <span className="text-brand-charcoal font-medium">I don&apos;t see my name</span>
                          <svg className="w-5 h-5 text-brand-honey" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-xl font-medium text-brand-charcoal font-serif">
                        Not on the list yet? No problem.
                      </h3>
                      <p className="text-gray-600 mb-4 text-sm">
                        We&apos;ll add you when you submit your recipe.
                      </p>
                      <div className="space-y-2">
                        <label htmlFor="fullName" className="block text-form-label font-medium text-gray-700 mb-1">Name</label>
                        <div className="flex gap-4 items-center">
                          <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setFullName(fullName.length === 0 && raw.length > 0 ? raw.replace(/^./, (c) => c.toUpperCase()) : raw);
                            }}
                            placeholder={firstName || lastName ? `e.g., John ${lastName}` : 'Your full name'}
                            autoComplete="name"
                            className="h-10 bg-white"
                          />
                          <Button
                            onClick={handleContinueAsNew}
                            disabled={!((fullName || firstName).trim())}
                            className={`px-4 sm:px-8 py-2 rounded-full h-10 min-w-[100px] transition-colors ${
                              !((fullName || firstName).trim()) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand-honey text-white hover:bg-brand-honey-dark'
                            }`}
                          >
                            Continue
                          </Button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">This is how we&apos;ll print your name in the cookbook.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
