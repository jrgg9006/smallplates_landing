"use client";

import React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GuestTableControlsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  onAddGuest: () => void;
}

export function GuestTableControls({ 
  searchValue, 
  onSearchChange, 
  onFilterChange, 
  onAddGuest 
}: GuestTableControlsProps) {
  const [activeToggle, setActiveToggle] = React.useState<string | null>(null);

  const handleToggleClick = (toggleType: string) => {
    // Visual toggle logic - set active state
    setActiveToggle(activeToggle === toggleType ? null : toggleType);
    // Note: This is visual-only for now, no query logic changes
  };

  return (
    <div className="space-y-4 py-4">
      {/* Toggle Filter Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleToggleClick('submitted')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            activeToggle === 'submitted'
              ? 'bg-gray-900 text-white'
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
      
      {/* Existing Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-64 bg-white rounded-full border-gray-200"
          />
          </div>
        <Select onValueChange={onFilterChange} defaultValue="all">
          <SelectTrigger className="w-40 bg-white border-gray-200 rounded-full text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="reached_out">Reached Out</SelectItem>
          </SelectContent>
        </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={onAddGuest}
            className="bg-black text-white hover:bg-gray-800 rounded-full px-6"
          >
            Add Guests & Recipes
          </Button>
        </div>
      </div>
    </div>
  );
}