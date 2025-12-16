"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGroup } from "@/lib/supabase/groups";
import type { GroupFormData } from "@/lib/types/database";

const MAX_NAME_LENGTH = 30;

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: () => void;
}

export function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  // Responsive hook to detect mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640); // sm breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Form state
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user profile when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    // Reset form data when modal opens
    setFormData({
      name: '',
    });
    setError(null);
  };

  const handleInputChange = (field: keyof GroupFormData, value: string) => {
    // Apply character limits
    if (field === 'name' && value.length > MAX_NAME_LENGTH) {
      return; // Don't update if name exceeds limit
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      setError('Book name is required');
      return;
    }

    if (formData.name.length > MAX_NAME_LENGTH) {
      setError(`Book name cannot exceed ${MAX_NAME_LENGTH} characters`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: createError } = await createGroup(formData);

      if (createError) {
        setError(createError);
        return;
      }

      // Success! Close modal and notify parent
      onClose();
      if (onGroupCreated) {
        onGroupCreated();
      }
    } catch (err) {
      console.error('Error creating cookbook:', err);
      setError('Failed to create cookbook. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sheetContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <SheetHeader className="pb-6">
        <SheetTitle className="text-2xl font-serif">Create New Book</SheetTitle>
      </SheetHeader>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 space-y-6">
          {/* Group Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="groupName" className="text-base font-medium">
                Book Name *
              </Label>
              <span className={`text-xs ${
                formData.name.length > MAX_NAME_LENGTH 
                  ? 'text-red-600 font-medium' 
                  : formData.name.length > MAX_NAME_LENGTH * 0.9 
                    ? 'text-orange-600' 
                    : 'text-gray-500'
              }`}>
                {formData.name.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
            <Input
              id="groupName"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Family Recipes, Book Club"
              className={`text-base ${
                formData.name.length > MAX_NAME_LENGTH 
                  ? 'border-red-300 focus:ring-red-500' 
                  : ''
              }`}
              maxLength={MAX_NAME_LENGTH}
              required
              disabled={loading}
            />
            {formData.name.length > MAX_NAME_LENGTH && (
              <p className="text-xs text-red-600">
                Book name cannot exceed {MAX_NAME_LENGTH} characters.
              </p>
            )}
          </div>


          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-gray-200">
          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
            disabled={loading || !formData.name.trim() || formData.name.length > MAX_NAME_LENGTH}
          >
            {loading ? 'Creating...' : 'Create New Book'}
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={`
          ${isMobile 
            ? "h-[90vh] max-h-[90vh] w-full rounded-t-xl" 
            : "w-full sm:max-w-lg h-full"
          }
          p-6 overflow-y-auto
        `}
      >
        {sheetContent}
      </SheetContent>
    </Sheet>
  );
}