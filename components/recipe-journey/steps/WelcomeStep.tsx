"use client";

import React, { useState } from 'react';
import RecipeTipsModal from '../RecipeTipsModal';

interface WelcomeStepProps {
  creatorName: string;
}

const RANDOM_TIPS = [
  "Your mom's pasta counts. Even if you've never made it yourself.",
  "The thing you make when you're tired? That's a recipe.",
  "Your Uber Eats order is valid. Seriously.",
  "Cheese and crackers at midnight counts.",
  "The dish you always bring to parties? Perfect."
];

export default function WelcomeStep({ creatorName }: WelcomeStepProps) {
  const [showTips, setShowTips] = useState(false);
  const [randomTip] = useState(() => 
    RANDOM_TIPS[Math.floor(Math.random() * RANDOM_TIPS.length)]
  );

  return (
    <>
      <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="welcome-heading">
        <div className="text-left px-4 md:px-6 max-w-md">
          <h1 id="welcome-heading" className="font-serif text-3xl md:text-4xl font-semibold text-[#2D2D2D]">
            You&apos;re in!
          </h1>
          <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-light mt-4">
            This book isn&apos;t about perfect recipes—<br />
            it&apos;s about you being in their kitchen. Forever.
          </p>
          
          {/* Random Tip Box */}
          <div className="mt-6 bg-[#FAF7F2] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-base font-light flex-shrink-0" aria-hidden="true">💡</span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-[#2D2D2D] leading-relaxed">
                  {randomTip}
                </p>
                <button 
                  onClick={() => setShowTips(true)}
                  className="text-[#D4A854] hover:text-[#b8923a] text-sm mt-2 font-medium transition-colors"
                >
                  More ideas →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecipeTipsModal 
        isOpen={showTips} 
        onClose={() => setShowTips(false)} 
      />
    </>
  );
}

