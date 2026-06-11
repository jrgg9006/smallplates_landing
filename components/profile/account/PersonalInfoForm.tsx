"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentProfile, updatePersonalInfo, getSelfGuestPrintedName } from '@/lib/supabase/profiles';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function PersonalInfoForm() {
  const [fullName, setFullName] = useState('');
  const [printedName, setPrintedName] = useState('');
  const [original, setOriginal] = useState({ fullName: '', printedName: '' });
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isDirty = fullName !== original.fullName || printedName !== original.printedName;

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

        // Load printed_name from guest record
        const { data: guestPrintedName } = await getSelfGuestPrintedName();

        setFullName(profile?.full_name || '');
        setPrintedName(guestPrintedName || '');
        setOriginal({
          fullName: profile?.full_name || '',
          printedName: guestPrintedName || '',
        });
      } catch (err) {
        setError('Failed to load profile data');
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await updatePersonalInfo({
        full_name: fullName.trim(),
        // Reason: null clears the value in DB so the book falls back to the real name; undefined would skip the update
        printed_name: printedName.trim() || null,
      });

      if (error) {
        setError(error);
        return;
      }

      setOriginal({ fullName: fullName.trim(), printedName: printedName.trim() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFullName(original.fullName);
    setPrintedName(original.printedName);
    setError(null);
    setSuccess(false);
  };

  if (loadingProfile) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-1/4 rounded bg-[hsl(var(--brand-sand))]/60"></div>
        <div className="h-10 rounded bg-[hsl(var(--brand-sand))]/60"></div>
        <div className="h-4 w-1/4 rounded bg-[hsl(var(--brand-sand))]/60"></div>
        <div className="h-10 rounded bg-[hsl(var(--brand-sand))]/60"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <Label
          htmlFor="fullName"
          className="mb-1.5 block text-sm font-medium text-[hsl(var(--brand-charcoal))]"
        >
          Name
        </Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full bg-white"
          required
        />
      </div>

      {/* Printed Name */}
      <div>
        <Label
          htmlFor="printedName"
          className="mb-1.5 block text-sm font-medium text-[hsl(var(--brand-charcoal))]"
        >
          Name in the book
        </Label>
        <Input
          id="printedName"
          type="text"
          value={printedName}
          onChange={(e) => setPrintedName(e.target.value)}
          className="w-full bg-white"
          placeholder="e.g. Rich G."
        />
        <p className="mt-1.5 text-sm text-gray-500">
          {printedName.trim() ? (
            <>
              Printed next to your recipes as{' '}
              <span className="font-medium text-[hsl(var(--brand-charcoal))]">
                {printedName.trim()}
              </span>
            </>
          ) : (
            'How your name appears next to your recipes. Leave blank to use your name.'
          )}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3">
          <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
          <p className="text-sm text-green-700">Saved.</p>
        </div>
      )}

      {/* Form Actions — only shown once something changed */}
      {isDirty && (
        <div className="flex items-center justify-end gap-3">
          <button type="button" className="btn btn-subtle" onClick={handleCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-sm btn-dark min-w-[120px]" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      )}
    </form>
  );
}
