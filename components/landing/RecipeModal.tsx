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

      {/* Modal container - recipe floating in space */}
      <div className="flex items-center justify-center p-4 md:p-8 h-screen">
        <div className="relative w-full max-w-6xl mx-auto h-full max-h-[85vh] flex flex-col">
          {/* Close button - floating independently */}
          <button
            type="button"
            className="absolute -top-12 right-0 z-20 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full p-3 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white"
            onClick={onClose}
            aria-label="Close recipe modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Recipe spread image - floating with no background */}
          <div className="relative flex-1 min-h-0 flex items-center justify-center">
            <Image
              src={recipe.fullSpread}
              alt={`${recipe.title} recipe spread`}
              fill
              className="object-contain drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5)) drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))'
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
              priority
              quality={100}
              unoptimized
            />
          </div>
          
          {/* Floating recipe info - now with transparent background */}
          <div className="mt-4 text-center">
            <h2 id="modal-title" className="text-xl font-serif font-medium text-white drop-shadow-lg">
              {recipe.title}
            </h2>
            <p className="text-sm text-gray-300 mt-1">{recipe.author}</p>
          </div>
        </div>
      </div>
    </div>
  );
}