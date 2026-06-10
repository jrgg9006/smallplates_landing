"use client";

import React from "react";

interface InviteDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteToEvent: () => void;
  onSendCollectionLink: () => void;
  onInviteCaptain: () => void;
}

export function InviteDropdown({
  isOpen,
  onClose,
  onInviteToEvent,
  onSendCollectionLink,
  onInviteCaptain,
}: InviteDropdownProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Reason: cap width to the viewport on mobile so the menu never overflows;
          desktop keeps the exact min-w-[280px] auto sizing via sm:. */}
      <div className="absolute top-full left-0 mt-2 bg-[hsl(var(--brand-white))] rounded-2xl shadow-[0_4px_24px_rgba(45,45,45,0.12)] p-3 w-[calc(100vw-1.5rem)] max-w-[300px] sm:w-auto sm:min-w-[280px] sm:max-w-none z-50 border border-[hsl(var(--brand-border))]">
        <button
          onClick={() => {
            onSendCollectionLink();
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-border))] rounded-lg transition-colors"
        >
          Collect Recipes
        </button>
        <button
          onClick={() => {
            onInviteToEvent();
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-border))] rounded-lg transition-colors"
        >
          Create an Event Invitation
        </button>

        <div className="my-1 border-t border-[hsl(var(--brand-border))]" />

        <button
          onClick={() => {
            onInviteCaptain();
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-border))] rounded-lg transition-colors"
        >
          Invite a Captain
        </button>
      </div>
    </>
  );
}
