"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateEmail } from '@/lib/supabase/profiles';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function EmailChangeForm() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
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
      setEditing(false);
      setNewEmail('');
      setCurrentPassword('');
    } catch (err) {
      setError('Failed to initiate email change. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setNewEmail('');
    setCurrentPassword('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Current email + change action */}
      <div>
        <Label className="mb-1.5 block text-sm font-medium text-[hsl(var(--brand-charcoal))]">
          Email
        </Label>
        <div className="flex items-center justify-between gap-4">
          <p className="truncate text-[hsl(var(--brand-charcoal))]">{user?.email}</p>
          {!editing && (
            <button
              type="button"
              className="text-link flex-shrink-0"
              onClick={() => {
                setEditing(true);
                setVerificationSent(false);
              }}
            >
              Change email
            </button>
          )}
        </div>
      </div>

      {/* Verification sent notice */}
      {verificationSent && (
        <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div>
            <p className="mb-1 text-sm font-medium text-green-900">Two confirmation emails sent</p>
            <p className="text-sm text-green-700">
              One went to your current address, one to the new one. Click the link in both to
              finish the change. Your current email stays active until then.
            </p>
          </div>
        </div>
      )}

      {/* Change form — only when editing */}
      {editing && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-warm-white-warm))] p-4"
        >
          <div>
            <Label
              htmlFor="newEmail"
              className="mb-1.5 block text-sm font-medium text-[hsl(var(--brand-charcoal))]"
            >
              New email
            </Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-white"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label
              htmlFor="currentPasswordEmail"
              className="mb-1.5 block text-sm font-medium text-[hsl(var(--brand-charcoal))]"
            >
              Current password
            </Label>
            <Input
              id="currentPasswordEmail"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-white"
              required
              disabled={loading}
            />
            <p className="mt-1.5 text-sm text-gray-500">Just to confirm it&apos;s you.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button type="button" className="btn btn-subtle" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-sm btn-dark min-w-[140px]" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Change email'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
