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
    { label: "Format", value: "Hardcover, Adhesive Casebound (PUR)" },
    { label: "Size", value: "US Letter Tall (8\" × 10\") – Portrait" },
    { label: "Printing", value: "Full-color throughout" },
    { label: "Paper", value: "100 lb Satin Text (interior pages)" },
    { label: "Finish", value: "Matte Lamination on cover" },
    { label: "Recipes", value: "50 included — additional recipes available" },
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
        <div className="relative bg-white rounded-lg shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
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
          <div className="p-6 md:p-10">
            {/* Header */}
            <div className="pt-4 md:pt-6 mb-8">
              <p className="type-eyebrow text-center mb-4">The Book</p>
              <h1 id="modal-title" className="font-serif text-2xl md:text-3xl font-normal text-[#2D2D2D] text-center mb-4">
                Your Kitchen. Their Love.
              </h1>
              <p className="type-body-small text-center max-w-lg mx-auto">
                Everyone who loves you, gathered in one place. Each page designed to be opened, stained, and lived in.
              </p>
            </div>

            {/* Divider */}
            <div className="flex justify-center mb-8">
              <div className="w-12 h-px bg-[#E8E0D5]"></div>
            </div>

            {/* Specifications */}
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5 max-w-lg mx-auto mb-8">
              {bookSpecs.map((spec, index) => (
                <div key={index}>
                  <dt className="type-eyebrow mb-1">
                    {spec.label}
                  </dt>
                  <dd className="font-sans text-sm text-[#2D2D2D]">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Footer */}
            <div className="border-t border-[#E8E0D5] pt-6">
              <p className="type-caption italic text-center">
                Built to live in your kitchen for decades. Not a shelf.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}