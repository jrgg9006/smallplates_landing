"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteAccount } from '@/lib/supabase/profiles';
import { AlertTriangle, Trash2, Loader2, X, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DangerZone() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const CONFIRMATION_TEXT = 'DELETE MY ACCOUNT';

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

  const handleCancel = () => {
    setShowDeleteModal(false);
    setCurrentPassword('');
    setConfirmationText('');
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Danger Zone Section */}
      <div className="border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete account</h3>
            <p className="text-sm text-gray-600 mb-1">
              Once deleted, this can&apos;t be undone. If you have existing books or recipes, your
              account will be deactivated and data preserved. Otherwise it&apos;s permanently
              removed.
            </p>

            <Button
              onClick={() => setShowDeleteModal(true)}
              variant="destructive"
              size="sm"
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success state */}
            {successMessage ? (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{successMessage} Redirecting...</p>
              </div>
            ) : (
              <>
                {/* Warning */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Enter your password *
                    </Label>
                    <Input
                      id="deletePassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full"
                      placeholder="Current password"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Confirmation Text */}
                  <div>
                    <Label
                      htmlFor="confirmText"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Type &quot;{CONFIRMATION_TEXT}&quot; to confirm *
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
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button onClick={handleCancel} variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={
                      loading ||
                      !currentPassword ||
                      confirmationText !== CONFIRMATION_TEXT
                    }
                    className="bg-red-600 text-white hover:bg-red-700 min-w-[150px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Forever
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
