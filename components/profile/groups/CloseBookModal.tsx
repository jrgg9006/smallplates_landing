"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CloseBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReview: () => void;
  onConfirmClose: () => void;
  loading?: boolean;
  reviewed: boolean;
  recipeCount: number;
  uniqueContributors: number;
}

export function CloseBookModal({
  isOpen,
  onClose,
  onReview,
  onConfirmClose,
  loading = false,
  reviewed,
  recipeCount,
  uniqueContributors,
}: CloseBookModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold">Close the Book</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-[hsl(var(--brand-charcoal))]">
            {recipeCount} recipes from {uniqueContributors} people.{recipeCount >= 25 && <> That&apos;s a real book.</>}
          </p>
          {recipeCount < 25 && (
            <p className="text-sm text-[hsl(var(--brand-warm-gray))] mt-2">
              We recommend at least 25 recipes for a book that really feels like something.
            </p>
          )}
          <p className="text-sm text-[hsl(var(--brand-warm-gray))] mt-2">
            Once you close it, no more recipes can be added and existing recipes can&apos;t be edited. Make sure everything looks right before closing.
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Not yet
          </Button>
          {reviewed ? (
            <Button
              onClick={onConfirmClose}
              disabled={loading}
              className="flex-1 bg-black text-white hover:bg-gray-800 rounded-lg"
            >
              {loading ? 'Closing...' : 'Close the book'}
            </Button>
          ) : (
            <Button
              onClick={onReview}
              className="flex-1 bg-black text-white hover:bg-gray-800 rounded-lg"
            >
              Review recipes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
