"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RemoveRecipeFromGroupModalProps {
  isOpen: boolean;
  recipeName: string;
  isOwnRecipe?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function RemoveRecipeFromGroupModal({ 
  isOpen, 
  recipeName, 
  isOwnRecipe = false,
  onClose, 
  onConfirm, 
  loading = false 
}: RemoveRecipeFromGroupModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold mb-4">
            Remove Plate
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <span className="font-medium text-foreground">&quot;{recipeName}&quot;</span> from this cookbook?
            <br />
            <br />
            <span className="text-sm text-muted-foreground">
              You will remove this plate from this book - but the recipe will not be deleted.
              {isOwnRecipe && " If this was your own recipe, it will still be available in &quot;My Recipes&quot;."}
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-4">
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="order-1 sm:order-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Removing...' : 'Remove'}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="order-2 sm:order-1"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

