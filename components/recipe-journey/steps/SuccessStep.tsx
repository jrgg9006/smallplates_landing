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

export default function SuccessStep({ defaultName, defaultEmail, hasGuestOptIn = false, guestOptInEmail, onSavePrefs, coupleImageUrl, recipeName, coupleNames }: SuccessStepProps) {
  const [email, setEmail] = useState<string>(defaultEmail || '');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

        {/* Bottom divider */}
        <div className="w-full h-px bg-gray-200 mt-8" />
      </div>
    </div>
  );
}
