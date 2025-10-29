"use client";

import React from 'react';

interface WelcomeStepProps {
  creatorName: string;
}

export default function WelcomeStep({ creatorName }: WelcomeStepProps) {
  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="welcome-heading">
      <div className="text-center px-2">
        <h1 id="welcome-heading" className="font-serif text-3xl md:text-4xl font-semibold text-gray-900">
          Congratulations! You&apos;ll be part of{' '}
          <span className="font-serif text-5xl font-bold text-black mx-1">
            {creatorName}&apos;s
          </span>{' '}
          amazing Cookbook!
        </h1>
      </div>
    </div>
  );
}


