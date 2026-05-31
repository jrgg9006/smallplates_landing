"use client";

import React from "react";
import { Lock } from "lucide-react";
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
  isOwner: boolean;
  recipeCount: number;
  uniqueContributors: number;
}

export function CloseBookModal({
  isOpen,
  onClose,
  onReview,
  onStartCloseFlow,
  reviewed,
  isOwner,
}: CloseBookModalProps) {
  // Reason: A captain can review the book, but only the owner can close & pay.
  // We catch it HERE — at the final "this is final" step — so the captain never
  // reaches Stripe just to be turned away at payment.
  const captainBlocked = reviewed && !isOwner;

  if (captainBlocked) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="gap-0 rounded-2xl p-8 sm:max-w-[460px] sm:p-10">
          <DialogHeader className="space-y-0">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(45,45,45,0.05)]">
              <Lock className="h-5 w-5 text-[hsl(var(--brand-charcoal))]" strokeWidth={1.75} />
            </div>
            <DialogTitle className="type-modal-title">
              Thanks for reviewing
            </DialogTitle>
          </DialogHeader>

          <div className="mt-5 rounded-2xl bg-[#F3F2F0] px-5 py-[18px]">
            <p className="text-[15px] leading-relaxed text-[hsl(var(--brand-charcoal))]">
              Only the <span className="font-medium">owner</span> can close and
              print this book. Let them know it&apos;s ready to go.
            </p>
          </div>

          <button
            onClick={onClose}
            className="mt-8 w-full rounded-full bg-brand-charcoal py-3.5 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.18)] focus-visible:ring-offset-2"
          >
            Got it
          </button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gap-0 rounded-2xl p-8 sm:max-w-[460px] sm:p-10">
        <DialogHeader className="space-y-0">
          <DialogTitle className="type-modal-title">
            {reviewed
              ? "Looks good? This is final."
              : "Ready to send it to print?"}
          </DialogTitle>
        </DialogHeader>

        <p className="mt-4 text-gray-600 text-base leading-relaxed">
          {reviewed
            ? "Once you close the book, recipes can't be added or edited. Next you'll choose how many copies and pay — then we print."
            : "Closing locks the recipes and sends everything to design. You'll confirm a couple of details before we print."}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            onClick={onClose}
            className="w-full rounded-full border border-[rgba(45,45,45,0.14)] py-3.5 text-[15px] font-medium text-brand-charcoal transition-colors hover:bg-[rgba(45,45,45,0.03)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.18)] focus-visible:ring-offset-2 sm:flex-1"
          >
            Not ready yet
          </button>
          <button
            onClick={reviewed ? onStartCloseFlow : onReview}
            className="w-full rounded-full bg-brand-charcoal py-3.5 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 sm:flex-1"
          >
            {reviewed ? "Review and pay →" : "Review recipes →"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
