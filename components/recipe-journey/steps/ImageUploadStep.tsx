"use client";

import React, { useState, useRef, useEffect } from 'react';
import { UploadIcon, CameraIcon, XIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadStepProps {
  onImagesReady: (urls: string[]) => void;
  onFilesSelected: (files: File[]) => void;
}

// Constants for file limits
const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB total
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

export default function ImageUploadStep({ onImagesReady, onFilesSelected }: ImageUploadStepProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
      setSelectedFiles(updatedFiles);
      
      // Create preview URLs for images
      const newPreviewUrls = validFiles.map(file => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return ''; // PDF preview placeholder
      });
      
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      onFilesSelected(updatedFiles); // Pass all files, not just new ones
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      if (newUrls[index] && newUrls[index].startsWith('blob:')) {
        URL.revokeObjectURL(newUrls[index]);
      }
      return newUrls.filter((_, i) => i !== index);
    });
    onFilesSelected(updatedFiles); // Update parent with new file list
  };


  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
      <div className="w-full space-y-8 px-4 md:px-6">
        <div className="space-y-2 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#2D2D2D]">
            Upload your recipe
          </h2>
          <p className="mt-3 text-base text-gray-600">
            Just the recipe (not the dish). We'll make it beautiful.
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Upload options */}
        {selectedFiles.length === 0 && (
          <>
            {/* Mobile: Single button */}
            {isMobile ? (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full group p-8 rounded-2xl border-2 border-gray-200 hover:border-[#D4A854] hover:shadow-lg cursor-pointer transition-all duration-200"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 rounded-full bg-gray-50 group-hover:bg-[#D4A854] transition-colors duration-200">
                      <UploadIcon className="w-8 h-8 text-[#2D2D2D] group-hover:text-white transition-colors duration-200" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-medium text-lg text-[#2D2D2D]">Upload a file or take a picture</h3>
                      <p className="mt-1 text-sm text-gray-500">Choose from your device or camera</p>
                      <p className="mt-1 text-xs text-gray-400">Max 5MB per file, up to 10 files</p>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              /* Desktop: Two buttons */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {/* Upload files option */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group p-8 rounded-2xl border-2 border-gray-200 hover:border-[#D4A854] hover:shadow-lg cursor-pointer transition-all duration-200"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 rounded-full bg-gray-50 group-hover:bg-[#D4A854] transition-colors duration-200">
                      <UploadIcon className="w-8 h-8 text-[#2D2D2D] group-hover:text-white transition-colors duration-200" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-medium text-lg text-[#2D2D2D]">Upload files</h3>
                      <p className="mt-1 text-sm text-gray-500">Select images or PDFs from your device</p>
                      <p className="mt-1 text-xs text-gray-400">Max 5MB per file, up to 10 files</p>
                    </div>
                  </div>
                </button>

                {/* Take photo option - Desktop disabled */}
                <button
                  type="button"
                  disabled={true}
                  className="relative group p-8 rounded-2xl border-2 border-gray-100 opacity-50 cursor-not-allowed transition-all duration-200"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 rounded-full bg-gray-50">
                      <CameraIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-medium text-lg text-[#2D2D2D]">Take a photo</h3>
                      <p className="mt-1 text-sm text-gray-500">Use your camera to capture the recipe</p>
                    </div>
                    <span className="absolute top-4 right-4 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      Mobile only
                    </span>
                  </div>
                </button>
              </div>
            )}
          </>
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