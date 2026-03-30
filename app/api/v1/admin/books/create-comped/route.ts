import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { canCreateCompedBooks, COMPED_EMAILS } from '@/lib/config/admin';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth: verify caller is in the comped-emails whitelist
    const supabaseAuth = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!canCreateCompedBooks(user.email)) {
      return NextResponse.json({ error: 'Not authorized to create comped books' }, { status: 403 });
    }

    // 2. Parse body — same fields as complete-onboarding + ownerEmail
    const body = await request.json();
    const {
      ownerEmail,
      coupleFirstName,
      partnerFirstName,
      relationship,
      weddingDate,
      weddingDateUndecided,
      userType,
    } = body;

    if (!coupleFirstName || !partnerFirstName) {
      return NextResponse.json({ error: 'Couple names are required' }, { status: 400 });
    }

    // Reason: ownerEmail must be one of the whitelisted emails to prevent abuse
    const targetEmail = ownerEmail?.trim().toLowerCase();
    if (!targetEmail || !COMPED_EMAILS.includes(targetEmail)) {
      return NextResponse.json({ error: 'Invalid owner email' }, { status: 400 });
    }

    const validUserTypes = ['couple', 'gift_giver'] as const;
    type ValidUserType = typeof validUserTypes[number];
    const resolvedUserType: ValidUserType = validUserTypes.includes(userType) ? userType : 'gift_giver';

    const supabaseAdmin = createSupabaseAdminClient();

    // 3. Find the target owner's profile
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', targetEmail)
      .single();

    if (!existingProfile) {
      return NextResponse.json({ error: `Profile not found for ${targetEmail}. That user needs to log in at least once first.` }, { status: 400 });
    }

    const userId = existingProfile.id;
    const coupleName = `${coupleFirstName.trim()} & ${partnerFirstName.trim()}`;

    // 4. Create group — same shape as complete-onboarding
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .insert({
        name: coupleName,
        description: `A wedding recipe book for ${coupleName}`,
        created_by: userId,
        couple_first_name: coupleFirstName.trim(),
        partner_first_name: partnerFirstName.trim(),
        relationship_to_couple: resolvedUserType === 'couple' ? 'couple' : (relationship || null),
        wedding_date: weddingDate || null,
        wedding_date_undecided: weddingDateUndecided || false,
      })
      .select('id, name')
      .single();

    if (groupError) {
      return NextResponse.json({ error: `Failed to create group: ${groupError.message}` }, { status: 500 });
    }

    // 5. Add owner as group member
    await supabaseAdmin.from('group_members').insert({
      group_id: group.id,
      profile_id: userId,
      role: 'owner',
      relationship_to_couple: resolvedUserType === 'couple' ? 'couple' : (relationship || null),
    });

    // 6. Create cookbook
    await supabaseAdmin.from('cookbooks').insert({
      user_id: userId,
      name: coupleName,
      description: `Recipe book for ${coupleName}`,
      is_group_cookbook: true,
      group_id: group.id,
    });

    // 7. Create order record marked as comped
    await supabaseAdmin.from('orders').insert({
      user_id: userId,
      email: targetEmail,
      stripe_payment_intent: `comped_by_${user.email}`,
      amount_total: 0,
      book_quantity: 1,
      couple_name: coupleName,
      user_type: resolvedUserType,
      onboarding_data: { comped: true, created_by: user.email },
      status: 'paid',
    });

    return NextResponse.json({ success: true, groupId: group.id, name: coupleName });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
