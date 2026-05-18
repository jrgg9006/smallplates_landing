import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { canCreateCompedBooks } from '@/lib/config/admin';
import {
  findOrCreateUser,
  upsertBuyerProfile,
  findOrCreatePendingGroup,
  emitPostPaymentAutoLogin,
} from '@/lib/stripe/post-payment-setup';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    // 1. Caller must be in the comped-emails whitelist.
    const supabaseAuth = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!canCreateCompedBooks(user.email)) {
      return NextResponse.json({ error: 'Not authorized to create comped books' }, { status: 403 });
    }

    // 2. Parse + validate.
    const body = await request.json();
    const email: string = (body.email || '').trim().toLowerCase();
    const customerName: string = (body.customerName || '').trim();
    const amountCashDollars = Number(body.amountCashDollars);
    const bookQuantity = parseInt(body.bookQuantity, 10);
    const weddingDate: string | null = body.weddingDate || null;
    const weddingDateUndecided: boolean = body.weddingDateUndecided === true;
    const isDemo: boolean = body.isDemo === true;

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (!customerName) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }
    if (!Number.isFinite(amountCashDollars) || amountCashDollars < 0) {
      return NextResponse.json({ error: 'Amount must be ≥ 0' }, { status: 400 });
    }
    if (!Number.isInteger(bookQuantity) || bookQuantity < 1) {
      return NextResponse.json({ error: 'Book quantity must be ≥ 1' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // 3. Find or create the auth user + profile skeleton.
    const { userId, wasExisting } = await findOrCreateUser(supabaseAdmin, email, customerName);
    if (!userId) {
      return NextResponse.json({ error: 'Could not provision user' }, { status: 500 });
    }

    // 4. Upsert profile with full_name + user_type. Customer can correct their relationship
    //    later in CoupleNamesModal (organizer_relationship is stored on groups, not profiles).
    await upsertBuyerProfile(supabaseAdmin, userId, email, customerName);

    // 5. Create pending_setup group. Reason: DB trigger `add_group_creator_as_owner_trigger`
    //    inserts the owner row in group_members, and `create_group_cookbook_trigger` creates
    //    the cookbook automatically — same as Stripe's post-payment flow.
    const { groupId } = await findOrCreatePendingGroup(
      supabaseAdmin,
      userId,
      null,
      weddingDate,
      weddingDateUndecided,
      null
    );

    if (!groupId) {
      return NextResponse.json({ error: 'Could not create group' }, { status: 500 });
    }

    // 6. Cash order. Mirrors a Stripe initial_purchase order but with a synthetic
    //    payment_intent identifier so it's traceable and unique.
    const paymentIntentId = `comped_cash_${crypto.randomUUID()}`;
    const amountCents = Math.round(amountCashDollars * 100);

    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        email,
        stripe_payment_intent: paymentIntentId,
        amount_total: amountCents,
        book_quantity: bookQuantity,
        couple_name: null,
        user_type: 'gift_giver',
        order_type: 'initial_purchase',
        status: 'paid',
        group_id: groupId,
        onboarding_data: {
          comped: true,
          payment_method: 'cash',
          is_demo: isDemo,
          created_by: user.email,
          customer_name: customerName,
        },
      });

    if (orderError) {
      console.error('create-comped: order insert failed', orderError);
      return NextResponse.json({ error: `Failed to create order: ${orderError.message}` }, { status: 500 });
    }

    // 7. Magic link + welcome email — same template the Stripe webhook uses.
    await emitPostPaymentAutoLogin({
      email,
      buyerName: customerName,
      wasExisting,
    });

    return NextResponse.json({ success: true, groupId, email });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('create-comped route error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
