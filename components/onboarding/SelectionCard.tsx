import React from "react";

interface SelectionCardProps {
  value: string;
  label: string;
  isSelected: boolean;
  onClick: (value: string) => void;
}

/**
 * Reusable selection card component for onboarding questions
 * 
 * Args:
 *   value (string): The value to store when selected
 *   label (string): Display text for the option
 *   isSelected (boolean): Whether this card is currently selected
 *   onClick (function): Callback when card is clicked
 */
export function SelectionCard({ value, label, isSelected, onClick }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 hover:border-blue-300 hover:shadow-md ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-gray-900">{label}</span>
        <div
          className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
            isSelected
              ? "border-blue-500 bg-blue-500"
              : "border-gray-300"
          }`}
        >
          {isSelected && (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}