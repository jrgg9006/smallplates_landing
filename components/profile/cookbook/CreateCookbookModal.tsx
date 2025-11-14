"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCookbook } from "@/lib/supabase/cookbooks";
import { Cookbook } from "@/lib/types/database";

const MAX_DESCRIPTION_LENGTH = 280;

interface CreateCookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCookbookCreated?: (cookbook: Cookbook) => void;
}

export function CreateCookbookModal({ 
  isOpen, 
  onClose, 
  onCookbookCreated
}: CreateCookbookModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a cookbook name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: createError } = await createCookbook(name.trim(), description.trim() || undefined);
      
      if (createError) {
        setError(createError);
        setLoading(false);
        return;
      }

      // Success! Close modal and notify parent
      resetForm();
      onClose();
      
      if (onCookbookCreated && data) {
        onCookbookCreated(data);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error creating cookbook:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold">
            Create New Cookbook
          </DialogTitle>
          <DialogDescription>
            Give your cookbook a name and optional description
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name Field */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-600">
              Cookbook Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              placeholder="e.g., Family Favorites, Holiday Recipes"
              required
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) {
                  handleCreate();
                }
              }}
              autoFocus
            />
          </div>
          
          {/* Description Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="description" className="text-sm font-medium text-gray-600">
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
              id="description"
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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading ? 'Creating...' : 'Create Cookbook'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

