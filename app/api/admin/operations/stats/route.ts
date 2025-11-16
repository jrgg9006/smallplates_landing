import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { getProductionStatsAdmin } from '@/lib/supabase/operations';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdminAuth();
    
    const { data, error } = await getProductionStatsAdmin();
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/admin/operations/stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' }, 
      { status: 401 }
    );
  }
}

