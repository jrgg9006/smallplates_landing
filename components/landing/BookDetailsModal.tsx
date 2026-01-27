"use client";

import { useEffect } from "react";

interface BookDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookDetailsModal({ isOpen, onClose }: BookDetailsModalProps) {
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

  if (!isOpen) return null;

  const bookSpecs = [
    { label: "Printing", value: "Full-color (CMYK) throughout" },
    { label: "Size (Premium Book)", value: "US Trade (11\" × 8.5\") – Portrait" },
    { label: "Size (Classic Book)", value: "US Trade (9\" × 6\") – Portrait" },
    { label: "Cover", value: "Hardcover, Adhesive Casebound" },
    { label: "Paper", value: "100 lb Satin Text (interior pages)" },
    { label: "Finish", value: "Matte Lamination on cover (outside only)" },
    { label: "Endpapers", value: "White stock" },
    { label: "Page Count", value: "Personalized (variable per collection)" },
  ];

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
        <div className="relative bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none z-10"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-6 w-6"
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

          {/* Modal content */}
          <div className="p-8 md:p-12">
            {/* Header with more top spacing */}
            <div className="pt-8 md:pt-8 mb-10">
              <h1 id="modal-title" className="font-serif text-3xl md:text-4xl font-medium text-[#2D2D2D] mb-6 text-center">
                Your Kitchen. Their Love.
              </h1>
              
              <p className="text-lg text-[#2D2D2D]/70 leading-relaxed max-w-2xl mx-auto text-center font-light">
                This isn&apos;t just a cookbook. It&apos;s everyone who loves you, gathered in one place. Each page designed to be opened, stained, and treasured—because the best gifts are the ones you actually use.
              </p>
              
              {/* Decorative divider */}
              <div className="flex justify-center mt-8">
                <div className="w-16 h-px bg-gray-300"></div>
              </div>
            </div>

            {/* Book Specifications with editorial design */}
            <div className="mb-10">
              <h2 className="font-serif text-2xl text-[#2D2D2D] mb-8 text-center">
                Book Specifications
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {bookSpecs.map((spec, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4 py-1">
                    <dt className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                      {spec.label}
                    </dt>
                    <dd className="text-base text-gray-900">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Footer text with elegant styling */}
            <div className="border-t border-gray-200 pt-8">
              <p className="text-base text-[#2D2D2D]/70 leading-relaxed text-center italic max-w-2xl mx-auto font-light">
                Built to live in your kitchen for decades, not gather dust on a shelf. <span className="font-serif not-italic text-[#2D2D2D]/50">Still at the table.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}