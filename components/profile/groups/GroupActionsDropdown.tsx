"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, LogOut } from "lucide-react";
import { GroupWithMembers } from "@/lib/types/database";

interface GroupActionsDropdownProps {
  group: GroupWithMembers;
  userRole?: string | null;
  onDeleteGroup: () => void;
  onExitGroup: () => void;
  className?: string;
}

export function GroupActionsDropdown({
  group,
  userRole,
  onDeleteGroup,
  onExitGroup,
  className,
}: GroupActionsDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOwner = userRole === 'owner';
  const canDelete = isOwner;

  const closeDropdown = () => {
    setShowDropdown(false);
    setDropdownPosition(null);
  };

  const handleToggleDropdown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    if (!showDropdown) {
      // Calculate position based on button position
      if (buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const estimatedDropdownHeight = 50;
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        
        // Calculate right position (distance from right edge of viewport)
        const rightPosition = window.innerWidth - buttonRect.right;
        
        // Determine if we should open upward and set position accordingly
        if (spaceBelow < estimatedDropdownHeight + 10 && spaceAbove > estimatedDropdownHeight + 10) {
          // Position above the button
          setDropdownPosition({
            top: buttonRect.top - estimatedDropdownHeight - 4,
            right: rightPosition
          });
        } else {
          // Position below the button
          setDropdownPosition({
            top: buttonRect.bottom + 4,
            right: rightPosition
          });
        }
        
        setShowDropdown(true);
      }
    } else {
      closeDropdown();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleAction = (action: () => void) => {
    closeDropdown();
    action();
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        onClick={handleToggleDropdown}
        title="Group options"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      
      {/* Dropdown Menu */}
      {showDropdown && dropdownPosition && (
        <>
          <div 
            ref={dropdownRef}
            className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[160px]"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`
            }}
          >
            {canDelete ? (
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(onDeleteGroup);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete Group
              </button>
            ) : (
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(onExitGroup);
                }}
              >
                <LogOut className="h-4 w-4" />
                Exit Group
              </button>
            )}
          </div>
          {/* Overlay to close dropdown */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeDropdown}
          ></div>
        </>
      )}
    </div>
  );
}