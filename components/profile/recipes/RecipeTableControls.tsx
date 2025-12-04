"use client";

import React, { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

interface RecipeTableControlsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (filter: string) => void;
  recipeCounts?: {
    all: number;
    myOwn: number;
    collected: number;
    discovered: number;
  };
}

export function RecipeTableControls({ 
  searchValue, 
  onSearchChange,
  filterType,
  onFilterTypeChange,
  recipeCounts
}: RecipeTableControlsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getFilterLabel = (filter: string) => {
    switch (filter) {
      case 'all':
        return `All ${recipeCounts ? `(${recipeCounts.all})` : ''}`;
      case 'myOwn':
        return `My Own ${recipeCounts ? `(${recipeCounts.myOwn})` : ''}`;
      case 'collected':
        return `Collected by you ${recipeCounts ? `(${recipeCounts.collected})` : ''}`;
      case 'discovered':
        return `From groups ${recipeCounts ? `(${recipeCounts.discovered})` : ''}`;
      default:
        return 'All';
    }
  };

  const handleFilterChange = (filter: string) => {
    onFilterTypeChange(filter);
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
                onClick={() => onFilterTypeChange('all')}
                className={`pb-2 px-8 text-sm font-medium border-b-2 transition-colors ${
                  filterType === 'all'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All {recipeCounts && `(${recipeCounts.all})`}
              </button>
              <button
                onClick={() => onFilterTypeChange('myOwn')}
                className={`pb-2 px-8 text-sm font-medium border-b-2 transition-colors ${
                  filterType === 'myOwn'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My own {recipeCounts && `(${recipeCounts.myOwn})`}
              </button>
              <button
                onClick={() => onFilterTypeChange('collected')}
                className={`pb-2 px-8 text-sm font-medium border-b-2 transition-colors ${
                  filterType === 'collected'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Collected by you {recipeCounts && `(${recipeCounts.collected})`}
              </button>
              <button
                onClick={() => onFilterTypeChange('discovered')}
                className={`pb-2 px-8 text-sm font-medium border-b-2 transition-colors ${
                  filterType === 'discovered'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                From groups {recipeCounts && `(${recipeCounts.discovered})`}
              </button>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by recipe name, guest name, or ingredients..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-6 w-96 bg-transparent border-0 border-b border-gray-300 rounded-none focus:border-gray-900 focus:ring-0 pb-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Filter Dropdown + Search */}
        <div className="flex gap-3">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {getFilterLabel(filterType)}
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {isDropdownOpen && (
              <>
                <div className="absolute top-12 left-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      filterType === 'all' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700'
                    }`}
                  >
                    All {recipeCounts && `(${recipeCounts.all})`}
                  </button>
                  <button
                    onClick={() => handleFilterChange('myOwn')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      filterType === 'myOwn' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700'
                    }`}
                  >
                    My Own {recipeCounts && `(${recipeCounts.myOwn})`}
                  </button>
                  <button
                    onClick={() => handleFilterChange('collected')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      filterType === 'collected' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700'
                    }`}
                  >
                    Collected by you {recipeCounts && `(${recipeCounts.collected})`}
                  </button>
                  <button
                    onClick={() => handleFilterChange('discovered')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      filterType === 'discovered' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700'
                    }`}
                  >
                    From groups {recipeCounts && `(${recipeCounts.discovered})`}
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
              placeholder="Search by recipe name, guest name, or ingredients..."
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
