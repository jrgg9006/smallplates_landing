"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { getWaitlistUsers, type WaitlistUser } from '@/lib/supabase/waitlist';
import { isAdminEmail } from '@/lib/config/admin';

export default function AdminWaitlistPage() {
  const [waitlist, setWaitlist] = useState<WaitlistUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAndLoad = async () => {
    // Check admin access first
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!isAdminEmail(user?.email)) {
      console.log('❌ Not admin, redirecting to home');
      router.push('/');
      return;
    }
    
    setIsAdmin(true);
    // Load waitlist data
    await loadWaitlist();
  };

  const loadWaitlist = async () => {
    setLoading(true);
    const { data, error } = await getWaitlistUsers();
    
    if (error) {
      alert(`Error loading waitlist: ${error}`);
    } else {
      setWaitlist(data || []);
    }
    
    setLoading(false);
  };

  const handleInvite = async (email: string, waitlistId: string) => {
    if (!confirm(`Send invitation email to ${email}?\n\nThey will receive a magic link to create their account.`)) {
      return;
    }

    setInviting(waitlistId);

    try {
      const response = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, waitlistId })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Invitation sent to ${email}!\n\nThey will receive an email with a magic link.`);
        loadWaitlist(); // Reload to show updated status
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Failed to send invitation'}`);
    } finally {
      setInviting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      invited: 'bg-blue-100 text-blue-800 border-blue-200',
      converted: 'bg-green-100 text-green-800 border-green-200',
      unsubscribed: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status}
      </span>
    );
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">{isAdmin ? 'Loading waitlist...' : 'Checking access...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Waitlist Admin</h1>
              <p className="text-gray-600">
                Manage users who joined the waitlist. Send invitations to grant them access.
              </p>
            </div>
            <a
              href="/admin"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back to Admin
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total</div>
            <div className="text-3xl font-bold">{waitlist.length}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6">
            <div className="text-sm text-yellow-800 mb-1">Pending</div>
            <div className="text-3xl font-bold text-yellow-800">
              {waitlist.filter(u => u.status === 'pending').length}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6">
            <div className="text-sm text-blue-800 mb-1">Invited</div>
            <div className="text-3xl font-bold text-blue-800">
              {waitlist.filter(u => u.status === 'invited').length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-sm text-green-800 mb-1">Converted</div>
            <div className="text-3xl font-bold text-green-800">
              {waitlist.filter(u => u.status === 'converted').length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {waitlist.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No users in waitlist yet.</p>
              <p className="text-gray-400 text-sm mt-2">Users will appear here after completing onboarding.</p>
            </div>
          ) : (
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
                      Recipe Goal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partner?
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {waitlist.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        {user.has_partner && user.partner_first_name && (
                          <div className="text-xs text-gray-500">
                            + {user.partner_first_name} {user.partner_last_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.recipe_goal_category || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.has_partner ? '✓' : '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.status === 'pending' && (
                          <button
                            onClick={() => handleInvite(user.email, user.id)}
                            disabled={inviting === user.id}
                            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {inviting === user.id ? 'Sending...' : 'Send Invite'}
                          </button>
                        )}
                        {user.status === 'invited' && (
                          <div className="text-sm text-gray-500">
                            Invited {user.invited_at ? new Date(user.invited_at).toLocaleDateString() : ''}
                          </div>
                        )}
                        {user.status === 'converted' && (
                          <div className="text-sm text-green-600 font-medium">✓ Customer</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={loadWaitlist}
            className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            ↻ Refresh List
          </button>
        </div>
      </div>
    </div>
  );
}

