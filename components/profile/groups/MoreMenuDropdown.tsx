"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

// Reason: Create Event Invitation oculto por ahora — no listo para usuarios. Poner en true para re-activar.
const SHOW_CREATE_EVENT_INVITATION: boolean = false;

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
  onCreateEventInvitationClick?: () => void;
  onCloseBookClick?: () => void;
}

export function MoreMenuDropdown({ isOpen, onClose, onEditProfile, showCaptainsOption, onCaptainsClick, showAddGuestOption, onViewGuestsClick, showSendInvitationsOption, onSendInvitationsClick, onCreateEventInvitationClick, onCloseBookClick }: MoreMenuDropdownProps) {
  // Reason: on mobile render as a bottom sheet (anchored to the viewport, never
  // clips off-screen); on desktop keep the anchored dropdown. Lazy-init from
  // window since this only mounts after a user click (client-only) — no flash.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!isOpen) return null;

  // Reason: shared menu items for both the mobile sheet and the desktop dropdown.
  const body = (
    <>
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
      {/* Reason: Create Event Invitation oculto por ahora — no listo para usuarios. Re-activar poniendo SHOW_CREATE_EVENT_INVITATION = true. */}
      {SHOW_CREATE_EVENT_INVITATION && onCreateEventInvitationClick && (
        <button
          onClick={() => {
            onCreateEventInvitationClick();
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-border))] rounded-lg transition-colors"
        >
          Create Event Invitation
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
            Review and Print
          </button>
        </>
      )}
    </>
  );

  // Mobile: bottom sheet anchored to the viewport — never clips off-screen.
  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
          <SheetTitle className="type-modal-title text-center mb-4">
            More
          </SheetTitle>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: anchored dropdown. Reason: the ⋯ trigger sits on the right, so
  // anchor to the right edge and drop to the left.
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      <div className="absolute top-full right-0 mt-2 bg-[hsl(var(--brand-white))] rounded-2xl shadow-[0_4px_24px_rgba(45,45,45,0.12)] p-3 min-w-[240px] z-50 border border-[hsl(var(--brand-border))]">
        {body}
      </div>
    </>
  );
}
