'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { OnboardingSteps } from '@/lib/contexts/ProfileOnboardingContext';

interface OnboardingResumeProps {
  completedSteps: OnboardingSteps[];
  onResume: () => void;
  onDismiss: () => void;
}

const TOTAL_STEPS = 3;

export function OnboardingResume({ completedSteps, onResume, onDismiss }: OnboardingResumeProps) {
  const completedCount = completedSteps.length;
  const progressPercent = (completedCount / TOTAL_STEPS) * 100;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl">🚀</div>
            <div>
              <h3 className="font-semibold text-gray-900">Complete Your Setup</h3>
              <p className="text-sm text-gray-600">
                Get the most out of Small Plates with these quick steps
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>{completedCount} of {TOTAL_STEPS} steps completed</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 lg:flex-col lg:gap-2">
          <Button 
            onClick={onResume}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm"
          >
            {completedCount === 0 ? 'Start setup' : 'Continue setup'}
          </Button>
          <button 
            onClick={onDismiss}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}