"use client";

import React from 'react';

interface WelcomeStepProps {
  creatorName: string;
}

export default function WelcomeStep({ creatorName }: WelcomeStepProps) {
  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="welcome-heading">
      <div className="text-left px-4 md:px-6">
        <h1 id="welcome-heading" className="font-serif text-3xl md:text-4xl font-semibold text-[#2D2D2D]">
          You&apos;re in!
        </h1>
        <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light mt-4">
          This book isn&apos;t about perfect recipes — <br /> it&apos;s about sharing something of yourself with the people who matter.
        </p>
      </div>
    </div>
  );
}

