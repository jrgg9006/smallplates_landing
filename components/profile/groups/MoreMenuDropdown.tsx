"use client";

import React from "react";

interface MoreMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  showCaptainsOption?: boolean;
  onCaptainsClick?: () => void;
  showAddGuestOption?: boolean;
  onAddGuestClick?: () => void;
  onViewGuestsClick?: () => void;
}

export function MoreMenuDropdown({ isOpen, onClose, onEditProfile, showCaptainsOption, onCaptainsClick, showAddGuestOption, onAddGuestClick, onViewGuestsClick }: MoreMenuDropdownProps) {
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-2 bg-[hsl(var(--brand-white))] rounded-2xl shadow-[0_4px_24px_rgba(45,45,45,0.12)] p-3 min-w-[180px] z-50 border border-[hsl(var(--brand-border))]">
        {showCaptainsOption && onCaptainsClick && (
          <button
            onClick={() => {
              onCaptainsClick();
              onClose();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-border))] rounded-lg transition-colors"
          >
            Captains
          </button>
        )}
        {showAddGuestOption && onAddGuestClick && (
          <button
            onClick={() => {
              onAddGuestClick();
              onClose();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-border))] rounded-lg transition-colors"
          >
            Add Guest
          </button>
        )}
        <button
          onClick={() => {
            onViewGuestsClick?.();
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-border))] rounded-lg transition-colors"
        >
          Manage Guests
        </button>
        <button
          onClick={() => {
            onEditProfile();
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-border))] rounded-lg transition-colors"
        >
          Edit Profile
        </button>
      </div>
    </>
  );
}