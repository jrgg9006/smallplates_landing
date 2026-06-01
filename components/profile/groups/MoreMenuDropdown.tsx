"use client";

import React from "react";

interface MoreMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  showCaptainsOption?: boolean;
  onCaptainsClick?: () => void;
  showAddGuestOption?: boolean;
  onViewGuestsClick?: () => void;
  showSendInvitationsOption?: boolean;
  onSendInvitationsClick?: () => void;
  onCloseBookClick?: () => void;
}

export function MoreMenuDropdown({ isOpen, onClose, onEditProfile, showCaptainsOption, onCaptainsClick, showAddGuestOption, onViewGuestsClick, showSendInvitationsOption, onSendInvitationsClick, onCloseBookClick }: MoreMenuDropdownProps) {
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown — Reason: the ⋯ trigger sits on the right, so on mobile anchor
          the menu to the right + cap its width to the viewport so it doesn't clip
          off-screen; desktop keeps the original left-0 min-w-[240px] via sm:. */}
      <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 bg-[hsl(var(--brand-white))] rounded-2xl shadow-[0_4px_24px_rgba(45,45,45,0.12)] p-3 w-[calc(100vw-1.5rem)] max-w-[280px] sm:w-auto sm:min-w-[240px] sm:max-w-none z-50 border border-[hsl(var(--brand-border))]">
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
        {showAddGuestOption && onViewGuestsClick && (
          <button
            onClick={() => {
              onViewGuestsClick();
              onClose();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-border))] rounded-lg transition-colors"
          >
            Guests
          </button>
        )}
        {showSendInvitationsOption && onSendInvitationsClick && (
          <button
            onClick={() => {
              onSendInvitationsClick();
              onClose();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-border))] rounded-lg transition-colors"
          >
            Send email invitations
          </button>
        )}
        {onCloseBookClick && (
          <>
            <div className="my-1 border-t border-[hsl(var(--brand-border))]" />
            <button
              onClick={() => {
                onCloseBookClick();
                onClose();
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-[hsl(var(--brand-honey))] hover:bg-[hsl(var(--brand-border))] rounded-lg transition-colors"
            >
              Print Book
            </button>
          </>
        )}
      </div>
    </>
  );
}