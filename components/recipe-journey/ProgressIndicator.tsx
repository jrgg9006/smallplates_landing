"use client";

import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  // Map internal steps to visual steps
  const getVisualStep = (step: number) => {
    if (step <= 4) return 1; // Welcome (steps 1-4)
    if (step <= 8) return 2; // Recipe (steps 5-8)
    return 3; // Submit (step 9)
  };

  const visualStep = getVisualStep(currentStep);
  const visualSteps = [
    { id: 1, label: 'Welcome', steps: [1, 2, 3, 4] },
    { id: 2, label: 'Recipe', steps: [5, 6, 7, 8] },
    { id: 3, label: 'Submit', steps: [9] }
  ];

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="relative">
          <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
            <div
              style={{ width: `${progressPercentage}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-500 ease-out"
            />
          </div>
          
          {/* Step Indicators - Only 3 visual steps */}
          <div className="flex justify-between mt-3">
            {visualSteps.map((step) => {
              const isCompleted = visualStep > step.id;
              const isCurrent = visualStep === step.id;
              
              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center space-y-1"
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500'
                        : isCurrent
                        ? 'bg-white border-emerald-500 ring-2 ring-emerald-200'
                        : 'bg-white border-gray-300'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
      </div>
    </div>
  );
}
