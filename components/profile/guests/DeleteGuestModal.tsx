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
          <DialogTitle className="font-serif text-2xl font-semibold mb-4">Remove Guest</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <span className="font-medium text-foreground">{guestName}</span> from your guest list?
            <br />
            <br />
            <span className="text-sm text-muted-foreground">The guest and their recipes will be archived but not permanently deleted</span>
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