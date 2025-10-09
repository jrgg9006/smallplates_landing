"use client";

import React from "react";
import { GuestStatistics } from "@/lib/types/database";
import { getGuestStatistics } from "@/lib/supabase/guests";

interface GuestStatisticsProps {
  // Component now manages its own data
}

export function GuestStatisticsComponent({}: GuestStatisticsProps = {}) {
  const [stats, setStats] = React.useState<GuestStatistics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load statistics
  const loadStats = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: statistics, error } = await getGuestStatistics();
      
      if (error) {
        setError(error);
        return;
      }
      
      setStats(statistics);
    } catch (err) {
      setError('Failed to load statistics');
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load stats when component mounts
  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Show loading state
  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 h-full flex items-center justify-center">
        <div className="text-sm text-gray-600">Loading statistics...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 h-full flex items-center justify-center">
        <div className="text-sm text-red-600">Error: {error}</div>
      </div>
    );
  }

  // Show no data state
  if (!stats) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 h-full flex items-center justify-center">
        <div className="text-sm text-gray-600">No data available</div>
      </div>
    );
  }
  const statItems = [
    {
      label: "Total Guests",
      value: stats.total_guests,
    },
    {
      label: "Invites Sent", 
      value: stats.invites_sent,
    },
    {
      label: "Recipes Received",
      value: stats.recipes_received,
    },
  ];

  return (
    <div className="bg-gray-50 rounded-xl p-6 h-full flex items-center">
      <div className="grid grid-cols-3 divide-x divide-gray-200 w-full">
        {statItems.map((stat, index) => (
          <div key={index} className="text-center px-4">
            <div className="text-2xl font-semibold text-gray-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}