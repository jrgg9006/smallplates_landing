"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CloseBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReview: () => void;
  onStartCloseFlow: () => void;
  reviewed: boolean;
  recipeCount: number;
  uniqueContributors: number;
}

export function CloseBookModal({
  isOpen,
  onClose,
  onReview,
  onStartCloseFlow,
  reviewed,
  recipeCount,
  uniqueContributors,
}: CloseBookModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="type-modal-title">
            {reviewed
              ? "Looks good? This is final."
              : "Ready to send it to print?"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-3">
          <p className="text-sm text-[hsl(var(--brand-warm-gray))] leading-relaxed">
            {reviewed
              ? "Once you close the book, recipes can't be added or edited. We'll start designing right away."
              : "Closing locks the recipes and sends everything to design. You'll confirm a couple of details before we print."}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-2">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 border border-[rgba(45,45,45,0.12)] text-brand-charcoal rounded-full py-3 text-[14px] font-medium hover:bg-gray-50 transition-colors"
          >
            Not ready yet
          </button>
          {reviewed ? (
            <button
              onClick={onStartCloseFlow}
              className="w-full sm:flex-1 bg-brand-charcoal text-brand-warm-white-warm rounded-full py-3 text-[14px] font-medium hover:bg-gray-800 transition-colors"
            >
              Close the book →
            </button>
          ) : (
            <button
              onClick={onReview}
              className="w-full sm:flex-1 bg-brand-charcoal text-brand-warm-white-warm rounded-full py-3 text-[14px] font-medium hover:bg-gray-800 transition-colors"
            >
              Review recipes →
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
