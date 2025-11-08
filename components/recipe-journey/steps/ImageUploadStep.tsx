"use client";

import React, { useState, useRef, useEffect } from 'react';
import { UploadIcon, CameraIcon, XIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadStepProps {
  onImagesReady: (urls: string[]) => void;
  onFilesSelected: (files: File[]) => void;
}

export default function ImageUploadStep({ onImagesReady, onFilesSelected }: ImageUploadStepProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Filter valid image files
      const imageFiles = files.filter(file => 
        file.type.startsWith('image/') || file.type === 'application/pdf'
      );

      if (imageFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...imageFiles]);
        
        // Create preview URLs for images
        const newPreviewUrls = imageFiles.map(file => {
          if (file.type.startsWith('image/')) {
            return URL.createObjectURL(file);
          }
          return ''; // PDF preview placeholder
        });
        
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        onFilesSelected(imageFiles);
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      if (newUrls[index] && newUrls[index].startsWith('blob:')) {
        URL.revokeObjectURL(newUrls[index]);
      }
      return newUrls.filter((_, i) => i !== index);
    });
  };


  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
      <div className="w-full space-y-8 px-4 md:px-6">
        <div className="space-y-2 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900">
            Upload your recipe
          </h2>
          <p className="mt-3 text-base text-gray-600">
            Take a photo or upload images of your handwritten or printed recipe
          </p>
        </div>

        {/* Upload options */}
        {selectedFiles.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {/* Upload files option */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group p-8 rounded-2xl border-2 border-gray-200 hover:border-gray-900 hover:shadow-lg cursor-pointer transition-all duration-200"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-gray-50 group-hover:bg-gray-900 transition-colors duration-200">
                <UploadIcon className="w-8 h-8 text-gray-700 group-hover:text-white transition-colors duration-200" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-lg text-gray-900">Upload files</h3>
                <p className="mt-1 text-sm text-gray-500">Select images or PDFs from your device</p>
              </div>
            </div>
          </button>

          {/* Take photo option */}
          <button
            type="button"
            onClick={() => isMobile && cameraInputRef.current?.click()}
            disabled={!isMobile}
            className={`
              relative group p-8 rounded-2xl border-2 transition-all duration-200
              ${isMobile 
                ? 'border-gray-200 hover:border-gray-900 hover:shadow-lg cursor-pointer' 
                : 'border-gray-100 opacity-50 cursor-not-allowed'
              }
            `}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className={`
                p-4 rounded-full transition-colors duration-200
                ${isMobile 
                  ? 'bg-gray-50 group-hover:bg-gray-900' 
                  : 'bg-gray-50'
                }
              `}>
                <CameraIcon 
                  className={`
                    w-8 h-8 transition-colors duration-200
                    ${isMobile 
                      ? 'text-gray-700 group-hover:text-white' 
                      : 'text-gray-400'
                    }
                  `} 
                />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-lg text-gray-900">Take a photo</h3>
                <p className="mt-1 text-sm text-gray-500">Use your camera to capture the recipe</p>
              </div>
              {!isMobile && (
                <span className="absolute top-4 right-4 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  Mobile only
                </span>
              )}
            </div>
          </button>
          </div>
        )}

        {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

        {/* Preview selected files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Add more
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                  {file.type.startsWith('image/') && previewUrls[index] ? (
                    <Image
                      src={previewUrls[index]}
                      alt={`Recipe image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs">PDF</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                >
                  <XIcon className="w-4 h-4" />
                </button>
                <p className="mt-2 text-xs text-gray-600 truncate">{file.name}</p>
              </div>
            ))}
          </div>

          </div>
        )}
      </div>
    </div>
  );
}