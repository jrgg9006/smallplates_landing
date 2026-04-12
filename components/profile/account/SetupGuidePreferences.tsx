'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useProfileOnboarding } from '@/lib/contexts/ProfileOnboardingContext';

export function SetupGuidePreferences() {
  const { permanentlyDismissedGroupIds, restoreAllDismissedChecklists } = useProfileOnboarding();
  const hiddenCount = permanentlyDismissedGroupIds.length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[hsl(var(--brand-honey))]" />
        Your playbook
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        The little progress widget that shows up on each of your books.
      </p>

      {hiddenCount === 0 ? (
        <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-4 py-3">
          Your playbook is visible on all your books. You can hide it anytime from inside the
          guide.
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4 bg-[hsl(var(--brand-warm-white))] border border-[hsl(var(--brand-border))] rounded-md px-4 py-3">
          <div className="text-sm text-gray-700 flex-1">
            <p className="font-medium text-gray-900 mb-0.5">
              Hidden on {hiddenCount} {hiddenCount === 1 ? 'book' : 'books'}
            </p>
            <p className="text-gray-500">Want it back on all of them?</p>
          </div>
          <button
            type="button"
            onClick={restoreAllDismissedChecklists}
            className="flex-shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-full bg-[hsl(var(--brand-honey))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-honey-dark))] transition-colors"
          >
            Show again
          </button>
        </div>
      )}
    </div>
  );
}
