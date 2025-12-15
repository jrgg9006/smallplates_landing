"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold">
            Remove Recipe
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to remove <span className="font-medium text-gray-800">&ldquo;{recipeName}&rdquo;</span> from this cookbook?
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-xs text-gray-500">
              <strong>Note:</strong> The recipe won&apos;t be deleted—just removed from this book.
              {isOwnRecipe && " Since this is your recipe, it will remain in your personal collection."}
            </p>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-black text-white hover:bg-gray-800"
            disabled={loading}
          >
            {loading ? 'Removing...' : 'Remove Recipe'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

