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
}

export function DeleteGuestModal({ isOpen, guestName, onClose, onConfirm }: DeleteGuestModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold mb-4">Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-medium text-foreground">{guestName}</span> and all guest information?
            <br />
            <br />
            <span className="text-sm text-muted-foreground">This cannot be undone</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-4">
          <Button
            onClick={onConfirm}
            className="order-1 sm:order-2 bg-black text-white hover:bg-gray-800"
          >
            Delete
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="order-2 sm:order-1"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}