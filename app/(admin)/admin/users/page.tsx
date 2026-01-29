"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/config/admin';
import { Trash2, Sparkles, RotateCcw, Eye, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState<string | null>(null);
  const [resettingOnboarding, setResettingOnboarding] = useState<string | null>(null);
  const [cleanModalOpen, setCleanModalOpen] = useState(false);
  const [userToClean, setUserToClean] = useState<User | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAndLoad = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!isAdminEmail(user?.email)) {
      // console.log removed for production
      router.push('/');
      return;
    }
    
    setIsAdmin(true);
    await loadUsers();
  };

  const loadUsers = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/admin/users');
      const result = await response.json();
      
      if (response.ok && result.success) {
        setUsers(result.data || []);
      } else {
        alert(`Error loading users: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error loading users: ${err instanceof Error ? err.message : 'Failed to load users'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setDetailsModalOpen(true);
    setLoadingDetails(true);
    setUserDetails(null);

    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}/preview`);
      const result = await response.json();

      if (response.ok && result.success) {
        setUserDetails(result.data);
      } else {
        alert(`Error loading user details: ${result.error || 'Unknown error'}`);
        setDetailsModalOpen(false);
      }
    } catch (err) {
      alert(`Error loading user details: ${err instanceof Error ? err.message : 'Failed to load details'}`);
      setDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user ${user.email}?\n\nIf the user has content (recipes, guests, groups), the account will be soft deleted (data preserved). If the user has no content, the account will be permanently deleted.\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeleting(user.id);

    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        const deletionType = result.deletionType === 'soft' ? 'soft deleted (data preserved)' : 'permanently deleted';
        alert(`✅ User ${user.email} ${deletionType} successfully`);
        await loadUsers(); // Reload to update the list
        setDetailsModalOpen(false); // Close modal if open
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Failed to delete user'}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteFromModal = async () => {
    if (!selectedUser) return;

    // Determine deletion type based on content
    const hasContent = userDetails && (
      (userDetails.counts.recipes > 0) ||
      (userDetails.counts.guests > 0) ||
      (userDetails.groups.ownedCount > 0) ||
      (userDetails.groups.membershipsCount > 0)
    );

    const deletionMessage = hasContent
      ? `Are you sure you want to delete user ${selectedUser.email}?\n\nThis user has content (recipes, guests, groups). The account will be SOFT DELETED - all data will be preserved but the account will be deactivated.\n\nThis action cannot be undone.`
      : `Are you sure you want to delete user ${selectedUser.email}?\n\nThis user has no content. The account will be PERMANENTLY DELETED - all data will be removed.\n\nThis action cannot be undone.`;

    if (!confirm(deletionMessage)) {
      return;
    }

    setDeleting(selectedUser.id);

    try {
      const response = await fetch(`/api/v1/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        const deletionType = result.deletionType === 'soft' ? 'soft deleted (data preserved)' : 'permanently deleted';
        alert(`✅ User ${selectedUser.email} ${deletionType} successfully`);
        await loadUsers(); // Reload to update the list
        setDetailsModalOpen(false);
        setSelectedUser(null);
        setUserDetails(null);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Failed to delete user'}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleCleanClick = (user: User) => {
    setUserToClean(user);
    setCleanModalOpen(true);
  };

  const handleCleanConfirm = async () => {
    if (!userToClean) return;

    setCleanModalOpen(false);
    setCleaning(userToClean.id);

    try {
      const response = await fetch(`/api/v1/admin/users/${userToClean.id}/clean`, {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ User ${userToClean.email} cleaned successfully. They are now in default state.`);
        await loadUsers(); // Reload to update the list
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Failed to clean user'}`);
    } finally {
      setCleaning(null);
      setUserToClean(null);
    }
  };

  const handleResetOnboarding = async (user: User) => {
    if (!confirm(`Reset onboarding state for ${user.email}?\n\nThis will reset their onboarding progress to default.`)) {
      return;
    }

    setResettingOnboarding(user.id);

    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}/reset-onboarding`, {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Onboarding state reset successfully for ${user.email}`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Failed to reset onboarding'}`);
    } finally {
      setResettingOnboarding(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Delete Users</h1>
              <p className="text-gray-600">Manage and delete user accounts</p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewDetails(user)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {user.email}
                          {user.deleted_at && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Deleted
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.full_name || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(user)}
                            disabled={deleting === user.id || cleaning === user.id || resettingOnboarding === user.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            onClick={() => handleResetOnboarding(user)}
                            disabled={resettingOnboarding === user.id || cleaning === user.id || deleting === user.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RotateCcw className="h-4 w-4" />
                            {resettingOnboarding === user.id ? 'Resetting...' : 'Reset Onboarding'}
                          </button>
                          <button
                            onClick={() => handleCleanClick(user)}
                            disabled={cleaning === user.id || deleting === user.id || resettingOnboarding === user.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Sparkles className="h-4 w-4" />
                            {cleaning === user.id ? 'Cleaning...' : 'Clean'}
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={deleting === user.id || cleaning === user.id || resettingOnboarding === user.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deleting === user.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Clean Confirmation Modal */}
      <Dialog open={cleanModalOpen} onOpenChange={setCleanModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-semibold">
              Clean User Data
            </DialogTitle>
            <DialogDescription className="pt-2">
              This will remove all content from {userToClean?.email} and return them to default state.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-gray-700 font-medium">This will delete:</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-2">
              <li>All recipes</li>
              <li>All guests</li>
              <li>All cookbooks (except default)</li>
              <li>Remove from all groups (except default)</li>
              <li>All communication logs</li>
              <li>All shipping addresses</li>
            </ul>
            <p className="text-sm text-gray-700 font-medium pt-2">This will keep:</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-2">
              <li>User account and profile</li>
              <li>Default group &quot;My First Book&quot;</li>
            </ul>
            <p className="text-sm text-red-600 font-medium pt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCleanModalOpen(false);
                setUserToClean(null);
              }}
              disabled={cleaning === userToClean?.id}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCleanConfirm}
              disabled={cleaning === userToClean?.id}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {cleaning === userToClean?.id ? 'Cleaning...' : 'Confirm Clean'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <DialogTitle className="font-serif text-2xl font-semibold">
                User Details
              </DialogTitle>
              <button
                onClick={() => {
                  setDetailsModalOpen(false);
                  setSelectedUser(null);
                  setUserDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DialogDescription className="pt-2">
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading user details...</p>
            </div>
          ) : userDetails ? (
            <div className="py-4 space-y-6">
              {/* Soft Delete Warning */}
              {userDetails.isDeleted && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">User is Soft Deleted</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>This user account has been soft deleted. All data (recipes, guests, groups) is preserved but the account is inactive.</p>
                        {userDetails.deletedAt && (
                          <p className="mt-1">Deleted on: {new Date(userDetails.deletedAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="text-sm font-medium text-gray-900">{userDetails.profile?.full_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium text-gray-900">{userDetails.authUser?.email || selectedUser?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Account Created:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {userDetails.authUser?.created_at 
                        ? new Date(userDetails.authUser.created_at).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  {userDetails.waitlist && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">From Waitlist:</span>
                      <span className="text-sm font-medium text-green-600">Yes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Counts */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Content Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-900">{userDetails.counts.recipes}</div>
                    <div className="text-sm text-blue-700">Recipes</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-900">{userDetails.counts.guests}</div>
                    <div className="text-sm text-green-700">Guests</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-900">{userDetails.counts.cookbooks}</div>
                    <div className="text-sm text-purple-700">Cookbooks</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-900">{userDetails.counts.shippingAddresses}</div>
                    <div className="text-sm text-orange-700">Shipping Addresses</div>
                  </div>
                </div>
              </div>

              {/* Groups Owned */}
              {userDetails.groups.ownedCount > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Groups Owned ({userDetails.groups.ownedCount})
                  </h3>
                  <div className="space-y-2">
                    {userDetails.groups.owned.map((group: any) => (
                      <div key={group.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{group.name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(group.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {group.cookbooks && group.cookbooks.length > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            Cookbooks: {group.cookbooks.map((cb: any) => cb.name).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                    {userDetails.groups.totalRecipesInOwnedGroups > 0 && (
                      <div className="text-xs text-gray-600 mt-2">
                        Total recipes in owned groups: <strong>{userDetails.groups.totalRecipesInOwnedGroups}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Groups Member */}
              {userDetails.groups.membershipsCount > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Group Memberships ({userDetails.groups.membershipsCount})
                  </h3>
                  <div className="space-y-2">
                    {userDetails.groups.memberships.map((membership: any, idx: number) => (
                      <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{membership.group.name}</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full capitalize">
                            {membership.role}
                          </span>
                        </div>
                        {membership.group.cookbooks && membership.group.cookbooks.length > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            Cookbooks: {membership.group.cookbooks.map((cb: any) => cb.name).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                    {userDetails.groups.totalRecipesInMemberGroups > 0 && (
                      <div className="text-xs text-gray-600 mt-2">
                        Total recipes in member groups: <strong>{userDetails.groups.totalRecipesInMemberGroups}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* What will be deleted */}
              {!userDetails.isDeleted && (
                <div className="border-t pt-4">
                  {(() => {
                    const hasContent = 
                      (userDetails.counts.recipes > 0) ||
                      (userDetails.counts.guests > 0) ||
                      (userDetails.groups.ownedCount > 0) ||
                      (userDetails.groups.membershipsCount > 0);
                    
                    return hasContent ? (
                      <>
                        <h3 className="text-sm font-semibold text-yellow-900 mb-3">⚠️ If Deleted, This Will Be Soft Deleted:</h3>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800 mb-2 font-medium">
                            This user has content. The account will be <strong>soft deleted</strong> - all data will be preserved:
                          </p>
                          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                            <li><strong>{userDetails.counts.recipes}</strong> recipes (preserved)</li>
                            <li><strong>{userDetails.counts.guests}</strong> guests (preserved)</li>
                            <li><strong>{userDetails.counts.cookbooks}</strong> cookbooks (preserved)</li>
                            <li><strong>{userDetails.groups.ownedCount}</strong> group(s) owned (ownership will be transferred)</li>
                            <li>Membership in <strong>{userDetails.groups.membershipsCount}</strong> group(s) (preserved)</li>
                            <li><strong>{userDetails.counts.shippingAddresses}</strong> shipping address(es) (preserved)</li>
                            <li><strong>{userDetails.counts.communicationLogs}</strong> communication log(s) (preserved)</li>
                            <li>User account will be deactivated (cannot login)</li>
                            {userDetails.waitlist && <li>Waitlist entry will be deleted</li>}
                          </ul>
                          <p className="text-xs text-yellow-700 font-medium mt-3">
                            Account will be marked as deleted but all data remains accessible.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-sm font-semibold text-red-900 mb-3">⚠️ If Deleted, This Will Remove:</h3>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-sm text-red-800 mb-2 font-medium">
                            This user has no content. The account will be <strong>permanently deleted</strong>:
                          </p>
                          <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                            <li>User account and profile</li>
                            {userDetails.waitlist && <li>Waitlist entry</li>}
                          </ul>
                          <p className="text-xs text-red-700 font-medium mt-3">
                            This action cannot be undone.
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Actions */}
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailsModalOpen(false);
                    setSelectedUser(null);
                    setUserDetails(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    if (selectedUser) {
                      handleCleanClick(selectedUser);
                      setDetailsModalOpen(false);
                    }
                  }}
                  disabled={cleaning === selectedUser?.id}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Clean User
                </Button>
                <Button
                  onClick={handleDeleteFromModal}
                  disabled={deleting === selectedUser?.id}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {deleting === selectedUser?.id ? 'Deleting...' : 'Delete User'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-600">No details available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

