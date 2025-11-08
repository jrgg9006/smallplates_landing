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
      description: 'Type or paste your recipe',
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
      description: 'Record your recipe',
      available: false
    }
  ];

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
      <div className="w-full space-y-8 px-4 md:px-6">
        <div className="space-y-2 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900">
            How would you like to share your recipe?
          </h2>
          <p className="mt-3 text-base text-gray-600">
            Choose the format that works best for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => method.available && onSelectMethod(method.id)}
            disabled={!method.available}
            className={`
              relative group p-8 rounded-2xl border-2 transition-all duration-200
              ${method.available 
                ? 'border-gray-200 hover:border-gray-900 hover:shadow-lg cursor-pointer' 
                : 'border-gray-100 opacity-50 cursor-not-allowed'
              }
            `}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className={`
                p-4 rounded-full transition-colors duration-200
                ${method.available 
                  ? 'bg-gray-50 group-hover:bg-gray-900' 
                  : 'bg-gray-50'
                }
              `}>
                <method.icon 
                  className={`
                    w-8 h-8 transition-colors duration-200
                    ${method.available 
                      ? 'text-gray-700 group-hover:text-white' 
                      : 'text-gray-400'
                    }
                  `} 
                />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-lg text-gray-900">
                  {method.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {method.description}
                </p>
              </div>
              {!method.available && (
                <span className="absolute top-4 right-4 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  Coming soon
                </span>
              )}
            </div>
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}