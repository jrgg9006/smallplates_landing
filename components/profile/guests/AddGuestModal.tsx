"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addGuest, checkGuestExists } from "@/lib/supabase/guests";
import type { GuestFormData } from "@/lib/types/database";
import { OnboardingBadge } from "@/components/onboarding/OnboardingBadge";

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestAdded?: (guestId?: string) => void; // Callback to refresh the guest list, optionally with new guest ID
  isFirstGuest?: boolean; // Show onboarding badge for first guest
  groupId?: string; // Optional group ID for adding guest to specific group
}

export function AddGuestModal({ isOpen, onClose, onGuestAdded, isFirstGuest = false, groupId }: AddGuestModalProps) {

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [printedName, setPrintedName] = useState('');
  const [email, setEmail] = useState('');
  // const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPrintedName('');
    setEmail('');
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      setError('Please fill in First Name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if guest email already exists in this group (only if email is provided)
      if (email.trim()) {
        const emailExists = await checkGuestExists(email, groupId);
        
        if (emailExists) {
          setError('A guest with this email already exists in this group');
          setLoading(false);
          return;
        }
      }

      // Prepare guest data
      const guestData: GuestFormData = {
        first_name: firstName.trim(),
        last_name: lastName.trim() || '',
        printed_name: printedName.trim() || undefined,
        email: email.trim() || undefined,
        group_id: groupId,
      };

      // Add the guest to the database
      const { data: newGuest, error } = await addGuest(guestData);

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      // Success! Reset form and close modal
      resetForm();
      onClose();
      
      // Refresh the guest list if callback provided, passing the new guest ID
      if (onGuestAdded) {
        onGuestAdded(newGuest?.id);
      }

    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error adding guest:', err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold">
            Add Guest
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Onboarding Badge - Show only for first guest */}
          {isFirstGuest && (
            <OnboardingBadge
              stepNumber={2}
              title="Step 2 of Onboarding"
              message="Your first guest! Nothing will be sent yet. Just add their name and click save to continue your journey."
            />
          )}
          
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-600">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1"
                placeholder="First Name"
                required
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-600">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1"
                placeholder="Last Name"
              />
            </div>
          </div>

          {/* Printed Name */}
          <div>
            <Label htmlFor="printedName" className="text-sm font-medium text-gray-600">
              Printed Name
            </Label>
            <Input
              id="printedName"
              value={printedName}
              onChange={(e) => setPrintedName(e.target.value)}
              className="mt-1"
              placeholder="How this person's name should appear in the book"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use first and last name. This is how the name will appear in the printed cookbook.
            </p>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-600">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              placeholder="Email address"
            />
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
            disabled={loading || !firstName.trim()}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}