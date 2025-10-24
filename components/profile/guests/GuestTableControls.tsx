"use client";

import React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GuestTableControlsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAddGuest: () => void;
}

export function GuestTableControls({ 
  searchValue, 
  onSearchChange, 
  onAddGuest 
}: GuestTableControlsProps) {
  const [activeToggle, setActiveToggle] = React.useState<string | null>(null);

  const handleToggleClick = (toggleType: string) => {
    // Visual toggle logic - set active state
    setActiveToggle(activeToggle === toggleType ? null : toggleType);
    // Note: This is visual-only for now, no query logic changes
  };

  return (
    <div className="py-4">
      {/* Single row with all controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-64 bg-white rounded-full border-gray-200"
            />
          </div>
          
          {/* Filter Toggle Buttons */}
          <button
            onClick={() => handleToggleClick('submitted')}
            className={`px-6 py-2 rounded-full text-base font-medium transition-colors duration-200 ${
              activeToggle === 'submitted'
                ? 'bg-gray-900 text-green-500'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Recipe Submitted
          </button>
          <button
            onClick={() => handleToggleClick('pending')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
              activeToggle === 'pending'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={onAddGuest}
            className="bg-smallplates_green text-white hover:bg-gray-800 rounded-full px-6"
          >
            Add Guests & Recipes
          </Button>
        </div>
      </div>
    </div>
  );
}