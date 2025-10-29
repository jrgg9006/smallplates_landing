"use client";

import React, { useState } from 'react';

interface SuccessStepProps {
  defaultName?: string;
  defaultEmail?: string;
  onSavePrefs: (name: string | undefined, email: string | undefined, optedIn: boolean) => Promise<void> | void;
}

export default function SuccessStep({ defaultName, defaultEmail, onSavePrefs }: SuccessStepProps) {
  const [name, setName] = useState<string>(defaultName || '');
  const [email, setEmail] = useState<string>(defaultEmail || '');
  const [optIn, setOptIn] = useState<boolean>(!!defaultEmail);
  const [showEditor, setShowEditor] = useState<boolean>(!defaultEmail);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSavePrefs(name || undefined, email || undefined, optIn && !!(email || defaultEmail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="thanks-heading">
      <div className="text-center space-y-3 max-w-lg mx-auto px-2">
        <div className="text-5xl">🎉</div>
        <h2 id="thanks-heading" className="font-serif text-2xl md:text-3xl font-semibold text-gray-900">Thank you for your recipe!</h2>
        <p className="text-gray-600">It will be a wonderful addition to the cookbook.</p>
        <div className="space-y-4 mt-6">
          <div className="rounded-xl border border-gray-200 p-4 text-left">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className="h-4 w-4" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
              Email me my finalized recipe with the image.
            </label>

            {!showEditor && defaultEmail && (
              <div className="mt-3 text-xs text-gray-500">
                We&apos;ll use <span className="font-medium text-gray-700">{defaultEmail}</span>.{' '}
                <button type="button" className="underline underline-offset-2 hover:text-gray-700" onClick={() => setShowEditor(true)}>Edit contact info</button>
              </div>
            )}

            {showEditor && (
              <div className="mt-4 grid grid-cols-1 gap-3">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={saving}
                />
                <input
                  type="email"
                  placeholder="Your email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={saving}
                />
              </div>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save preferences'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


