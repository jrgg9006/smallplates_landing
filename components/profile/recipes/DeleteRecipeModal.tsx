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

interface DeleteRecipeModalProps {
  isOpen: boolean;
  recipeName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteRecipeModal({ isOpen, recipeName, onClose, onConfirm, loading = false }: DeleteRecipeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold mb-4">Delete Recipe</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-medium text-foreground">&quot;{recipeName}&quot;</span>?
            <br />
            <br />
            <span className="text-sm text-muted-foreground">This action cannot be undone.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-4">
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="order-1 sm:order-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
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

