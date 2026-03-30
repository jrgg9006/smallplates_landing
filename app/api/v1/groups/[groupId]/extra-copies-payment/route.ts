import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { ADDITIONAL_BOOK_PRICE, calculateShipping } from "@/lib/stripe/pricing";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reason: Verify user is a member of this group
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("profile_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const { qty, includeShipping } = await request.json();

    if (!qty || qty < 1 || qty > 5) {
      return NextResponse.json(
        { error: "Quantity must be between 1 and 5" },
        { status: 400 }
      );
    }

    let amount = qty * ADDITIONAL_BOOK_PRICE * 100; // cents

    // Reason: Add shipping cost when book is already printed (separate shipment)
    if (includeShipping) {
      const shippingUsd = calculateShipping(qty, "US");
      amount += shippingUsd * 100;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: user.email || undefined,
      metadata: {
        groupId,
        type: "extra_copies",
        qty: String(qty),
        userId: user.id,
        includeShipping: includeShipping ? "true" : "false",
      },
      description: `Small Plates — ${qty} extra ${qty === 1 ? "copy" : "copies"}${includeShipping ? " (incl. shipping)" : ""}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("Error creating extra copies payment intent:", err);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

// Reason: After successful payment, record the extra copy order in the orders table
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("profile_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const { additionalCopies, paymentIntentId, amount, shippingAddress } = await request.json();

    if (!additionalCopies || additionalCopies < 1 || additionalCopies > 5) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    // Reason: Insert a new order row instead of incrementing a counter on groups
    const { error: insertError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        email: user.email || "",
        stripe_payment_intent: paymentIntentId,
        amount_total: amount || null,
        book_quantity: additionalCopies,
        shipping_address: shippingAddress || null,
        status: "paid",
        order_type: "extra_copy",
        group_id: groupId,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error recording extra copy order:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
