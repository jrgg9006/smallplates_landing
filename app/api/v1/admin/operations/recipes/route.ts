import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { getAllRecipesWithProductionStatusAdmin } from '@/lib/supabase/operations';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdminAuth();
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') as 'no_action' | 'in_progress' | 'ready_to_print' | null;
    const cookbookId = searchParams.get('cookbookId');
    const userId = searchParams.get('userId');
    const needsReview = searchParams.get('needsReview');

    const filters: {
      status?: 'no_action' | 'in_progress' | 'ready_to_print';
      cookbookId?: string | 'not_in_cookbook';
      userId?: string;
      needsReview?: boolean;
    } = {};

    if (status) {
      filters.status = status;
    }

    if (cookbookId) {
      filters.cookbookId = cookbookId === 'not_in_cookbook' ? 'not_in_cookbook' : cookbookId;
    }

    if (userId) {
      filters.userId = userId;
    }

    if (needsReview !== null) {
      filters.needsReview = needsReview === 'true';
    }

    const { data, error } = await getAllRecipesWithProductionStatusAdmin(filters);
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in /api/admin/operations/recipes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' }, 
      { status: 401 }
    );
  }
}

