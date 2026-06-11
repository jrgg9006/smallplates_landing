"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updatePassword } from '@/lib/supabase/profiles';
import { CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const REQUIREMENTS = [
  { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'One number', test: (pw: string) => /\d/.test(pw) },
];

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

function PasswordField({ id, label, value, onChange, disabled }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <Label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-[hsl(var(--brand-charcoal))]"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white pr-10"
          required
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function PasswordChangeForm() {
  const [editing, setEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const metRequirements = REQUIREMENTS.filter((r) => r.test(newPassword)).length;

  const validateForm = () => {
    if (!currentPassword.trim()) {
      setError('Please enter your current password');
      return false;
    }

    if (metRequirements < REQUIREMENTS.length) {
      setError('Your new password doesn’t meet all the requirements yet');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return false;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from your current password');
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
      const { error } = await updatePassword(currentPassword, newPassword);

      if (error) {
        setError(error);
        return;
      }

      setEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Current state + change action */}
      <div>
        <Label className="mb-1.5 block text-sm font-medium text-[hsl(var(--brand-charcoal))]">
          Password
        </Label>
        <div className="flex items-center justify-between gap-4">
          <p className="tracking-widest text-[hsl(var(--brand-charcoal))]">••••••••</p>
          {!editing && (
            <button
              type="button"
              className="text-link flex-shrink-0"
              onClick={() => {
                setEditing(true);
                setSuccess(false);
              }}
            >
              Change password
            </button>
          )}
        </div>
      </div>

      {/* Success notice */}
      {success && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3">
          <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
          <p className="text-sm text-green-700">Password updated.</p>
        </div>
      )}

      {/* Change form — only when editing */}
      {editing && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-[hsl(var(--brand-border))] bg-[hsl(var(--brand-warm-white-warm))] p-4"
        >
          <PasswordField
            id="currentPassword"
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            disabled={loading}
          />

          <div className="space-y-2">
            <PasswordField
              id="newPassword"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              disabled={loading}
            />

            {/* Requirements — only once the user starts typing */}
            {newPassword && (
              <ul className="space-y-0.5 text-sm">
                {REQUIREMENTS.map((req) => {
                  const met = req.test(newPassword);
                  return (
                    <li
                      key={req.label}
                      className={`flex items-center gap-1.5 ${met ? 'text-green-600' : 'text-gray-500'}`}
                    >
                      <CheckCircle
                        className={`h-3.5 w-3.5 ${met ? 'text-green-600' : 'text-[hsl(var(--brand-border-button))]'}`}
                      />
                      {req.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <PasswordField
              id="confirmPassword"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={loading}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
            )}
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
            <button type="submit" className="btn btn-sm btn-dark min-w-[160px]" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update password'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
