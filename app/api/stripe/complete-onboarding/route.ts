import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      paymentIntentId,
      email,
      buyerName,
      coupleFirstName,
      partnerFirstName,
      relationship,
      giftDate,
      giftDateUndecided,
      bookCloseDate,
      password,
      // Reason: Couple flow passes extra fields
      coupleLastName,
      partnerLastName,
      weddingDate,
      weddingDateUndecided,
      userType,
    } = body;

    // Reason: Validate userType against allowlist to prevent arbitrary strings in DB
    const validUserTypes = ['couple', 'gift_giver'] as const;
    type ValidUserType = typeof validUserTypes[number];
    const resolvedUserType: ValidUserType = validUserTypes.includes(userType) ? userType : 'gift_giver';

    if (!paymentIntentId || !email || !buyerName || !coupleFirstName || !partnerFirstName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (password && password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // 1. Validate payment
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Reason: Verify the email matches what was stored on the PI to prevent account hijacking
    const piEmail = paymentIntent.metadata?.email?.trim().toLowerCase();
    if (piEmail && piEmail !== email.trim().toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match payment record' }, { status: 403 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const bookQuantity = parseInt(paymentIntent.metadata.bookQuantity || '1', 10);

    // 2. Idempotency: if order already has a user_id, return early
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, couple_name')
      .eq('stripe_payment_intent', paymentIntentId)
      .single();

    if (existingOrder?.couple_name) {
      // Reason: Already completed — generate a fresh login token and return
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/auth/callback?next=/profile/groups`,
        },
      });

      const tokenHash = extractTokenHash(linkData?.properties?.action_link);
      return NextResponse.json({ success: true, tokenHash, email });
    }

    // 3. Find or create user
    let userId: string | null = null;
    // Reason: Query profiles table (indexed on email) instead of listUsers() which loads all users
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    const existingUser = existingProfile ? { id: existingProfile.id } : null;

    if (existingUser) {
      userId = existingUser.id;
      // Reason: Webhook may have created the profile without a name or with empty string — update if missing
      await supabaseAdmin
        .from('profiles')
        .update({ full_name: buyerName })
        .eq('id', userId)
        .or('full_name.is.null,full_name.eq.');

      // Reason: Set password on webhook-created user so they can log in with email+password
      if (password) {
        await supabaseAdmin.auth.admin.updateUserById(userId!, { password });
      }
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password || undefined,
        email_confirm: true,
        user_metadata: {
          user_type: resolvedUserType,
          source: 'embedded_checkout',
        },
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
      }
      userId = newUser.user.id;

      // Create profile for new user
      await supabaseAdmin.from('profiles').insert({
        id: userId,
        email,
        user_type: resolvedUserType as 'couple' | 'gift_giver',
        full_name: buyerName,
      });
    }

    // 4. Create group + member + cookbook
    const coupleName = `${coupleFirstName} & ${partnerFirstName}`;

    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .insert({
        name: coupleName,
        description: `A wedding recipe book for ${coupleName}`,
        created_by: userId,
        couple_first_name: coupleFirstName,
        couple_last_name: coupleLastName || null,
        partner_first_name: partnerFirstName,
        partner_last_name: partnerLastName || null,
        relationship_to_couple: relationship || null,
        gift_date: giftDate || null,
        gift_date_undecided: giftDateUndecided || false,
        book_close_date: bookCloseDate || null,
        wedding_date: weddingDate || null,
        wedding_date_undecided: weddingDateUndecided || false,
      })
      .select('id')
      .single();

    if (groupError) {
      // Reason: previously this only logged and continued, which left paid users
      // stranded in an empty dashboard with couple_name written but no group.
      // Now we surface the failure so the frontend can show a clear support message.
      console.error('Error creating group:', groupError);
      return NextResponse.json(
        {
          error:
            "We couldn't create your book. Please email us at team@smallplatesandcompany.com and we'll fix it right away — your payment is safe.",
        },
        { status: 500 }
      );
    }
    if (group) {
      await supabaseAdmin.from('group_members').insert({
        group_id: group.id,
        profile_id: userId,
        role: 'owner',
        relationship_to_couple: relationship || null,
      });

      await supabaseAdmin.from('cookbooks').insert({
        user_id: userId,
        name: coupleName,
        description: `Recipe book for ${coupleName}`,
        is_group_cookbook: true,
        group_id: group.id,
      });
    }

    // 5. Update order record with user info
    if (existingOrder) {
      await supabaseAdmin
        .from('orders')
        .update({
          user_id: userId,
          email,
          couple_name: coupleName,
          group_id: group?.id || null,
        })
        .eq('id', existingOrder.id);
    } else {
      // Reason: Webhook may not have fired yet — create the order
      await supabaseAdmin.from('orders').insert({
        user_id: userId,
        email,
        stripe_payment_intent: paymentIntentId,
        amount_total: paymentIntent.amount,
        book_quantity: bookQuantity,
        couple_name: coupleName,
        user_type: resolvedUserType,
        group_id: group?.id || null,
        onboarding_data: { coupleFirstName, partnerFirstName, relationship, buyerName },
        status: 'paid',
      });
    }

    // 6. Generate magic link for auto-login
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/auth/callback?next=/profile/groups`,
      },
    });

    if (linkError) {
      console.error('Error generating magic link:', linkError);
      return NextResponse.json({ error: 'Account created but login failed' }, { status: 500 });
    }

    const tokenHash = extractTokenHash(linkData?.properties?.action_link);

    // Reason: Welcome email is already sent by the webhook on payment_intent.succeeded.
    // No need to send a second one here — the user is already auto-logged in via tokenHash.

    return NextResponse.json({ success: true, tokenHash, email });
  } catch (err) {
    console.error('Error completing onboarding:', err);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

/**
 * Extract token_hash from Supabase magic link URL
 * URL format: https://...supabase.co/auth/v1/verify?token=...&type=magiclink&redirect_to=...
 */
function extractTokenHash(actionLink: string | undefined): string | null {
  if (!actionLink) return null;
  try {
    const url = new URL(actionLink);
    return url.searchParams.get('token') || url.hash?.split('token_hash=')[1]?.split('&')[0] || null;
  } catch {
    return null;
  }
}
