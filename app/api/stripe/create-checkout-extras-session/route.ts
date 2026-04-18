import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ADDITIONAL_BOOK_PRICE } from "@/lib/stripe/pricing";

export async function POST(request: NextRequest) {
  try {
    const { groupId, qty } = await request.json();

    if (!groupId || typeof groupId !== "string") {
      return NextResponse.json({ error: "Invalid groupId" }, { status: 400 });
    }
    if (!qty || !Number.isInteger(qty) || qty < 1 || qty > 5) {
      return NextResponse.json({ error: "qty must be between 1 and 5" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Reason: Only the captain (group.created_by) can buy extras in the post-close
    // flow. Other members can buy their own copies via the public /copy/[bookId] link.
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, created_by, name")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.created_by !== user.id) {
      return NextResponse.json(
        { error: "Only the captain can buy extras" },
        { status: 403 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error("create-checkout-extras-session: NEXT_PUBLIC_BASE_URL is not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Reason: Same metadata on Session and PaymentIntent. Stripe does NOT propagate
    // Session metadata to the PI automatically — the payment_intent.succeeded handler
    // reads the PI metadata to decide early-return, so we must copy it manually.
    const sharedMetadata = {
      type: "extra_copies_purchase",
      groupId,
      userId: user.id,
      qty: String(qty),
      email: user.email || "",
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Additional Cookbook Copy",
              description: "Extra hardcover copy of your Small Plates cookbook",
            },
            unit_amount: ADDITIONAL_BOOK_PRICE * 100,
          },
          quantity: qty,
        },
      ],
      metadata: sharedMetadata,
      payment_intent_data: { metadata: sharedMetadata },
      allow_promotion_codes: true,
      success_url: `${baseUrl}/profile/groups?from=extras-purchase`,
      cancel_url: `${baseUrl}/profile/groups`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("create-checkout-extras-session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
