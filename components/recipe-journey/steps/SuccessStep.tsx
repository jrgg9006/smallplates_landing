"use client";

import React, { useState } from 'react';

interface SuccessStepProps {
  defaultName?: string;
  defaultEmail?: string;
  hasGuestOptIn?: boolean;
  guestOptInEmail?: string;
  onSavePrefs: (name: string | undefined, email: string | undefined, optedIn: boolean) => Promise<void> | void;
}

export default function SuccessStep({ defaultName, defaultEmail, hasGuestOptIn = false, guestOptInEmail, onSavePrefs }: SuccessStepProps) {
  const [email, setEmail] = useState<string>(defaultEmail || '');
  const [optIn, setOptIn] = useState<boolean>(!!defaultEmail);
  const [showEditor, setShowEditor] = useState<boolean>(!defaultEmail);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSavePrefs(undefined, email || undefined, optIn && !!(email || defaultEmail));
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="thanks-heading">
      <div className="text-center space-y-3 max-w-lg mx-auto px-2">
        <div className="w-16 h-16 bg-[#D4A854]/20 rounded-full mx-auto flex items-center justify-center">
          <span className="text-3xl">✓</span>
        </div>
        <h2 id="thanks-heading" className="font-serif text-2xl md:text-3xl font-semibold text-[#2D2D2D]">You&apos;re in the book.</h2>
        <p className="text-gray-600">Your recipe will be a beautiful addition to their kitchen.</p>
        <div className="space-y-4 mt-6">
          <div className="text-left">
            {hasGuestOptIn && guestOptInEmail ? (
              <p className="text-sm text-gray-600">We’ll email your recipe to <span className="font-medium text-gray-800">{guestOptInEmail}</span>.</p>
            ) : (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="h-4 w-4 accent-[#D4A854]" checked={optIn} onChange={(e) => { setOptIn(e.target.checked); setSaved(false); }} />
              Share with me how the plate turned out in the book.
            </label>
            )}

            {!optIn && defaultEmail && (
              <div className="mt-3 text-xs text-gray-500">
                You can enable this later in your profile.
              </div>
            )}

            {!hasGuestOptIn && optIn && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setSaved(false); }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

