"use client";

import React, { useState, useRef, useEffect } from 'react';
import { UploadIcon, XIcon } from 'lucide-react';
import Image from 'next/image';

interface RecipeImageUploadProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles?: File[];
  error?: string | null;
  className?: string;
}

// Constants for file limits
const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB total
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

export function RecipeImageUpload({ 
  onFilesSelected, 
  selectedFiles = [], 
  error: externalError,
  className = '' 
}: RecipeImageUploadProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Create preview URLs when selectedFiles change
  useEffect(() => {
    const newPreviewUrls = selectedFiles.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return '';
    });
    
    setPreviewUrls(newPreviewUrls);
    
    // Cleanup old URLs
    return () => {
      newPreviewUrls.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [selectedFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(''); // Clear previous errors
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (selectedFiles.length + files.length > MAX_FILES) {
      setError(`You can only upload up to ${MAX_FILES} files. You currently have ${selectedFiles.length}.`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const errors: string[] = [];
    let totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

    for (const file of files) {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" is not a supported file type`);
        continue;
      }

      // Check individual file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" is too large (max 5MB per file)`);
        continue;
      }

      // Check total size
      if (totalSize + file.size > MAX_TOTAL_SIZE) {
        errors.push('Total file size would exceed 25MB limit');
        break;
      }

      // Check for duplicates
      const isDuplicate = selectedFiles.some(f => 
        f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
      );
      if (isDuplicate) {
        errors.push(`"${file.name}" is already selected`);
        continue;
      }

      validFiles.push(file);
      totalSize += file.size;
    }

    if (errors.length > 0) {
      setError(errors[0]); // Show first error
      return;
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...validFiles];
      onFilesSelected(updatedFiles);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    onFilesSelected(updatedFiles);
  };

  const displayError = externalError || error;

  return (
    <div className={className}>
      {/* Error display */}
      {displayError && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{displayError}</p>
        </div>
      )}

      {/* Upload button */}
      {selectedFiles.length === 0 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full group p-6 rounded-xl border-2 border-gray-200 hover:border-gray-900 hover:shadow-lg cursor-pointer transition-all duration-200"
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 rounded-full bg-gray-50 group-hover:bg-gray-900 transition-colors duration-200">
              <UploadIcon className="w-6 h-6 text-gray-700 group-hover:text-white transition-colors duration-200" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-base text-gray-900">
                {isMobile ? 'Upload or take a picture' : 'Upload images or PDFs'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Select images or PDFs from your device{isMobile ? ' or camera' : ''}</p>
              <p className="mt-1 text-xs text-gray-400">Max 5MB per file, up to 10 files</p>
            </div>
          </div>
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        capture={isMobile ? "environment" : undefined}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview selected files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          {/* File counter and add more button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected</span>
              <span className="ml-2 text-gray-400">
                ({Math.round(selectedFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024) * 10) / 10}MB total)
              </span>
            </div>
            {selectedFiles.length < MAX_FILES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Add more
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  ) : file.type === 'application/pdf' ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs">PDF</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <UploadIcon className="w-8 h-8 mb-2" />
                      <span className="text-xs">File</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 z-10"
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
  );
}

