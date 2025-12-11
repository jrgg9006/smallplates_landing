import React, { useState, useRef, useEffect } from "react";

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}

/**
 * Custom dropdown component that matches the SelectionCard design
 * 
 * Args:
 *   options (array): Array of {value, label} options
 *   value (string): Current selected value
 *   onChange (function): Callback when value changes
 *   placeholder (string): Placeholder text
 *   label (string): Field label
 */
export function CustomDropdown({ options, value, onChange, placeholder, label }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-[#2D2D2D] mb-1">
        {label}
      </label>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 hover:border-[#E8E0D5] hover:shadow-md ${
          isOpen
            ? "border-[#E8E0D5] bg-[#E8E0D5]/40"
            : selectedOption
            ? "border-[#E8E0D5] bg-[#E8E0D5]/40"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-base font-medium ${
            selectedOption ? "text-gray-900" : "text-gray-500"
          }`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full p-4 text-left hover:bg-[#FAF7F2] transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl ${
                value === option.value ? "bg-[#E8E0D5]/40 text-[#2D2D2D]" : "text-gray-900"
              }`}
            >
              <span className="text-base font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}