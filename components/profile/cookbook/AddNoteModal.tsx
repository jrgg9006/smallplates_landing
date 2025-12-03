"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateCookbookRecipeNote } from "@/lib/supabase/cookbooks";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cookbookId: string | null;
  recipeId: string | null;
  currentNote: string | null;
  recipeName?: string;
  onNoteUpdated?: () => void;
}

export function AddNoteModal({ 
  isOpen, 
  onClose, 
  cookbookId,
  recipeId,
  currentNote,
  recipeName,
  onNoteUpdated
}: AddNoteModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load current note when modal opens
  useEffect(() => {
    if (isOpen) {
      setNote(currentNote || '');
      setError(null);
    }
  }, [isOpen, currentNote]);

  const resetForm = () => {
    setNote('');
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!cookbookId || !recipeId) {
      setError('Missing cookbook or recipe information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await updateCookbookRecipeNote(
        cookbookId,
        recipeId,
        note.trim() || null
      );
      
      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      // Success! Close modal and refresh
      resetForm();
      onClose();
      
      if (onNoteUpdated) {
        onNoteUpdated();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating note:', err);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <>
      <div className="space-y-6 pb-24 pr-4">
        {/* Recipe Info */}
        {recipeName && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Note for:</p>
            <p className="font-medium text-gray-900">{recipeName}</p>
          </div>
        )}

        {/* Note Field */}
        <div>
          <Label htmlFor="note" className="text-sm font-medium text-gray-600">
            Note
          </Label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[150px]"
            placeholder="Add a personal note about this recipe in your cookbook..."
          />
          <p className="mt-1 text-xs text-gray-500">
            This note will appear in your cookbook for this recipe.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </>
  );

  // Mobile version
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="!h-[85vh] !max-h-[85vh] rounded-t-[20px] flex flex-col overflow-hidden p-0">
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-gray-300" />
          
          <div className="p-6 flex flex-col h-full overflow-hidden">
            <SheetHeader className="px-0">
              <SheetTitle className="font-serif text-2xl font-semibold mb-4">
                {currentNote ? 'Edit Personal Note' : 'Add Personal Note'}
              </SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col overflow-y-auto">
              {modalContent}
            </div>
            
            {/* Save Button */}
            <div className="mt-4 pb-safe">
              <Button 
                onClick={handleSave}
                disabled={loading || !cookbookId || !recipeId}
                className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="!w-[45%] !max-w-none h-full flex flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl font-semibold mb-4">
            {currentNote ? 'Edit Personal Note' : 'Add Personal Note'}
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col relative overflow-y-auto">
          {modalContent}
          
          {/* Save Button - Fixed position in bottom right */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-auto">
            <Button 
              onClick={handleSave}
              disabled={loading || !cookbookId || !recipeId}
              className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

