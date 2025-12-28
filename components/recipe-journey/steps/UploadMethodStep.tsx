"use client";

import React from 'react';
import { PenLineIcon, CameraIcon, MicIcon } from 'lucide-react';

interface UploadMethodStepProps {
  onSelectMethod: (method: 'text' | 'audio' | 'image') => void;
}

export default function UploadMethodStep({ onSelectMethod }: UploadMethodStepProps) {
  const methods = [
    {
      id: 'text' as const,
      icon: PenLineIcon,
      title: 'Write',
      description: 'Type or paste your plate',
      available: true
    },
    {
      id: 'image' as const,
      icon: CameraIcon,
      title: 'Photo',
      description: 'Upload images or documents',
      available: true
    },
    {
      id: 'audio' as const,
      icon: MicIcon,
      title: 'Audio',
      description: 'Record your plate',
      available: false
    }
  ];

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
      <div className="w-full space-y-8 px-4 md:px-6">
        <div className="space-y-2 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#2D2D2D]">
            How would you like to share your Recipe?
          </h2>
          <p className="mt-3 text-base text-gray-600">
            Choose the format that works best for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => method.available && onSelectMethod(method.id)}
            disabled={!method.available}
            className={`
              relative group p-4 md:p-8 rounded-xl md:rounded-2xl border-2 transition-all duration-200 bg-white
              ${method.available 
                ? 'border-gray-200 hover:border-[#D4A854] hover:shadow-lg cursor-pointer' 
                : 'border-gray-100 opacity-50 cursor-not-allowed'
              }
            `}
          >
            <div className="flex flex-row md:flex-col items-center space-x-4 md:space-x-0 md:space-y-4">
              <div className={`
                p-3 md:p-4 rounded-full transition-colors duration-200 flex-shrink-0
                ${method.available 
                  ? 'bg-gray-50 group-hover:bg-[#D4A854]' 
                  : 'bg-gray-50'
                }
              `}>
                <method.icon 
                  className={`
                    w-6 h-6 md:w-8 md:h-8 transition-colors duration-200
                    ${method.available 
                      ? 'text-[#2D2D2D] group-hover:text-white' 
                      : 'text-gray-400'
                    }
                  `} 
                />
              </div>
              <div className="text-left md:text-center flex-1">
                <h3 className="font-medium text-lg text-gray-900">
                  {method.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {method.description}
                </p>
              </div>
              {!method.available && (
                <span className="absolute top-2 right-2 md:top-4 md:right-4 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  Coming soon
                </span>
              )}
            </div>
          </button>
        ))}
        </div>

        <div className="mt-12 text-center space-y-0">
          <p className="text-base font-medium text-[#2D2D2D]">
            No photo of the dish needed.
          </p>
          <p className="text-base text-gray-400">
            Just the recipe itself—we&apos;ll handle the rest.
          </p>
        </div>
      </div>
    </div>
  );
}