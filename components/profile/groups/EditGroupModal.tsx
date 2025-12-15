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
import { updateGroup } from "@/lib/supabase/groups";
import { GroupWithMembers } from "@/lib/types/database";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupWithMembers | null;
  onGroupUpdated?: (group: GroupWithMembers) => void;
}

const MAX_NAME_LENGTH = 30;

export function EditGroupModal({ 
  isOpen, 
  onClose, 
  group,
  onGroupUpdated
}: EditGroupModalProps) {
  const [name, setName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [weddingDateUndecided, setWeddingDateUndecided] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setWeddingDate(group.wedding_date || '');
      setWeddingDateUndecided(group.wedding_date_undecided || false);
    }
  }, [group, isOpen]);

  const resetForm = () => {
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!group) return;
    
    if (!name.trim()) {
      setError('Please enter a book name');
      return;
    }

    if (name.length > MAX_NAME_LENGTH) {
      setError(`Book name cannot exceed ${MAX_NAME_LENGTH} characters`);
      return;
    }

    const trimmedName = name.trim();
    
    // Check if anything changed
    const hasChanges = 
      trimmedName !== group.name ||
      weddingDate !== (group.wedding_date || '') ||
      weddingDateUndecided !== (group.wedding_date_undecided || false);

    if (!hasChanges) {
      // No change, just close
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateData: any = { 
        name: trimmedName,
        wedding_date: weddingDate || null,
        wedding_date_undecided: weddingDateUndecided
      };

      // If they set a specific date, mark as not undecided
      if (weddingDate) {
        updateData.wedding_date_undecided = false;
      }

      const { data, error: updateError } = await updateGroup(group.id, updateData);
      
      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      // Success! Close modal and notify parent
      resetForm();
      onClose();
      
      if (onGroupUpdated && data) {
        // Transform the updated data to match GroupWithMembers interface
        const updatedGroup: GroupWithMembers = {
          ...group,
          ...data,
        };
        onGroupUpdated(updatedGroup);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating group:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!group) return null;

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
              placeholder="e.g., Family Recipes, Book Club"
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
                Book name cannot exceed {MAX_NAME_LENGTH} characters.
              </p>
            )}
          </div>

          {/* Wedding Date Section */}
          <div>
            <Label className="text-sm font-medium text-gray-600 mb-3 block">
              Wedding Date
            </Label>

            {/* Date picker - show first */}
            <div className="mb-3">
              <Input
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                disabled={weddingDateUndecided}
                className={weddingDateUndecided ? 'opacity-50' : ''}
                placeholder="Select wedding date"
              />
            </div>
            
            {/* Date is undecided checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="wedding-undecided"
                checked={weddingDateUndecided}
                onChange={(e) => {
                  setWeddingDateUndecided(e.target.checked);
                  if (e.target.checked) {
                    setWeddingDate(''); // Clear date if marking as undecided
                  }
                }}
                className="mr-3 h-4 w-4 text-[hsl(var(--brand-honey))] border-gray-300 rounded focus:ring-[hsl(var(--brand-honey))]"
              />
              <label htmlFor="wedding-undecided" className="text-sm text-gray-700">
                Wedding date is still undecided
              </label>
            </div>

            {weddingDateUndecided && (
              <p className="text-xs text-gray-500 italic mt-2">
                Your cookbook will show &ldquo;Celebrations planned&rdquo; until you set a date
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