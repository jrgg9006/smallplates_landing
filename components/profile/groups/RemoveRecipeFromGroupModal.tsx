"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RemoveRecipeFromGroupModalProps {
  isOpen: boolean;
  recipeName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function RemoveRecipeFromGroupModal({
  isOpen,
  recipeName,
  onClose,
  onConfirm,
  loading = false,
}: RemoveRecipeFromGroupModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="type-modal-title">
            Remove Recipe
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to remove <span className="font-medium text-gray-800">&ldquo;{recipeName}&rdquo;</span> from this cookbook?
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-secondary-sm text-gray-500">
              <strong>Note:</strong> This recipe will be removed from this book and won&apos;t be printed.
            </p>
          </div>
        </div>
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
            {loading ? 'Removing...' : 'Remove Recipe'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

