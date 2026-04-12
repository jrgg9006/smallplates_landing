"use client";

import React, { useState } from 'react';

interface SuccessStepProps {
  defaultName?: string;
  defaultEmail?: string;
  hasGuestOptIn?: boolean;
  guestOptInEmail?: string;
  onSavePrefs: (name: string | undefined, email: string | undefined, optedIn: boolean) => Promise<void> | void;
  coupleImageUrl?: string | null;
  recipeName?: string;
  coupleNames?: string | null;
}

type NewsletterStatus = 'idle' | 'submitting' | 'done' | 'error';

export default function SuccessStep({ defaultName, defaultEmail, hasGuestOptIn = false, guestOptInEmail, onSavePrefs, coupleImageUrl, recipeName, coupleNames }: SuccessStepProps) {
  const [email, setEmail] = useState<string>(defaultEmail || '');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<NewsletterStatus>('idle');

  // Reason: The newsletter uses whichever email is already available — the guest's
  // opted-in book notification email, or the email they typed into the input above.
  const availableEmail = hasGuestOptIn && guestOptInEmail
    ? guestOptInEmail
    : (email.trim() || defaultEmail || '').trim();

  const subscribeToNewsletter = async (emailToUse: string) => {
    setNewsletterStatus('submitting');
    try {
      const res = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse, source: 'collection_flow' }),
      });
      if (!res.ok) {
        setNewsletterStatus('error');
        return;
      }
      setNewsletterStatus('done');
    } catch {
      setNewsletterStatus('error');
    }
  };

  const handleNewsletterToggle = (checked: boolean) => {
    setNewsletterOptIn(checked);
    // Reason: Only fire on check. Unchecking just flips local state — we don't
    // silently unsubscribe from a single UI toggle.
    if (checked && availableEmail && newsletterStatus !== 'submitting' && newsletterStatus !== 'done') {
      void subscribeToNewsletter(availableEmail);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSavePrefs(undefined, email || undefined, !!(email || defaultEmail));
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  // Reason: Extract first name from coupleNames for the email CTA
  const creatorFirstName = coupleNames?.split(/[&,]/)[0]?.trim().split(' ')[0] || '';

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="thanks-heading">
      <div className="text-center max-w-md mx-auto px-4">

        {/* Checkmark */}
        <div className="text-[#D4A854] text-2xl mb-6 mt-8">{'\u2713'}</div>

        {/* Main heading */}
        <h2 id="thanks-heading" className="font-serif text-4xl md:text-[2.5rem] font-semibold text-[#2D2D2D] tracking-tight">
          {recipeName ? (
            <>Your <em className="text-[#4a4a4a]">{recipeName}</em> is in the book.</>
          ) : (
            <>You&apos;re in the book.</>
          )}
        </h2>

        {coupleNames && (
          <p className="text-xs tracking-[0.25em] uppercase text-[#D4A854]/70 mt-5 font-medium">
            {coupleNames}
          </p>
        )}

        {/* Divider */}
        <div className="w-8 h-[2px] bg-[#2D2D2D] mx-auto my-8" />

        {/* Divider */}
        <div className="w-full h-px bg-gray-200 my-8" />

        {/* Email section */}
        <div className="space-y-3">
          {hasGuestOptIn && guestOptInEmail ? (
            <p className="text-sm text-gray-500">
              {"We'll send you a photo when "}{creatorFirstName || 'they'}{" get"}{creatorFirstName ? 's' : ''}{" the book."}
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Share with me how it turned out in the book.
              </p>
              <div className="flex items-center gap-2 mt-4 max-w-sm mx-auto">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setSaved(false); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#D4A854] transition-colors"
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
                  disabled={saving || (!email && !defaultEmail)}
                >
                  {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Newsletter opt-in — sits tight below the email input, same width, feels like part of the same form group */}
        <div className="mt-3 max-w-sm mx-auto">
          <label
            className={`flex items-start gap-3 select-none text-left ${availableEmail && newsletterStatus !== 'done' ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <input
              type="checkbox"
              checked={newsletterOptIn}
              onChange={(e) => handleNewsletterToggle(e.target.checked)}
              disabled={newsletterStatus === 'submitting' || newsletterStatus === 'done' || !availableEmail}
              className="peer sr-only"
            />
            <span className="relative mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border border-gray-300 bg-white transition-all peer-checked:bg-[#D4A854] peer-checked:border-[#D4A854] peer-hover:border-[#D4A854] peer-disabled:opacity-40 peer-focus-visible:ring-2 peer-focus-visible:ring-[#D4A854]/30 peer-focus-visible:ring-offset-1">
              {newsletterOptIn && (
                <svg
                  viewBox="0 0 12 12"
                  className="h-3 w-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2.5 6.5l2.5 2.5 4.5-5.5" />
                </svg>
              )}
            </span>
            <span className="text-[12px] leading-[1.5] flex-1">
              {newsletterStatus === 'done' ? (
                <span className="text-[#D4A854]">You&apos;re on the list. First one lands soon.</span>
              ) : newsletterStatus === 'error' ? (
                <span className="text-[#C4856C]">Try again later.</span>
              ) : newsletterStatus === 'submitting' ? (
                <span className="text-gray-500">Adding you...</span>
              ) : (
                <span className="text-gray-500">
                  Add me to the newsletter and get our top 5 recipes people actually sent in. You don&apos;t want to miss it.
                </span>
              )}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
