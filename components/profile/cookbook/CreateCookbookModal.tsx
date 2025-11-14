"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  const [isMobile, setIsMobile] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const modalContent = (
    <>
      <div className="space-y-6 pb-24 pr-4">
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
              <SheetTitle className="font-serif text-2xl font-semibold mb-4">Create New Cookbook</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col overflow-y-auto">
              {modalContent}
            </div>
            
            {/* Create Button */}
            <div className="mt-4 pb-safe">
              <Button 
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Cookbook'}
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
          <SheetTitle className="font-serif text-2xl font-semibold mb-4">Create New Cookbook</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col relative overflow-y-auto">
          {modalContent}
          
          {/* Create Button - Fixed position in bottom right */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-auto">
            <Button 
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Cookbook'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

