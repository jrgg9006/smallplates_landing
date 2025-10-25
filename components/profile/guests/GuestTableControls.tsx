"use client";

import React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GuestTableControlsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAddGuest: () => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  guestCounts?: {
    all: number;
    pending: number;
    submitted: number;
  };
}

export function GuestTableControls({ 
  searchValue, 
  onSearchChange, 
  onAddGuest,
  statusFilter,
  onStatusFilterChange,
  guestCounts
}: GuestTableControlsProps) {

  return (
    <div className="py-4">
      {/* Controls row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-8">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => onStatusFilterChange('all')}
              className={`pb-2 px-8 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === 'all'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All {guestCounts && `(${guestCounts.all})`}
            </button>
            <button
              onClick={() => onStatusFilterChange('pending')}
              className={`pb-2 px-8 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === 'pending'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending {guestCounts && `(${guestCounts.pending})`}
            </button>
            <button
              onClick={() => onStatusFilterChange('submitted')}
              className={`pb-2 px-8 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === 'submitted'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Received {guestCounts && `(${guestCounts.submitted})`}
            </button>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-6 w-64 bg-transparent border-0 border-b border-gray-300 rounded-none focus:border-gray-900 focus:ring-0 pb-2"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={onAddGuest}
            className="bg-teal-600 text-white hover:bg-teal-700 rounded-lg px-6"
          >
            Add Guests and Recipes
          </Button>
        </div>
      </div>
    </div>
  );
}