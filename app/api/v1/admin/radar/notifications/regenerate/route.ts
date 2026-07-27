import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { runRadarMonitor } from '@/lib/radar/run-monitor';

export const maxDuration = 300;

export async function POST() {
  try {
    await requireAdminAuth();
    const result = await runRadarMonitor();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Error in POST /api/v1/admin/radar/notifications/regenerate:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
