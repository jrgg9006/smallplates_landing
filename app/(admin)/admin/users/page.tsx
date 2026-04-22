"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/config/admin';
import { Trash2, Sparkles, RotateCcw, Eye, X, Flame, Search, FlaskConical } from 'lucide-react';
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
  is_test_account?: boolean;
  last_sign_in_at?: string | null;
  guest_count?: number;
  recipe_count?: number;
  groups_owned_count?: number;
  groups_member_count?: number;
  has_paid?: boolean;
}

type FilterContent = 'all' | 'with' | 'without';
type FilterStatus = 'all' | 'active' | 'deleted';
type FilterTest = 'all' | 'test_only' | 'hide_test';
type FilterPaid = 'all' | 'paid' | 'unpaid';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState<string | null>(null);
  const [resettingOnboarding, setResettingOnboarding] = useState<string | null>(null);
  const [togglingTest, setTogglingTest] = useState<string | null>(null);
  const [cleanModalOpen, setCleanModalOpen] = useState(false);
  const [userToClean, setUserToClean] = useState<User | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Hard delete confirmation modal
  const [hardDeleteModalOpen, setHardDeleteModalOpen] = useState(false);
  const [userToHardDelete, setUserToHardDelete] = useState<User | null>(null);
  const [hardDeleteConfirmText, setHardDeleteConfirmText] = useState('');
  const [hardDeletePreview, setHardDeletePreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Filters / search (Fase 2)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterContent, setFilterContent] = useState<FilterContent>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active');
  const [filterTest, setFilterTest] = useState<FilterTest>('all');
  const [filterPaid, setFilterPaid] = useState<FilterPaid>('all');
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

  // Soft delete: always preserves data, marks deleted_at
  const handleSoftDelete = async (user: User) => {
    if (!confirm(`SOFT DELETE ${user.email}?\n\nThe account will be marked as deleted but ALL data (recipes, guests, groups) will be preserved. Reversible by clearing deleted_at.`)) {
      return;
    }

    setDeleting(user.id);
    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}?mode=soft`, { method: 'DELETE' });
      const result = await response.json();
      if (response.ok) {
        alert(`✅ User ${user.email} soft deleted (data preserved)`);
        await loadUsers();
        setDetailsModalOpen(false);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Failed to soft delete user'}`);
    } finally {
      setDeleting(null);
    }
  };

  // Hard delete: opens confirmation modal, fetches preview of what will be deleted
  const openHardDeleteModal = async (user: User) => {
    setUserToHardDelete(user);
    setHardDeleteConfirmText('');
    setHardDeletePreview(null);
    setHardDeleteModalOpen(true);
    setLoadingPreview(true);
    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}/hard-delete-preview`);
      const result = await response.json();
      if (response.ok && result.success) {
        setHardDeletePreview(result.data);
      } else {
        alert(`❌ Preview failed: ${result.error}`);
        setHardDeleteModalOpen(false);
      }
    } catch (err) {
      alert(`❌ Preview error: ${err instanceof Error ? err.message : 'Failed to load preview'}`);
      setHardDeleteModalOpen(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Download the preview payload as a JSON backup file before deletion
  const downloadBackup = () => {
    if (!hardDeletePreview || !userToHardDelete) return;
    const blob = new Blob([JSON.stringify(hardDeletePreview, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeEmail = userToHardDelete.email.replace(/[^a-z0-9]/gi, '_');
    const date = new Date().toISOString().split('T')[0];
    a.download = `backup-${safeEmail}-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleHardDeleteConfirm = async () => {
    if (!userToHardDelete) return;
    if (hardDeleteConfirmText.trim().toLowerCase() !== userToHardDelete.email.toLowerCase()) {
      alert('Email confirmation does not match.');
      return;
    }

    setDeleting(userToHardDelete.id);
    try {
      const response = await fetch(`/api/v1/admin/users/${userToHardDelete.id}?mode=hard`, { method: 'DELETE' });
      const result = await response.json();
      if (response.ok) {
        alert(`✅ User ${userToHardDelete.email} permanently deleted. The email is now reusable.`);
        await loadUsers();
        setHardDeleteModalOpen(false);
        setUserToHardDelete(null);
        setHardDeleteConfirmText('');
        setDetailsModalOpen(false);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Failed to hard delete user'}`);
    } finally {
      setDeleting(null);
    }
  };

  // Toggle is_test_account flag
  const handleToggleTest = async (user: User) => {
    setTogglingTest(user.id);
    const next = !user.is_test_account;
    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}/test-flag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_test_account: next }),
      });
      const result = await response.json();
      if (response.ok) {
        // Optimistic local update so we don't have to reload all users
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_test_account: next } : u)));
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Failed to toggle test flag'}`);
    } finally {
      setTogglingTest(null);
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

  // Apply search + filters
  const filteredUsers = users.filter((u) => {
    // Status filter
    if (filterStatus === 'active' && u.deleted_at) return false;
    if (filterStatus === 'deleted' && !u.deleted_at) return false;

    // Test filter
    if (filterTest === 'test_only' && !u.is_test_account) return false;
    if (filterTest === 'hide_test' && u.is_test_account) return false;

    // Paid filter
    if (filterPaid === 'paid' && !u.has_paid) return false;
    if (filterPaid === 'unpaid' && u.has_paid) return false;

    // Content filter
    const hasContent =
      (u.recipe_count || 0) > 0 ||
      (u.guest_count || 0) > 0 ||
      (u.groups_owned_count || 0) > 0 ||
      (u.groups_member_count || 0) > 0;
    if (filterContent === 'with' && !hasContent) return false;
    if (filterContent === 'without' && hasContent) return false;

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const inEmail = u.email?.toLowerCase().includes(q);
      const inName = u.full_name?.toLowerCase().includes(q);
      if (!inEmail && !inName) return false;
    }

    return true;
  });

  const formatLastSignIn = (iso?: string | null) => {
    if (!iso) return 'Never';
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Users</h1>
              <p className="text-gray-600">
                {filteredUsers.length} of {users.length} users shown
              </p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>

        {/* Filters bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="px-2 py-1 border border-gray-200 rounded text-sm"
              >
                <option value="active">Active only</option>
                <option value="deleted">Deleted only</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Test:</span>
              <select
                value={filterTest}
                onChange={(e) => setFilterTest(e.target.value as FilterTest)}
                className="px-2 py-1 border border-gray-200 rounded text-sm"
              >
                <option value="all">All</option>
                <option value="test_only">Test only</option>
                <option value="hide_test">Hide test</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Paid:</span>
              <select
                value={filterPaid}
                onChange={(e) => setFilterPaid(e.target.value as FilterPaid)}
                className="px-2 py-1 border border-gray-200 rounded text-sm"
              >
                <option value="all">All</option>
                <option value="paid">Paid only</option>
                <option value="unpaid">Unpaid only</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Content:</span>
              <select
                value={filterContent}
                onChange={(e) => setFilterContent(e.target.value as FilterContent)}
                className="px-2 py-1 border border-gray-200 rounded text-sm"
              >
                <option value="all">All</option>
                <option value="with">With content</option>
                <option value="without">Empty</option>
              </select>
            </div>
            {(searchTerm || filterStatus !== 'active' || filterTest !== 'all' || filterPaid !== 'all' || filterContent !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('active');
                  setFilterTest('all');
                  setFilterPaid('all');
                  setFilterContent('all');
                }}
                className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Recipes">R</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Guests">G</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Groups owned">GR</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Groups member of (not owner)">MB</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last sign in</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                      No users match the current filters
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const busy = deleting === user.id || cleaning === user.id || resettingOnboarding === user.id || togglingTest === user.id;
                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-gray-50 cursor-pointer ${user.is_test_account ? 'bg-purple-50/30' : ''}`}
                        onClick={() => handleViewDetails(user)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{user.email}</span>
                              {user.deleted_at && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Deleted
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{user.full_name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleTest(user)}
                            disabled={busy}
                            title={user.is_test_account ? 'Click to unmark as test' : 'Click to mark as test'}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                              user.is_test_account
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            <FlaskConical className="h-3 w-3" />
                            {user.is_test_account ? 'TEST' : '—'}
                          </button>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          {user.has_paid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                              ✓
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-600">
                          {user.recipe_count || 0}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-600">
                          {user.guest_count || 0}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-600">
                          {user.groups_owned_count || 0}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-600">
                          {user.groups_member_count || 0}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                          {formatLastSignIn(user.last_sign_in_at)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleViewDetails(user)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                              title="View details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleResetOnboarding(user)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                              title="Reset onboarding"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleCleanClick(user)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                              title="Clean (remove content, keep account)"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleSoftDelete(user)}
                              disabled={busy || !!user.deleted_at}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                              title="Soft delete (preserve data)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openHardDeleteModal(user)}
                              disabled={busy || !user.is_test_account}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={user.is_test_account ? 'HARD delete (permanent, email reusable)' : 'Hard delete disabled: mark as TEST first'}
                            >
                              <Flame className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
            <DialogTitle className="font-serif text-modal-title font-semibold">
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
              <DialogTitle className="font-serif text-modal-title font-semibold">
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
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{group.name}</span>
                            <span className="text-xs px-2 py-0.5 bg-yellow-200 text-yellow-900 rounded-full font-semibold">
                              OWNER
                            </span>
                          </div>
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
                    {userDetails.groups.memberships.map((membership: any, idx: number) => {
                      // Reason: in this product, group_members.role='member' is what we call "Captain"
                      // (someone who is not the group owner). Only 'owner' shows as Owner.
                      const roleLabel =
                        membership.role === 'owner' ? 'OWNER' :
                        membership.role === 'admin' ? 'ADMIN' :
                        'CAPTAIN';
                      const roleClass =
                        membership.role === 'owner' ? 'bg-yellow-200 text-yellow-900' :
                        membership.role === 'admin' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-blue-100 text-blue-800';
                      return (
                      <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{membership.group.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleClass}`}>
                              {roleLabel}
                            </span>
                          </div>
                        </div>
                        {membership.group.cookbooks && membership.group.cookbooks.length > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            Cookbooks: {membership.group.cookbooks.map((cb: any) => cb.name).join(', ')}
                          </div>
                        )}
                      </div>
                      );
                    })}
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
                  onClick={() => selectedUser && handleSoftDelete(selectedUser)}
                  disabled={deleting === selectedUser?.id || !!selectedUser?.deleted_at}
                  className="bg-orange-600 text-white hover:bg-orange-700"
                >
                  {deleting === selectedUser?.id ? 'Deleting...' : 'Soft Delete'}
                </Button>
                <Button
                  onClick={() => {
                    if (selectedUser) {
                      openHardDeleteModal(selectedUser);
                      setDetailsModalOpen(false);
                    }
                  }}
                  disabled={deleting === selectedUser?.id || !selectedUser?.is_test_account}
                  className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
                  title={selectedUser?.is_test_account ? '' : 'Mark as TEST first to enable hard delete'}
                >
                  Hard Delete
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

      {/* Hard Delete Confirmation Modal */}
      <Dialog open={hardDeleteModalOpen} onOpenChange={(open) => {
        setHardDeleteModalOpen(open);
        if (!open) {
          setUserToHardDelete(null);
          setHardDeleteConfirmText('');
          setHardDeletePreview(null);
        }
      }}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-modal-title font-semibold text-red-700 flex items-center gap-2">
              <Flame className="h-6 w-6" />
              Hard Delete User
            </DialogTitle>
            <DialogDescription className="pt-2">
              Review exactly what will be deleted below. Download a JSON backup before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {loadingPreview ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Loading preview…</p>
              </div>
            ) : hardDeletePreview ? (
              <>
                {/* Counts summary */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-900 mb-2 uppercase tracking-wide">Rows that will be deleted</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-red-900">
                    {Object.entries(hardDeletePreview.counts as Record<string, number>)
                      .filter(([, n]) => n > 0)
                      .map(([table, n]) => (
                        <div key={table} className="flex justify-between">
                          <span className="font-mono">{table}</span>
                          <span className="font-bold">{n}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Expandable full detail */}
                <details className="bg-gray-50 border border-gray-200 rounded-lg">
                  <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                    📋 See exact rows (IDs and key fields)
                  </summary>
                  <pre className="px-3 py-2 text-[10px] text-gray-700 max-h-64 overflow-auto font-mono">
{JSON.stringify(hardDeletePreview.tables, null, 2)}
                  </pre>
                </details>

                {/* Backup button */}
                <button
                  type="button"
                  onClick={downloadBackup}
                  className="w-full px-4 py-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                >
                  💾 Download backup JSON (recommended)
                </button>

                <div className="border-t pt-3">
                  <p className="text-sm text-gray-700">
                    Type <strong className="text-red-700">{userToHardDelete?.email}</strong> to confirm:
                  </p>
                  <input
                    type="text"
                    value={hardDeleteConfirmText}
                    onChange={(e) => setHardDeleteConfirmText(e.target.value)}
                    placeholder={userToHardDelete?.email || ''}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    autoComplete="off"
                  />
                  <p className="text-xs text-red-600 font-medium mt-2">This action cannot be undone.</p>
                </div>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setHardDeleteModalOpen(false);
                setUserToHardDelete(null);
                setHardDeleteConfirmText('');
              }}
              disabled={deleting === userToHardDelete?.id}
            >
              Cancel
            </Button>
            <Button
              onClick={handleHardDeleteConfirm}
              disabled={
                deleting === userToHardDelete?.id ||
                hardDeleteConfirmText.trim().toLowerCase() !== userToHardDelete?.email.toLowerCase()
              }
              className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300"
            >
              {deleting === userToHardDelete?.id ? 'Deleting…' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

