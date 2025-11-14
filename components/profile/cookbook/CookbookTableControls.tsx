"use client";

import React, { useState } from "react";
import { Search, ChevronDown, Plus, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Cookbook } from "@/lib/types/database";
import { useRouter } from "next/navigation";

interface CookbookTableControlsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  cookbooks: Cookbook[];
  selectedCookbookId: string | null;
  onCookbookChange: (cookbookId: string) => void;
  onCreateCookbook: () => void;
}

export function CookbookTableControls({ 
  searchValue, 
  onSearchChange,
  cookbooks,
  selectedCookbookId,
  onCookbookChange,
  onCreateCookbook
}: CookbookTableControlsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const selectedCookbook = cookbooks.find(cb => cb.id === selectedCookbookId);

  const handleAddRecipe = () => {
    router.push('/profile/recipes');
  };

  const handleCookbookChange = (cookbookId: string) => {
    onCookbookChange(cookbookId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="py-4">
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-8">
            {/* Cookbook Selector */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 min-w-[200px] justify-between"
              >
                <span className="truncate">
                  {selectedCookbook ? selectedCookbook.name : 'Select Cookbook'}
                </span>
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              </button>
              
              {isDropdownOpen && (
                <>
                  <div className="absolute top-12 left-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {cookbooks.map((cookbook) => (
                      <button
                        key={cookbook.id}
                        onClick={() => handleCookbookChange(cookbook.id)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                          selectedCookbookId === cookbook.id
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        {cookbook.name}
                        {cookbook.is_default && (
                          <span className="ml-2 text-xs text-gray-500">(Default)</span>
                        )}
                      </button>
                    ))}
                    <div className="border-t border-gray-200 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onCreateCookbook();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create New Cookbook
                      </button>
                    </div>
                  </div>
                  {/* Overlay to close dropdown */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>
                </>
              )}
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by recipe name or guest name..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-6 w-96 bg-transparent border-0 border-b border-gray-300 rounded-none focus:border-gray-900 focus:ring-0 pb-2"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Add Recipe Button */}
            <Button
              onClick={handleAddRecipe}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-6 py-2 text-sm font-medium flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Add a Recipe
            </Button>
            
            {/* Create Cookbook Button */}
            <Button
              onClick={onCreateCookbook}
              className="bg-teal-600 text-white hover:bg-teal-700 rounded-lg px-6 py-2 text-sm font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Cookbook
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Cookbook Selector + Create Button */}
        <div className="flex gap-3">
          {/* Cookbook Dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 w-full justify-between"
            >
              <span className="truncate">
                {selectedCookbook ? selectedCookbook.name : 'Select Cookbook'}
              </span>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </button>
            
            {isDropdownOpen && (
              <>
                <div className="absolute top-12 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {cookbooks.map((cookbook) => (
                    <button
                      key={cookbook.id}
                      onClick={() => handleCookbookChange(cookbook.id)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                        selectedCookbookId === cookbook.id
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {cookbook.name}
                      {cookbook.is_default && (
                        <span className="ml-2 text-xs text-gray-500">(Default)</span>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-200 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onCreateCookbook();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Cookbook
                    </button>
                  </div>
                </div>
                {/* Overlay to close dropdown */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)}
                ></div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Add Recipe Button */}
            <Button
              onClick={handleAddRecipe}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 flex-1"
            >
              <BookOpen className="h-4 w-4" />
              Add Recipe
            </Button>
            
            {/* Create Button */}
            <Button
              onClick={onCreateCookbook}
              className="bg-teal-600 text-white hover:bg-teal-700 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 flex-1"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
        </div>

        {/* Search Input - Full width */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by recipe name or guest name..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-full border border-gray-300 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

