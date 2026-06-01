"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteGuestModalProps {
  isOpen: boolean;
  guestName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteGuestModal({ isOpen, guestName, onClose, onConfirm, loading = false }: DeleteGuestModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="type-modal-title mb-4">Remove Guest</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <span className="font-medium text-foreground">{guestName}</span> from your guest list?
            <br />
            <br />
            <span className="text-sm text-muted-foreground">The guest and their recipes will be archived but not permanently deleted</span>
          </DialogDescription>
        </DialogHeader>
        {/* Action Buttons — standardized modal footer */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full rounded-full border border-[rgba(45,45,45,0.14)] py-3.5 text-[15px] font-medium text-brand-charcoal transition-colors hover:bg-[rgba(45,45,45,0.03)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.18)] focus-visible:ring-offset-2 disabled:opacity-50 sm:flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full rounded-full bg-brand-charcoal py-3.5 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 disabled:opacity-50 sm:flex-1"
          >
            {loading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}