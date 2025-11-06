"use client";

import React from 'react';

interface IntroInfoStepProps {
  onContinue: () => void;
  onBack: () => void;
}

export default function IntroInfoStep({ onContinue, onBack }: IntroInfoStepProps) {
  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="intro-hero-heading">
      <div className="text-center px-4 md:px-6">
        <h2 id="intro-hero-heading" className="font-serif text-3xl md:text-4xl font-semibold text-gray-900">
          So forget about <span className="line-through">perfect</span> recipes
        </h2>
        <p className="mt-4 text-base md:text-xl text-gray-600 max-w-[38rem] mx-auto">
          <span className="opacity-100">Just share something YOU love — breakfast, a drink, your favorite dinner ... anything!</span> ✨
        </p>
      </div>
    </div>
  );
}


