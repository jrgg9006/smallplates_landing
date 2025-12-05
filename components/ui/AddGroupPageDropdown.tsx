"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";

interface AddGroupPageDropdownProps {
  onCreateNewGroup: () => void;
  onInviteFriend: () => void;
  title?: string;
  className?: string;
}

export function AddGroupPageDropdown({ 
  onCreateNewGroup, 
  onInviteFriend,
  title = "Group actions",
  className = ""
}: AddGroupPageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  const handleCreateNewGroup = () => {
    setIsOpen(false);
    onCreateNewGroup();
  };

  const handleInviteFriend = () => {
    setIsOpen(false);
    onInviteFriend();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
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
              onClick={handleCreateNewGroup}
              className="w-full px-4 py-3 text-left text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
            >
              <Plus className="h-5 w-5" />
              Create new book
            </button>
            <button
              onClick={handleInviteFriend}
              className="w-full px-4 py-3 text-left text-base text-gray-700 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-3"
            >
              <UserPlus className="h-5 w-5" />
              Invite a friend to this Book
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
}

