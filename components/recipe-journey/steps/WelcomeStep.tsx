"use client";

import React, { useState } from 'react';
import RecipeTipsModal from '@/components/recipe-journey/RecipeTipsModal';

interface WelcomeStepProps {
  creatorName: string;
}

const HOW_IT_WORKS = [
  'You add your recipe here.',
  'We design and print the book.',
  'It ships to their door.',
];

export default function WelcomeStep({ creatorName: _creatorName }: WelcomeStepProps) {
  const [tipsOpen, setTipsOpen] = useState(false);

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="welcome-heading">
      <div className="text-left px-4 md:px-6 max-w-md">
        <h1 id="welcome-heading" className="font-serif text-3xl md:text-4xl font-semibold text-brand-charcoal leading-tight">
          You&apos;re in!
        </h1>

        <p className="type-body mt-4">
          We&apos;re creating a real hardcover cookbook. Printed and shipped to their door.
        </p>

        <ol className="mt-8 space-y-3" role="list" aria-label="How it works">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={i} className="flex items-baseline gap-3">
              <span className="text-brand-honey font-medium text-base w-5 shrink-0 tabular-nums">{i + 1}</span>
              <span className="text-gray-600 text-base">{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-xs text-gray-400">
          <button
            type="button"
            onClick={() => setTipsOpen(true)}
            className="underline hover:text-gray-600 transition-colors"
          >
            Need ideas?
          </button>
        </p>
      </div>

      <RecipeTipsModal isOpen={tipsOpen} onClose={() => setTipsOpen(false)} />
    </div>
  );
}
