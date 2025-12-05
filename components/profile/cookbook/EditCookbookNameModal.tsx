"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCookbook } from "@/lib/supabase/cookbooks";
import { Cookbook } from "@/lib/types/database";

interface EditCookbookNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  cookbook: Cookbook | null;
  onCookbookUpdated?: (cookbook: Cookbook) => void;
}

const MAX_DESCRIPTION_LENGTH = 280;
const MAX_NAME_LENGTH = 30;

export function EditCookbookNameModal({ 
  isOpen, 
  onClose, 
  cookbook,
  onCookbookUpdated
}: EditCookbookNameModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cookbook) {
      setName(cookbook.name || '');
      setDescription(cookbook.description || '');
    }
  }, [cookbook, isOpen]);

  const resetForm = () => {
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!cookbook) return;
    
    if (!name.trim()) {
      setError('Please enter a book name');
      return;
    }

    if (name.length > MAX_NAME_LENGTH) {
      setError(`Book name cannot exceed ${MAX_NAME_LENGTH} characters`);
      return;
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim() || null;
    
    // Check if anything changed
    if (trimmedName === cookbook.name && trimmedDescription === (cookbook.description || null)) {
      // No change, just close
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await updateCookbook(cookbook.id, { 
        name: trimmedName,
        description: trimmedDescription
      });
      
      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      // Success! Close modal and notify parent
      resetForm();
      onClose();
      
      if (onCookbookUpdated && data) {
        onCookbookUpdated(data);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating cookbook:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!cookbook) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold">
            Edit Cookbook
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Name Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="edit-name" className="text-sm font-medium text-gray-600">
                Book Name *
              </Label>
              <span className={`text-xs ${
                name.length > MAX_NAME_LENGTH 
                  ? 'text-red-600 font-medium' 
                  : name.length > MAX_NAME_LENGTH * 0.9 
                    ? 'text-orange-600' 
                    : 'text-gray-500'
              }`}>
                {name.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length <= MAX_NAME_LENGTH) {
                  setName(newValue);
                }
              }}
              className={`mt-1 ${
                name.length > MAX_NAME_LENGTH 
                  ? 'border-red-300 focus:ring-red-500' 
                  : ''
              }`}
              placeholder="e.g., Family Favorites"
              required
              maxLength={MAX_NAME_LENGTH}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim() && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              autoFocus
            />
            {name.length > MAX_NAME_LENGTH && (
              <p className="mt-1 text-xs text-red-600">
                Name cannot exceed {MAX_NAME_LENGTH} characters.
              </p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="edit-description" className="text-sm font-medium text-gray-600">
                Description (Optional)
              </Label>
              <span className={`text-xs ${
                description.length > MAX_DESCRIPTION_LENGTH 
                  ? 'text-red-600 font-medium' 
                  : description.length > MAX_DESCRIPTION_LENGTH * 0.9 
                    ? 'text-orange-600' 
                    : 'text-gray-500'
              }`}>
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length <= MAX_DESCRIPTION_LENGTH) {
                  setDescription(newValue);
                }
              }}
              className={`mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[100px] ${
                description.length > MAX_DESCRIPTION_LENGTH 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="Add a description for this cookbook..."
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            {description.length > MAX_DESCRIPTION_LENGTH && (
              <p className="mt-1 text-xs text-red-600">
                Description cannot exceed {MAX_DESCRIPTION_LENGTH} characters.
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
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
            onClick={handleSave}
            disabled={loading || !name.trim() || name.length > MAX_NAME_LENGTH}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

