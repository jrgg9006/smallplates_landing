"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteAccount } from '@/lib/supabase/profiles';
import { AlertTriangle, Trash2, Shield, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DangerZone() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Account deletion successful - user is automatically signed out
      // Show success message based on deletion type
      if (data?.deletionType === 'soft') {
        // Soft delete - data preserved
        alert('✅ Your account has been deleted. All your recipes and book data have been preserved.');
      } else {
        // Hard delete - completely removed
        alert('✅ Your account has been permanently deleted.');
      }

      // Redirect to home page
      router.push('/');
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
      {/* Danger Zone Header */}
      <div className="border border-red-200 rounded-lg p-6 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-700 mb-4">
              Once you delete your account, there is no going back. This action cannot be undone.
            </p>
            
            <div className="space-y-2 text-sm text-red-700">
              <p><strong>What happens when you delete your account:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>If you have recipes, guests, or books: Your account will be deactivated but all your data (recipes, guests, books) will be preserved</li>
                <li>If you have no content: Your account and all data will be permanently deleted</li>
                <li>Your recipe collection link will be disabled</li>
                <li>You will be signed out of all devices</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>

            <Button
              onClick={() => setShowDeleteModal(true)}
              variant="destructive"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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

            {/* Warning */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium mb-2">
                ⚠️ This action is irreversible!
              </p>
              <p className="text-sm text-red-700">
                All your data will be permanently deleted and cannot be recovered.
              </p>
            </div>

            <div className="space-y-4">
              {/* Password Confirmation */}
              <div>
                <Label htmlFor="deletePassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter your password to confirm *
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
                <Label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-1">
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

              {/* Security Notice */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600">
                    For security reasons, we require your password to confirm this action.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleDeleteAccount}
                disabled={loading || !currentPassword || confirmationText !== CONFIRMATION_TEXT}
                className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting Account...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account Forever
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}