"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentProfile, updatePersonalInfo } from '@/lib/supabase/profiles';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function PersonalInfoForm() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
          setFullName(profile.full_name || '');
          setPhoneNumber(profile.phone_number || '');
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
    if (!fullName.trim()) {
      setError('Please enter your full name');
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
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || undefined,
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
      {/* Full Name */}
      <div>
        <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full"
          placeholder="Enter your full name"
          required
        />
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