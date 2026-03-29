import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

/**
 * POST /api/v1/groups/[groupId]/shipping
 * Create a shipping address for a group's book delivery.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('profile_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: 'Permission denied. You must be a group member.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { recipient_name, street_address, apartment_unit, city, state, postal_code, phone_number } = body;

    if (!recipient_name?.trim() || !street_address?.trim() || !city?.trim() || !state?.trim() || !postal_code?.trim()) {
      return NextResponse.json(
        { error: 'recipient_name, street_address, city, state, and postal_code are required' },
        { status: 400 }
      );
    }

    // Reason: Remove any existing shipping address for this group before inserting new one
    await supabase
      .from('shipping_addresses')
      .delete()
      .eq('group_id', groupId);

    const { data, error: insertError } = await supabase
      .from('shipping_addresses')
      .insert({
        user_id: user.id,
        group_id: groupId,
        recipient_name: recipient_name.trim(),
        street_address: street_address.trim(),
        apartment_unit: apartment_unit?.trim() || null,
        city: city.trim(),
        state: state.trim(),
        postal_code: postal_code.trim(),
        country: 'United States',
        phone_number: phone_number?.trim() || null,
        is_default: false,
      })
      .select()
      .single();

    if (insertError || !data) {
      return NextResponse.json(
        { error: 'Failed to save shipping address' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, address: data });
  } catch (error) {
    console.error('Error saving shipping address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/groups/[groupId]/shipping
 * Get the shipping address for a group.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('group_id', groupId)
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ address: null });
    }

    return NextResponse.json({ address: data });
  } catch (error) {
    console.error('Error fetching shipping address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
