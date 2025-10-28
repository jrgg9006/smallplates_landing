"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateEmail } from '@/lib/supabase/profiles';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CheckCircle, AlertCircle, Loader2, Mail, Shield } from 'lucide-react';

export function EmailChangeForm() {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const validateForm = () => {
    if (!newEmail.trim()) {
      setError('Please enter a new email address');
      return false;
    }

    // Email validation
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
    setSuccess(false);

    try {
      const { error } = await updateEmail(newEmail.trim(), currentPassword);

      if (error) {
        setError(error);
        return;
      }

      setVerificationSent(true);
      setSuccess(true);
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
    setSuccess(false);
    setVerificationSent(false);
  };

  return (
    <div className="space-y-6">
      {/* Current Email Display */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Current Email</span>
        </div>
        <p className="text-blue-800 font-medium">{user?.email}</p>
      </div>

      {/* Verification Success Message */}
      {verificationSent && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900 mb-1">
              Verification Email Sent!
            </p>
            <p className="text-sm text-green-700">
              We&apos;ve sent a verification email to <strong>{newEmail}</strong>. 
              Click the link in the email to confirm your new email address.
            </p>
            <p className="text-xs text-green-600 mt-2">
              Check your spam folder if you don&apos;t see the email within a few minutes.
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
          <div className="flex items-center gap-2 mt-1">
            <Shield className="h-3 w-3 text-gray-400" />
            <p className="text-xs text-gray-500">
              Required to confirm your identity for this security-sensitive change
            </p>
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
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading || verificationSent}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Verification...
              </>
            ) : verificationSent ? (
              'Verification Sent'
            ) : (
              'Change Email'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1"
          >
            {verificationSent ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </form>

      {/* Security Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 mb-1">Security Notice</p>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• You&apos;ll need to verify the new email before the change takes effect</li>
              <li>• Your current email will remain active until verification is complete</li>
              <li>• You&apos;ll receive notifications on both emails during the transition</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}