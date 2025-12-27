"use client";

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdminEmail } from '@/lib/config/admin';

interface InvitationOverview {
  overview: {
    totalInvitations: number;
    acceptedInvitations: number;
    pendingInvitations: number;
    declinedInvitations: number;
    expiredInvitations: number;
    conversionRate: number;
    averageResponseTime: number;
  };
  recentActivity: {
    invitations: number;
    groups: number;
    members: number;
    recipes: number;
  };
  groups: {
    total: number;
    public: number;
    private: number;
    recent: number;
  };
  members: {
    total: number;
    owners: number;
    admins: number;
    regular: number;
    recent: number;
  };
  recipes: {
    total: number;
    recent: number;
  };
  trends: {
    daily: Array<{
      date: string;
      invitations: number;
      accepted: number;
      pending: number;
    }>;
  };
  activity: Array<{
    id: string;
    type: string;
    email: string;
    name: string;
    status: string;
    groupName: string;
    inviterName: string;
    createdAt: string;
    expiresAt: string;
  }>;
}

export default function InvitationsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [data, setData] = useState<InvitationOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAndLoadData = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !isAdminEmail(user.email)) {
      // console.log removed for production
      router.push('/');
      return;
    }
    
    // console.log removed for production
    setIsAdmin(true);
    await loadInvitationData();
    setLoading(false);
  };

  const loadInvitationData = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not logged in');
      }

      const response = await fetch('/api/v1/admin/invitations/overview', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch invitation data');
      }
      
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Error loading invitation data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'accepted':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case 'declined':
        return `${baseClasses} bg-red-100 text-red-700`;
      case 'expired':
        return `${baseClasses} bg-gray-100 text-gray-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitations data...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadInvitationData}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Group Invitations</h1>
            <p className="text-sm text-gray-600 mt-1">Monitor collaboration and invitation analytics</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/invitations/list"
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              View All Invitations
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invitations</p>
                <p className="text-3xl font-bold text-gray-900">{data.overview.totalInvitations}</p>
              </div>
              <div className="text-3xl">📨</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-green-600">{data.overview.conversionRate}%</p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{data.overview.pendingInvitations}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent Activity</p>
                <p className="text-3xl font-bold text-blue-600">{data.recentActivity.invitations}</p>
                <p className="text-xs text-gray-500">Last 7 days</p>
              </div>
              <div className="text-3xl">🔥</div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invitation Status Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{data.overview.acceptedInvitations}</div>
                <div className="text-sm text-green-700">Accepted</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{data.overview.pendingInvitations}</div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{data.overview.declinedInvitations}</div>
                <div className="text-sm text-red-700">Declined</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{data.overview.expiredInvitations}</div>
                <div className="text-sm text-gray-700">Expired</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Groups</span>
                <span className="font-semibold">{data.groups.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Members</span>
                <span className="font-semibold">{data.members.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Group Recipes</span>
                <span className="font-semibold">{data.recipes.total}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Recent Activity (7d)</span>
                <span className="text-sm font-medium text-blue-600">
                  +{data.recentActivity.groups} groups, +{data.recentActivity.members} members
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Invitation Activity</h3>
            <Link
              href="/admin/invitations/list"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </Link>
          </div>
          
          {data.activity.length > 0 ? (
            <div className="space-y-3">
              {data.activity.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {item.name || item.email}
                      </span>
                      <span className={getStatusBadge(item.status)}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Invited to <span className="font-medium">{item.groupName}</span> by {item.inviterName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </div>
                    {item.status === 'pending' && (
                      <div className="text-xs text-gray-400 mt-1">
                        Expires {formatDate(item.expiresAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent invitation activity
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Link
            href="/admin/invitations/list"
            className="inline-block p-4 bg-white rounded-lg shadow hover:shadow-lg transition-all border-2 border-transparent hover:border-black"
          >
            <div className="text-2xl mb-2">📋</div>
            <h4 className="font-semibold text-gray-900">Detailed List</h4>
            <p className="text-sm text-gray-600 mt-1">View and filter all invitations</p>
          </Link>
        </div>
      </div>
    </div>
  );
}