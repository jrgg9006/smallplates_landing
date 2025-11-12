'use client';

import React from 'react';

interface OnboardingBadgeProps {
  stepNumber: number;
  title: string;
  message: string;
  className?: string;
}

export function OnboardingBadge({ 
  stepNumber, 
  title, 
  message,
  className = '' 
}: OnboardingBadgeProps) {
  return (
    <div 
      className={`p-5 rounded-xl shadow-lg relative z-10 ring-1 ${className}`}
      style={{ 
        backgroundColor: '#464665',
        borderColor: '#5a5a7a',
        ringColor: '#5a5a7a'
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border" style={{ borderColor: '#6b6b8a' }}>
            <span className="text-sm font-light tracking-tight" style={{ color: '#464665' }}>{stepNumber}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-2">
            <span className="text-xs font-light text-white uppercase tracking-wider">
              {title}
            </span>
          </div>
          <p className="text-sm text-white leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

