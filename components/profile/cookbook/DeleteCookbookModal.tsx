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
import { Cookbook } from "@/lib/types/database";
import { AlertTriangle } from "lucide-react";

interface DeleteCookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  cookbook: Cookbook | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteCookbookModal({
  isOpen,
  onClose,
  cookbook,
  onConfirm,
  loading = false,
}: DeleteCookbookModalProps) {
  if (!cookbook) return null;

  const isGroupCookbook = cookbook.is_group_cookbook;
  const actionText = isGroupCookbook ? "Exit Shared Cookbook" : "Delete Cookbook";
  const warningText = isGroupCookbook 
    ? "You will no longer have access to this shared cookbook and its recipes. You can be re-invited later."
    : "This action cannot be undone. The cookbook and all its recipe organization will be permanently deleted.";
  const buttonText = isGroupCookbook ? "Exit Cookbook" : "Delete Cookbook";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {actionText}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to {isGroupCookbook ? 'exit' : 'delete'}{' '}
              <span className="font-medium">&ldquo;{cookbook.name}&rdquo;</span>?
            </p>
            <p className="text-sm text-gray-500">
              {warningText}
            </p>
          </div>
          
          {!isGroupCookbook && cookbook.is_default && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> This is your default cookbook. A new default cookbook will be created automatically.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (isGroupCookbook ? 'Exiting...' : 'Deleting...') : buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}