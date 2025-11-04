"use client";

import { useEffect } from "react";
import Image from "next/image";

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: {
    title: string;
    author: string;
    fullSpread: string;
  } | null;
}

export default function RecipeModal({ isOpen, onClose, recipe }: RecipeModalProps) {
  // Close modal on ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !recipe) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-screen-xl">
          {/* Close button */}
          <button
            type="button"
            className="absolute -top-12 right-0 z-10 text-white hover:text-gray-300 focus:outline-none transition-colors"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Recipe image container */}
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Recipe spread image - using better aspect ratio for cookbook spreads */}
            <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
              <Image
                src={recipe.fullSpread}
                alt={`${recipe.title} recipe spread`}
                fill
                className="object-contain bg-gray-50"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                priority
                quality={100}
                unoptimized
              />
            </div>
            
            {/* Recipe info bar at bottom */}
            <div className="bg-white px-6 py-4 border-t border-gray-100">
              <h2 id="modal-title" className="text-xl font-serif font-medium text-gray-900">
                {recipe.title}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">{recipe.author}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}