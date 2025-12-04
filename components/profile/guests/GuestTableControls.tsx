"use client";

import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

interface GuestTableControlsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
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
  statusFilter,
  onStatusFilterChange,
  guestCounts
}: GuestTableControlsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'all':
        return `All ${guestCounts ? `(${guestCounts.all})` : ''}`;
      case 'pending':
        return `Guests with no recipes ${guestCounts ? `(${guestCounts.pending})` : ''}`;
      case 'submitted':
        return `Guests with recipes ${guestCounts ? `(${guestCounts.submitted})` : ''}`;
      default:
        return 'All';
    }
  };

  const handleStatusChange = (status: string) => {
    onStatusFilterChange(status);
    setIsDropdownOpen(false);
  };

  return (
    <div className="py-4">
      {/* Desktop Layout */}
      <div className="hidden md:block">
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
                Guests with no recipes {guestCounts && `(${guestCounts.pending})`}
              </button>
              <button
                onClick={() => onStatusFilterChange('submitted')}
                className={`pb-2 px-8 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === 'submitted'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Guests with recipes {guestCounts && `(${guestCounts.submitted})`}
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
          
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Filter Dropdown + Search */}
        <div className="flex gap-3">
          {/* Status Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {getStatusLabel(statusFilter)}
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {isDropdownOpen && (
              <>
                <div className="absolute top-12 left-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => handleStatusChange('all')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      statusFilter === 'all' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700'
                    }`}
                  >
                    All {guestCounts && `(${guestCounts.all})`}
                  </button>
                  <button
                    onClick={() => handleStatusChange('pending')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      statusFilter === 'pending' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700'
                    }`}
                  >
                    Guests with no recipes {guestCounts && `(${guestCounts.pending})`}
                  </button>
                  <button
                    onClick={() => handleStatusChange('submitted')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      statusFilter === 'submitted' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700'
                    }`}
                  >
                    Guests with recipes {guestCounts && `(${guestCounts.submitted})`}
                  </button>
                </div>
                {/* Overlay to close dropdown */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)}
                ></div>
              </>
            )}
          </div>

          {/* Search Input - Full width */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg"
            />
          </div>
        </div>

      </div>
    </div>
  );
}