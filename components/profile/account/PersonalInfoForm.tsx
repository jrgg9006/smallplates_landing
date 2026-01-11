"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentProfile, updatePersonalInfo, getSelfGuestPrintedName } from '@/lib/supabase/profiles';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function PersonalInfoForm() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [printedName, setPrintedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load current profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoadingProfile(true);
        const { data: profile, error } = await getCurrentProfile();

        if (error) {
          setError('Failed to load profile data');
          return;
        }

        if (profile) {
          // Split full_name into first and last name
          const nameParts = (profile.full_name || '').trim().split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setPhoneNumber(profile.phone_number || '');
        }

        // Load printed_name from guest record
        const { data: guestPrintedName } = await getSelfGuestPrintedName();
        if (guestPrintedName) {
          setPrintedName(guestPrintedName);
        }
      } catch (err) {
        setError('Failed to load profile data');
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, []);

  const validateForm = () => {
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return false;
    }

    // Basic phone validation (optional field)
    if (phoneNumber.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updates = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim() || undefined,
        printed_name: printedName.trim() || undefined,
      };

      const { error } = await updatePersonalInfo(updates);

      if (error) {
        setError(error);
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values (reload from server)
    setError(null);
    setSuccess(false);
    // Re-trigger the useEffect to reload data
    setLoadingProfile(true);
  };

  if (loadingProfile) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full"
            placeholder="First name"
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full"
            placeholder="Last name"
          />
        </div>
      </div>

      {/* Phone Number */}
      <div>
        <Label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full"
          placeholder="+1 (555) 123-4567"
        />
        <p className="text-xs text-gray-500 mt-1">Optional - used for order notifications</p>
      </div>

      {/* Printed Name */}
      <div>
        <Label htmlFor="printedName" className="block text-sm font-medium text-gray-700 mb-1">
          Printed Name
        </Label>
        <Input
          id="printedName"
          type="text"
          value={printedName}
          onChange={(e) => setPrintedName(e.target.value)}
          className="w-full"
          placeholder="e.g. Rich G."
        />
        <p className="text-xs text-gray-500 mt-1">How your name appears in printed cookbooks</p>
      </div>

      {/* Email Display (Read-only) */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </Label>
        <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
          {user?.email}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          To change your email, use the Email Change section below
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-600">Personal information updated successfully!</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}