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
import type { GroupFormData, GroupVisibility } from "@/lib/types/database";

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
    description: '',
    visibility: 'private',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        visibility: 'private',
      });
      setError(null);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof GroupFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVisibilityChange = (value: GroupVisibility) => {
    setFormData(prev => ({
      ...prev,
      visibility: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: createError } = await createGroup(formData);

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
      console.error('Error creating group:', err);
      setError('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sheetContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <SheetHeader className="pb-6">
        <SheetTitle className="text-2xl font-serif">Create New Group</SheetTitle>
      </SheetHeader>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 space-y-6">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-base font-medium">
              Group Name *
            </Label>
            <Input
              id="groupName"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Family Recipes, Book Club, Holiday Traditions"
              className="text-base"
              required
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="groupDescription" className="text-base font-medium">
              Description
            </Label>
            <textarea
              id="groupDescription"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="What's this group about? (optional)"
              className="w-full p-3 border border-gray-300 rounded-md text-base min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label htmlFor="groupVisibility" className="text-base font-medium">
              Privacy
            </Label>
            <Select 
              value={formData.visibility} 
              onValueChange={handleVisibilityChange}
              disabled={loading}
            >
              <SelectTrigger className="text-base">
                <SelectValue placeholder="Choose privacy setting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div>
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-gray-500">Only invited members can see this group</div>
                  </div>
                </SelectItem>
                <SelectItem value="public" disabled className="opacity-50 cursor-not-allowed">
                  <div>
                    <div className="font-medium text-gray-400">Public</div>
                    <div className="text-sm text-gray-400">Anyone can find and join this group</div>
                    <div className="text-xs text-gray-400 mt-1 font-medium">Coming soon</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
            disabled={loading || !formData.name.trim()}
          >
            {loading ? 'Creating...' : 'Create Group'}
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