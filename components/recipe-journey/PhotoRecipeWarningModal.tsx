"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PhotoRecipeWarningModalProps {
  isOpen: boolean;
  onPickAnother: () => void;
  onSubmitAnyway: () => void;
}

/**
 * Shown after the guest presses Submit when the AI engine could not find a
 * written recipe in the uploaded photo. Never blocks: "Submit anyway" always works.
 *
 * Styling follows the product modal system (SendRemindersModal, AddFriendToGroupModal):
 * type-modal-title, gray-600 body, and the pill footer with the charcoal primary
 * on the right and the white outline secondary beside it.
 */
export default function PhotoRecipeWarningModal({
  isOpen,
  onPickAnother,
  onSubmitAnyway,
}: PhotoRecipeWarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onPickAnother(); }}>
      {/* Reason: without this Radix focuses the first button on open, so "Submit
          anyway" opened wearing a focus ring and read as the recommended action.
          Focus stays trapped in the dialog either way. */}
      <DialogContent
        className="sm:max-w-[500px]"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="type-modal-title">We couldn&apos;t find a recipe here</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <DialogDescription className="text-gray-600 text-base leading-relaxed">
            This looks like the finished dish. We need the recipe written out: the ingredients
            and the steps. We make the picture from your words.
          </DialogDescription>
        </div>

        {/* Reason: side-by-side, each flex-1 — the dashboard footer pattern (EditGroupModal) */}
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onSubmitAnyway}
            className="flex-1 rounded-full border border-[rgba(45,45,45,0.14)] py-3.5 text-[15px] font-medium text-brand-charcoal transition-colors hover:bg-[rgba(45,45,45,0.03)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.18)] focus-visible:ring-offset-2"
          >
            Submit anyway
          </button>
          <button
            type="button"
            onClick={onPickAnother}
            className="flex-1 rounded-full bg-brand-charcoal py-3.5 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2"
          >
            Pick another photo
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
