"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteAccount } from '@/lib/supabase/profiles';
import { AlertTriangle, Loader2, X, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CONFIRMATION_TEXT = 'DELETE MY ACCOUNT';

export function DangerZone() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCancel = () => {
    setShowDeleteModal(false);
    setCurrentPassword('');
    setConfirmationText('');
    setError(null);
  };

  // Close on Escape while the confirmation modal is open
  useEffect(() => {
    if (!showDeleteModal) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        handleCancel();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleteModal, loading]);

  const validateDeletion = () => {
    if (!currentPassword.trim()) {
      setError('Please enter your current password');
      return false;
    }

    if (confirmationText !== CONFIRMATION_TEXT) {
      setError(`Please type "${CONFIRMATION_TEXT}" exactly to confirm`);
      return false;
    }

    return true;
  };

  const handleDeleteAccount = async () => {
    if (!validateDeletion()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await deleteAccount(currentPassword);

      if (error) {
        setError(error);
        return;
      }

      const msg =
        data?.deletionType === 'soft'
          ? 'Account deactivated. Your book data is preserved.'
          : 'Account permanently deleted.';

      setSuccessMessage(msg);
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      setError('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-600">
        Once deleted, this can&apos;t be undone. If you have books or recipes, your account is
        deactivated and the data stays. Otherwise it&apos;s permanently removed.
      </p>

      <button
        type="button"
        onClick={() => setShowDeleteModal(true)}
        className="btn mt-4 px-6 py-2.5 text-sm border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
      >
        Delete account
      </button>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) handleCancel();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="w-full max-w-md space-y-6 rounded-lg bg-white p-6"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3
                  id="delete-account-title"
                  className="font-serif text-xl font-medium text-[hsl(var(--brand-charcoal))]"
                >
                  Delete account
                </h3>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
                disabled={loading}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success state */}
            {successMessage ? (
              <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <p className="text-sm text-green-800">{successMessage} Redirecting...</p>
              </div>
            ) : (
              <>
                {/* Warning */}
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800">
                    This action is irreversible. All your data will be deleted and cannot be
                    recovered.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Password Confirmation */}
                  <div>
                    <Label
                      htmlFor="deletePassword"
                      className="mb-1.5 block text-sm font-medium text-[hsl(var(--brand-charcoal))]"
                    >
                      Your password
                    </Label>
                    <Input
                      id="deletePassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Confirmation Text */}
                  <div>
                    <Label
                      htmlFor="confirmText"
                      className="mb-1.5 block text-sm font-medium text-[hsl(var(--brand-charcoal))]"
                    >
                      Type &quot;{CONFIRMATION_TEXT}&quot; to confirm
                    </Label>
                    <Input
                      id="confirmText"
                      type="text"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      className="w-full"
                      placeholder={CONFIRMATION_TEXT}
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-[hsl(var(--brand-border))] pt-4">
                  <button
                    type="button"
                    className="btn btn-subtle"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={
                      loading || !currentPassword || confirmationText !== CONFIRMATION_TEXT
                    }
                    className="btn px-6 py-2.5 text-sm min-w-[150px] bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete forever'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
