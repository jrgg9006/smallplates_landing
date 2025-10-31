"use client";

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdminEmail } from '@/lib/config/admin';

export default function AdminHomePage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdmin = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user is logged in and is admin
    if (!user || !isAdminEmail(user.email)) {
      console.log('❌ Not admin, redirecting to home');
      router.push('/');
      return;
    }
    
    console.log('✅ Admin access granted');
    setIsAdmin(true);
    setUserName(user.email || '');
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Small Plates Admin</h1>
              <p className="text-gray-600">Welcome back, {userName}</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Waitlist Management - Active */}
          <Link href="/admin/waitlist" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent group-hover:border-black cursor-pointer h-full">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Waitlist</h2>
              <p className="text-gray-600 mb-4">
                Manage and invite users from the waitlist
              </p>
              <div className="flex items-center text-sm text-gray-500 group-hover:text-black transition-colors">
                <span>View waitlist</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* User Management - Coming Soon */}
          <div className="bg-gray-100 rounded-xl p-8 opacity-60 cursor-not-allowed h-full">
            <div className="text-5xl mb-4 grayscale">👥</div>
            <h2 className="text-2xl font-bold text-gray-500 mb-2">Users</h2>
            <p className="text-gray-400 mb-4">
              Manage customer accounts and profiles
            </p>
            <div className="text-sm text-gray-400">
              Coming soon
            </div>
          </div>

          {/* Orders Management - Coming Soon */}
          <div className="bg-gray-100 rounded-xl p-8 opacity-60 cursor-not-allowed h-full">
            <div className="text-5xl mb-4 grayscale">📦</div>
            <h2 className="text-2xl font-bold text-gray-500 mb-2">Orders</h2>
            <p className="text-gray-400 mb-4">
              Track and manage cookbook orders
            </p>
            <div className="text-sm text-gray-400">
              Coming soon
            </div>
          </div>

          {/* Analytics - Coming Soon */}
          <div className="bg-gray-100 rounded-xl p-8 opacity-60 cursor-not-allowed h-full">
            <div className="text-5xl mb-4 grayscale">📊</div>
            <h2 className="text-2xl font-bold text-gray-500 mb-2">Analytics</h2>
            <p className="text-gray-400 mb-4">
              View platform metrics and insights
            </p>
            <div className="text-sm text-gray-400">
              Coming soon
            </div>
          </div>

          {/* Settings - Coming Soon */}
          <div className="bg-gray-100 rounded-xl p-8 opacity-60 cursor-not-allowed h-full">
            <div className="text-5xl mb-4 grayscale">⚙️</div>
            <h2 className="text-2xl font-bold text-gray-500 mb-2">Settings</h2>
            <p className="text-gray-400 mb-4">
              Configure platform settings
            </p>
            <div className="text-sm text-gray-400">
              Coming soon
            </div>
          </div>

          {/* Support - Coming Soon */}
          <div className="bg-gray-100 rounded-xl p-8 opacity-60 cursor-not-allowed h-full">
            <div className="text-5xl mb-4 grayscale">💬</div>
            <h2 className="text-2xl font-bold text-gray-500 mb-2">Support</h2>
            <p className="text-gray-400 mb-4">
              Manage customer support tickets
            </p>
            <div className="text-sm text-gray-400">
              Coming soon
            </div>
          </div>

        </div>

        {/* Quick Stats (optional - can add later) */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Waitlist</div>
              <div className="text-3xl font-bold text-gray-900">-</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Active Users</div>
              <div className="text-3xl font-bold text-gray-900">-</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Orders</div>
              <div className="text-3xl font-bold text-gray-900">-</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Revenue</div>
              <div className="text-3xl font-bold text-gray-900">$0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

