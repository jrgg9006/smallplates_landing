import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { 
  updateRecipeProductionStatusAdmin,
  markRecipeAsReviewedAdmin 
} from '@/lib/supabase/operations';
import type { RecipeProductionStatusUpdate } from '@/lib/types/database';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdminAuth();
    
    const { recipeId } = await params;
    const body = await req.json() as RecipeProductionStatusUpdate;

    const { data, error } = await updateRecipeProductionStatusAdmin(recipeId, body);
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/admin/operations/recipes/[recipeId] PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' }, 
      { status: 401 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdminAuth();
    
    const { recipeId } = await params;

    const { data, error } = await markRecipeAsReviewedAdmin(recipeId);
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/admin/operations/recipes/[recipeId] POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' }, 
      { status: 401 }
    );
  }
}

