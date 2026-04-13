'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/config/admin';
import type { DebugLogRow } from '@/lib/types/database';
import { DebugLogTable } from './components/DebugLogTable';

interface Stats {
  activeCount: number;
  reviewedCount: number;
}

export default function DebugLogsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [logs, setLogs] = useState<DebugLogRow[]>([]);
  const [stats, setStats] = useState<Stats>({ activeCount: 0, reviewedCount: 0 });
  const [activeTab, setActiveTab] = useState<'active' | 'reviewed'>('active');
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin) fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const checkAdminAndLoad = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      router.push('/');
      return;
    }

    setIsAdmin(true);
    await fetchLogs();
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/debug-logs?status=${activeTab}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setStats(data.stats || { activeCount: 0, reviewedCount: 0 });
    } catch (err) {
      console.error('Error fetching debug logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReviewed = async (id: string) => {
    try {
      await fetch('/api/v1/admin/debug-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'reviewed' }),
      });
      await fetchLogs();
    } catch (err) {
      console.error('Error marking as reviewed:', err);
    }
  };

  const handleReopen = async (id: string) => {
    try {
      await fetch('/api/v1/admin/debug-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'active' }),
      });
      await fetchLogs();
    } catch (err) {
      console.error('Error reopening log:', err);
    }
  };

  const handleSaveNotes = async (id: string, notes: string) => {
    try {
      await fetch('/api/v1/admin/debug-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, admin_notes: notes }),
      });
      await fetchLogs();
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  };

  if (loading && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Debug Logs</h1>
            <p className="text-gray-600">Review system errors and issues</p>
          </div>
          <Link href="/admin" className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors">
            &larr; Back to Admin
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.activeCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Reviewed</p>
            <p className="text-2xl font-bold text-green-600">{stats.reviewedCount}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Active ({stats.activeCount})
          </button>
          <button
            onClick={() => setActiveTab('reviewed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'reviewed'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Reviewed ({stats.reviewedCount})
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading logs...</div>
        ) : (
          <DebugLogTable
            logs={logs}
            onMarkReviewed={handleMarkReviewed}
            onReopen={handleReopen}
            onSaveNotes={handleSaveNotes}
          />
        )}
      </div>
    </div>
  );
}
