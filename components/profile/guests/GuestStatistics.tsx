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
      <div className="bg-gray-50 rounded-lg p-6 h-[88px] flex items-center justify-center w-full">
        <div className="text-sm text-gray-600">Loading statistics...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 h-[88px] flex items-center justify-center w-full">
        <div className="text-sm text-red-600">Error: {error}</div>
      </div>
    );
  }

  // Show no data state
  if (!stats) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 h-[88px] flex items-center justify-center w-full">
        <div className="text-sm text-gray-600">No data available</div>
      </div>
    );
  }
  const statItems = [
    {
      label: "Guests",
      value: stats.total_guests,
    },
    {
      label: "Recipes Received",
      value: stats.recipes_received,
    },
    {
      label: "Guests Pending to Send",
      value: stats.pending_invitations || 0,
    },
  ];

  return (
    <div className="bg-gray-50 rounded-lg flex w-full overflow-hidden h-[88px]">
      {statItems.map((stat, index) => (
        <div key={index} className="flex-1 px-4 sm:px-6 py-6 text-center relative flex flex-col justify-center">
          <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
            {stat.value}
          </div>
          <div className="text-xs text-gray-600 font-medium leading-tight">
            {stat.label}
          </div>
          {/* Vertical divider - don't show after last item */}
          {index < statItems.length - 1 && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 h-6 w-px bg-gray-300"></div>
          )}
        </div>
      ))}
    </div>
  );
}