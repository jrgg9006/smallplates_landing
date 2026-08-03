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
 */
export default function PhotoRecipeWarningModal({
  isOpen,
  onPickAnother,
  onSubmitAnyway,
}: PhotoRecipeWarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onPickAnother(); }}>
      <DialogContent className="max-w-md w-full bg-white rounded-2xl p-6 gap-0">
        <DialogHeader className="text-left">
          <DialogTitle className="font-serif text-2xl font-medium text-brand-charcoal">
            We couldn&apos;t find a recipe here
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--brand-warm-gray-light))] text-sm mt-2 leading-relaxed">
            This looks like the finished dish. We need the recipe written out: the ingredients
            and the steps. We make the picture from your words.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onPickAnother}
            className="w-full px-6 py-3 rounded-full bg-brand-honey text-white hover:bg-brand-honey-dark transition-colors focus:outline-none focus:ring-2 focus:ring-brand-honey focus:ring-offset-2 touch-manipulation"
          >
            Pick another photo
          </button>
          <button
            type="button"
            onClick={onSubmitAnyway}
            className="text-sm text-[hsl(var(--brand-warm-gray-light))] underline underline-offset-4 hover:text-brand-charcoal transition-colors focus:outline-none focus:ring-2 focus:ring-brand-honey focus:ring-offset-2 rounded-md px-2 py-1"
          >
            Submit anyway
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
