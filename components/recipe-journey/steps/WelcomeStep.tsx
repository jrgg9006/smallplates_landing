"use client";

import React from 'react';

interface WelcomeStepProps {
  creatorName: string;
}

export default function WelcomeStep({ creatorName }: WelcomeStepProps) {
  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="welcome-heading">
      <div className="text-center px-4 md:px-6">
        <h1 id="welcome-heading" className="font-serif text-3xl md:text-4xl font-semibold text-gray-900">
          Congratulations! You&apos;ll be part of{' '}
          <span className="font-serif text-3xl font-semibold md:text-4xl text-black mx-1">
            {creatorName}&apos;s
          </span>{' '}
          amazing Book!
        </h1>
        <p className="mt-4 text-base md:text-xl text-gray-600 max-w-[38rem] mx-auto">
          This book isn&apos;t about perfect recipes — it&apos;s about the people who make them special.
        </p>
      </div>
    </div>
  );
}

