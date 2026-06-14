import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { fetchRadarSources } from '@/lib/radar/queries';
import {
  buildPulseMetrics,
  buildFeed,
  computeFunnel,
  computeGroupHealth,
  stripAdmin,
} from '@/lib/radar/aggregate';
import { buildDetails } from '@/lib/radar/details';
import type { RadarPayload } from '@/lib/radar/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminAuth();

    const now = new Date();
    const { sources: rawSources, degraded } = await fetchRadarSources();
    // Reason: drop Small Plates team (admin) data so the whole Radar shows only clients.
    const sources = stripAdmin(rawSources);

    const payload: RadarPayload = {
      generatedAt: now.toISOString(),
      pulse: buildPulseMetrics(sources, now),
      feed: buildFeed(sources),
      funnel: computeFunnel(sources, now),
      groups: computeGroupHealth(sources, now),
      details: buildDetails(sources),
      degraded,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error in /api/v1/admin/radar:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
