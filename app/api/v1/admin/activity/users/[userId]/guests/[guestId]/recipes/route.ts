import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { getRecipesByGuestAdmin } from '@/lib/supabase/admin-recipes';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; guestId: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdminAuth();
    
    const { userId, guestId } = await params;
    
    // Use admin service client - bypasses RLS
    const supabase = createSupabaseAdminClient();
    
    // Fetch guest info
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .eq('user_id', userId)
      .single();

    if (guestError || !guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    // Fetch user info
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use admin function - guarantees array return
    const { data: recipes, error: recipesError } = await getRecipesByGuestAdmin(guestId);

    if (recipesError) {
      return NextResponse.json({ error: recipesError }, { status: 500 });
    }

    return NextResponse.json({
      guest,
      user: userProfile,
      recipes
    });
  } catch (error) {
    console.error('Error in guest recipes API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}