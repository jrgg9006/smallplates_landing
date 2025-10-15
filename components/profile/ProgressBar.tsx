"use client";

import React from "react";

interface ProgressBarProps {
  current: number;        // Current number of recipes collected
  goal: number;          // Target number of recipes
  loading?: boolean;     // Loading state
}

/**
 * Progress bar component for recipe collection
 * Shows visual progress towards recipe goal with elegant design
 * 
 * Args:
 *   current (number): Current recipes collected
 *   goal (number): Target recipes from onboarding
 *   loading (boolean): Show loading state
 */
export function ProgressBar({ current, goal, loading = false }: ProgressBarProps) {
  // Calculate progress percentage (capped at 100%)
  const progressPercentage = Math.min((current / goal) * 100, 100);
  
  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="space-y-3">
          {/* Loading skeleton for progress text */}
          <div className="text-center">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mx-auto"></div>
          </div>
          
          {/* Loading skeleton for progress bar */}
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse">
              <div className="bg-gray-300 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="space-y-3">
        {/* Progress Text */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">
            <span className="text-gray-900 font-semibold">{current}</span>
            {' '}of{' '}
            <span className="text-gray-900 font-semibold">{goal}</span>
            {' '}recipes collected
          </p>
        </div>
        
        {/* Progress Bar Container */}
        <div className="relative">
          {/* Background bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            {/* Progress fill */}
            <div 
              className="bg-gradient-to-r from-gray-800 to-black h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Subtle shine effect */}
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
            </div>
          </div>
          
          {/* Progress percentage label (only show if > 5% to avoid clutter) */}
          {progressPercentage > 5 && (
            <div 
              className="absolute top-0 h-2 flex items-center justify-end pr-1"
              style={{ width: `${progressPercentage}%` }}
            >
              <span className="text-xs font-medium text-white text-shadow">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          )}
        </div>

        {/* Motivational message */}
        <div className="text-center">
          {progressPercentage >= 100 ? (
            <p className="text-xs text-green-600 font-medium">
              🎉 Congratulations! You've reached your recipe goal!
            </p>
          ) : progressPercentage >= 75 ? (
            <p className="text-xs text-blue-600 font-medium">
              Almost there! Keep collecting those recipes
            </p>
          ) : progressPercentage >= 50 ? (
            <p className="text-xs text-purple-600 font-medium">
              Great progress! You're halfway to your goal
            </p>
          ) : progressPercentage >= 25 ? (
            <p className="text-xs text-orange-600 font-medium">
              Nice start! Keep inviting friends and family
            </p>
          ) : (
            <p className="text-xs text-gray-500 font-medium">
              Start collecting recipes to build your cookbook
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Add custom CSS for text shadow (add to your global CSS or tailwind config)
const styles = `
  .text-shadow {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
`;

// You can add this to your global CSS or inject it
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}