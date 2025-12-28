"use client";

import React, { useState } from 'react';
import RecipeTipsModal from '../RecipeTipsModal';

interface WelcomeStepProps {
  creatorName: string;
}

export default function WelcomeStep({ creatorName }: WelcomeStepProps) {
  const [showTips, setShowTips] = useState(false);

  return (
    <>
      <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="welcome-heading">
        <div className="text-left px-4 md:px-6">
          <h1 id="welcome-heading" className="font-serif text-3xl md:text-4xl font-semibold text-[#2D2D2D]">
            You&apos;re in!
          </h1>
          <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light mt-4">
            This book isn&apos;t about perfect recipes—<br />
            it&apos;s about you being in their kitchen. Forever.
          </p>
          
          <button 
            onClick={() => setShowTips(true)}
            className="text-[#9A9590] hover:text-[#2D2D2D] text-base mt-6 underline underline-offset-4 decoration-1 transition-colors"
          >
            Not sure what to send? We&apos;ve got ideas.
          </button>
        </div>
      </div>

      <RecipeTipsModal 
        isOpen={showTips} 
        onClose={() => setShowTips(false)} 
      />
    </>
  );
}

