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
import { getCurrentProfile } from "@/lib/supabase/profiles";
import type { GroupFormData, GroupVisibility, Profile } from "@/lib/types/database";

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
    description: '',
    visibility: 'private',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  // Load user profile when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    const { data: profile } = await getCurrentProfile();
    if (profile) {
      setUserProfile(profile);
      
      // Generate default name from couple names
      let defaultName = '';
      if (profile.couple_first_name && profile.partner_first_name) {
        defaultName = `${profile.couple_first_name} & ${profile.partner_first_name}`;
      }
      
      setFormData({
        name: defaultName,
        visibility: 'private',
      });
    } else {
      // No profile data, use empty name
      setFormData({
        name: '',
        visibility: 'private',
      });
    }
    setError(null);
  };

  const handleInputChange = (field: keyof GroupFormData, value: string) => {
    // Apply character limits
    if (field === 'name' && value.length > MAX_NAME_LENGTH) {
      return; // Don't update if name exceeds limit
    }
    if (field === 'description' && value.length > MAX_DESCRIPTION_LENGTH) {
      return; // Don't update if description exceeds limit
    }
    
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
            {userProfile?.couple_first_name && userProfile?.partner_first_name && 
             formData.name === `${userProfile.couple_first_name} & ${userProfile.partner_first_name}` && (
              <p className="text-xs text-[hsl(var(--brand-warm-gray))] italic">
                Using names from your profile. You can edit this if you'd like.
              </p>
            )}
            {formData.name.length > MAX_NAME_LENGTH && (
              <p className="text-xs text-red-600">
                Book name cannot exceed {MAX_NAME_LENGTH} characters.
              </p>
            )}
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
                    <div className="text-sm text-gray-500">Only invited members can see this cookbook</div>
                  </div>
                </SelectItem>
                <SelectItem value="public" disabled className="opacity-50 cursor-not-allowed">
                  <div>
                    <div className="font-medium text-gray-400">Public</div>
                    <div className="text-sm text-gray-400">Anyone can find and join this cookbook</div>
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