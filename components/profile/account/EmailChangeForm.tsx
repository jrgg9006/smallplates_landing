"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateEmail } from '@/lib/supabase/profiles';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';

export function EmailChangeForm() {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const validateForm = () => {
    if (!newEmail.trim()) {
      setError('Please enter a new email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setError('Please enter a valid email address');
      return false;
    }

    if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      setError('New email must be different from your current email');
      return false;
    }

    if (!currentPassword.trim()) {
      setError('Please enter your current password to confirm this change');
      return false;
    }

    if (currentPassword.length < 6) {
      setError('Password must be at least 6 characters long');
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

    try {
      const { error } = await updateEmail(newEmail.trim(), currentPassword);

      if (error) {
        setError(error);
        return;
      }

      setVerificationSent(true);
      setNewEmail('');
      setCurrentPassword('');
    } catch (err) {
      setError('Failed to initiate email change. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewEmail('');
    setCurrentPassword('');
    setError(null);
    setVerificationSent(false);
  };

  return (
    <div className="space-y-6">
      {/* Current Email Display */}
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">
          Current Email
        </Label>
        <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
          {user?.email}
        </div>
      </div>

      {/* Verification Success Message */}
      {verificationSent && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900 mb-1">Verification email sent</p>
            <p className="text-sm text-green-700">
              Check your inbox and click the link to confirm the change. Your current email stays
              active until then.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Email */}
        <div>
          <Label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1">
            New Email Address *
          </Label>
          <Input
            id="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full"
            placeholder="Enter your new email address"
            required
            disabled={loading || verificationSent}
          />
        </div>

        {/* Current Password Confirmation */}
        <div>
          <Label htmlFor="currentPasswordEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Current Password *
          </Label>
          <Input
            id="currentPasswordEmail"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full"
            placeholder="Enter your current password"
            required
            disabled={loading || verificationSent}
          />
          <div className="flex items-center gap-1.5 mt-1">
            <Shield className="h-3 w-3 text-gray-400" />
            <p className="text-sm text-gray-500">Required to confirm your identity</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {verificationSent ? 'Close' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            disabled={loading || verificationSent}
            className="bg-gray-900 text-white hover:bg-gray-800 min-w-[130px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : verificationSent ? (
              'Sent'
            ) : (
              'Change Email'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
