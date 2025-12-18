"use client";

import React from 'react';
import Image from 'next/image';

interface WelcomeStepProps {
  creatorName: string;
  coupleImageUrl?: string | null;
}

export default function WelcomeStep({ creatorName, coupleImageUrl }: WelcomeStepProps) {
  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="welcome-heading">
      <div className="text-left px-4 md:px-6">
        {/* Couple Image for mobile only - desktop shows in left panel */}
        {coupleImageUrl && (
          <div className="lg:hidden flex justify-center mb-6">
            <div className="relative w-48 h-32 rounded-xl overflow-hidden shadow-md">
              <Image
                src={coupleImageUrl}
                alt="Couple"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}
        
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

