"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AddRecipePageDropdownProps {
  onAddRecipe: () => void;
  onGetRecipesFromFriends: () => void;
  title?: string;
  className?: string;
}

export function AddRecipePageDropdown({ 
  onAddRecipe, 
  onGetRecipesFromFriends,
  title = "Recipe actions",
  className = ""
}: AddRecipePageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside (for mobile custom dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAddRecipe = () => {
    setIsOpen(false);
    onAddRecipe();
  };

  const handleGetRecipes = () => {
    setIsOpen(false);
    onGetRecipesFromFriends();
  };

  // Mobile: Custom dropdown
  const mobileDropdown = (
    <div className={`relative lg:hidden ${className}`} ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-teal-600 text-white hover:bg-teal-700 rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        aria-label={title}
        title={title}
      >
        <Plus className="h-6 w-6" />
      </Button>
      
      {isOpen && (
        <>
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[calc(100vw-3rem)] max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
            <button
              onClick={handleAddRecipe}
              className="w-full px-4 py-3 text-left text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
            >
              <BookOpen className="h-5 w-5" />
              Add a Plate
            </button>
            <button
              onClick={handleGetRecipes}
              className="w-full px-4 py-3 text-left text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-3"
            >
              <Users className="h-5 w-5" />
              Get Plates from Friends
            </button>
          </div>
          {/* Overlay to close dropdown */}
          <div 
            className="fixed inset-0 z-[5]" 
            onClick={() => setIsOpen(false)}
          ></div>
        </>
      )}
    </div>
  );

  // Desktop: Use DropdownMenu component
  const desktopDropdown = (
    <div className={`hidden lg:block ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="bg-teal-600 text-white hover:bg-teal-700 rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
            aria-label={title}
            title={title}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onClick={onAddRecipe} className="px-2 py-1.5 text-sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Add a Plate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onGetRecipesFromFriends} className="px-2 py-1.5 text-sm">
            <Users className="h-4 w-4 mr-2" />
            Get Plates from Friends
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      {mobileDropdown}
      {desktopDropdown}
    </>
  );
}