"use client";

import React from 'react';

interface SocialProofBannerProps {
  count: number;
}

export default function SocialProofBanner({ count }: SocialProofBannerProps) {
  // Don't render anything if fewer than 3 recipes (avoid "empty restaurant" effect)
  if (count < 3) {
    return null;
  }
  
  // Determine the message based on count
  const message = count >= 10 
    ? `${count} recipes and counting. Don't miss out!`
    : 'The book is filling up. Add yours now!';
  
  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
      
      <div className="my-6 animate-fade-in">
        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-lg" aria-hidden="true"></span>
            <span className="text-[#2D2D2D] text-sm font-medium">
              {message}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}