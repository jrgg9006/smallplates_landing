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
        <div className="relative max-w-6xl w-full">
          {/* Close button */}
          <button
            type="button"
            className="absolute -top-12 right-0 text-white hover:text-gray-300 focus:outline-none"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-8 w-8"
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

          {/* Recipe image */}
          <div className="relative rounded-lg shadow-2xl overflow-hidden">
            <div className="relative aspect-[3/1] w-full">
              <Image
                src={recipe.fullSpread}
                alt={`${recipe.title} recipe spread`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1536px) 80vw, 1536px"
                priority
              />
            </div>
            
            {/* Recipe info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
              <h2 id="modal-title" className="text-2xl font-serif font-medium">
                {recipe.title}
              </h2>
              <p className="text-sm mt-1">{recipe.author}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}