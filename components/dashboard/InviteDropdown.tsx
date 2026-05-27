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

      <div className="absolute top-full left-0 mt-2 bg-[hsl(var(--brand-white))] rounded-2xl shadow-[0_4px_24px_rgba(45,45,45,0.12)] p-3 min-w-[280px] z-50 border border-[hsl(var(--brand-border))]">
        <button
          onClick={() => {
            onInviteToEvent();
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-border))] rounded-lg transition-colors"
        >
          Invite to event
        </button>
        <button
          onClick={() => {
            onSendCollectionLink();
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-border))] rounded-lg transition-colors"
        >
          Send recipe collection link
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
