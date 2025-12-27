"use client";

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { isAdminEmail } from '@/lib/config/admin';

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: 'pending' | 'reached_out' | 'submitted';
  created_at: string;
  number_of_recipes: number;
  recipes_received: number;
  is_archived: boolean;
}

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  phone_number: string | null;
  recipe_goal_number: number | null;
}

export default function UserDetailPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'status' | 'recipes'>('newest');
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  useEffect(() => {
    checkAdminAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
    await loadUserData();
    setLoading(false);
  };

  const loadUserData = async () => {
    try {
      const response = await fetch(`/api/v1/admin/activity/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      const data = await response.json();
      setUserProfile(data.profile);
      setGuests(data.guests);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const sortedGuests = [...guests].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'status':
        const statusOrder = { 'submitted': 0, 'reached_out': 1, 'pending': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      case 'recipes':
        return b.recipes_received - a.recipes_received;
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800';
      case 'reached_out':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !userProfile) {
    return null;
  }

  const totalRecipesExpected = guests.reduce((sum, guest) => sum + (guest.number_of_recipes || 0), 0);
  const totalRecipesReceived = guests.reduce((sum, guest) => sum + (guest.recipes_received || 0), 0);
  const completionRate = totalRecipesExpected > 0 ? Math.round((totalRecipesReceived / totalRecipesExpected) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                href="/admin/activity"
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Back to Activity
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {userProfile.full_name || 'Unnamed User'}
              </h1>
              <p className="text-gray-600">{userProfile.email}</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-white rounded-xl shadow-md p-6 grid grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Guests</div>
              <div className="text-3xl font-bold text-gray-900">{guests.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Recipes Received</div>
              <div className="text-3xl font-bold text-gray-900">
                {totalRecipesReceived} / {totalRecipesExpected}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
              <div className="text-3xl font-bold text-gray-900">{completionRate}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Recipe Goal</div>
              <div className="text-3xl font-bold text-gray-900">
                {userProfile.recipe_goal_number || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Guests Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Guests</h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="status">By Status</option>
                <option value="recipes">By Recipes</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {guest.first_name} {guest.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {guest.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(guest.status)}`}>
                        {guest.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(guest.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {guest.recipes_received} / {guest.number_of_recipes || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {guest.recipes_received > 0 && (
                        <Link
                          href={`/admin/activity/${userId}/guest/${guest.id}`}
                          className="text-black hover:underline font-medium"
                        >
                          View Recipes →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {guests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No guests added yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}