import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createSupabaseServer } from "@/lib/supabase/server";
import { pricePerCopy, MIN_RECIPES_TO_PRINT } from "@/lib/stripe/pricing";

// Reason: Countries we can ship to. Mirrors the list the old in-app shipping form
// supported (US, MX, EU). Stripe collects the address natively for us now.
const SHIPPING_ALLOWED_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] = [
  "US", "MX",
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
];

export async function POST(request: NextRequest) {
  try {
    const { groupId, qty } = await request.json();

    if (!groupId || typeof groupId !== "string") {
      return NextResponse.json({ error: "Invalid groupId" }, { status: 400 });
    }
    if (!qty || !Number.isInteger(qty) || qty < 1 || qty > 10) {
      return NextResponse.json({ error: "qty must be between 1 and 10" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Reason: Only the captain (group.created_by) can close & pay for the book.
    // We also guard against closing a book that is not in free_tier or is already
    // closed, so we never double-charge for the base book.
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, created_by, status, book_closed_by_user")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    if (group.created_by !== user.id) {
      return NextResponse.json(
        { error: "Only the owner of this book can close it. Please contact them directly." },
        { status: 403 }
      );
    }
    if (group.book_closed_by_user) {
      return NextResponse.json({ error: "Book is already closed" }, { status: 409 });
    }
    if (group.status !== "free_tier") {
      return NextResponse.json({ error: "Book is not eligible to be closed" }, { status: 409 });
    }

    // Reason: Defense in depth — the client gates the quantity/checkout steps at
    // MIN_RECIPES_TO_PRINT, but re-check here so a crafted request can't create a
    // paid session for a book below the print minimum. Count via group_recipes,
    // the same join the review-recipes route reads.
    const { count: recipeCount, error: countError } = await supabase
      .from("group_recipes")
      .select("recipe_id", { count: "exact", head: true })
      .eq("group_id", groupId);

    if (countError) {
      return NextResponse.json({ error: "Failed to verify recipe count" }, { status: 500 });
    }
    if ((recipeCount ?? 0) < MIN_RECIPES_TO_PRINT) {
      return NextResponse.json(
        { error: `Your book needs at least ${MIN_RECIPES_TO_PRINT} recipes before it can be printed.` },
        { status: 409 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error("create-checkout-book-close-session: NEXT_PUBLIC_BASE_URL is not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Reason: One catalog Product, dynamic per-copy price. We reference a single
    // Stripe Product by id (price_data.product) — not an inline product_data.name,
    // which would mint a throwaway ad-hoc product per checkout and fragment
    // per-product reporting. The amount stays dynamic in code (pricePerCopy × qty),
    // so every sale rolls up under the same product and product-scoped coupons can
    // still match it.
    const cookbookProductId = process.env.STRIPE_PRODUCT_ID_COOKBOOK;
    if (!cookbookProductId) {
      console.error("create-checkout-book-close-session: STRIPE_PRODUCT_ID_COOKBOOK is not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Reason: Per-person pricing shown natively — ONE line at the per-person price
    // × copies, so Stripe's "× N" and subtotal match the cart and pricing page
    // exactly (calculateSubtotal === pricePerCopy × qty). Order-level promotion
    // codes still apply (allow_promotion_codes below). Fulfillment reads
    // metadata.qty + amount_total, never the line items, so this is display-only.
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "usd",
          product: cookbookProductId,
          unit_amount: pricePerCopy(qty) * 100,
        },
        quantity: qty,
      },
    ];

    // Reason: Stripe does NOT propagate Session metadata to the PaymentIntent.
    // Copy it to payment_intent_data.metadata so the payment_intent.succeeded
    // handler can early-return and let checkout.session.completed own this flow.
    const sharedMetadata: Record<string, string> = {
      type: "book_close_purchase",
      groupId,
      userId: user.id,
      qty: String(qty),
      email: user.email || "",
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email || undefined,
      line_items: lineItems,
      // Reason: Collect the shipping address inside Stripe Checkout instead of a
      // separate in-app form. The webhook reads it back and persists it.
      shipping_address_collection: { allowed_countries: SHIPPING_ALLOWED_COUNTRIES },
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
      metadata: sharedMetadata,
      payment_intent_data: {
        receipt_email: user.email || undefined,
        metadata: sharedMetadata,
      },
      // Reason: pass the just-closed group via ?group= so the dashboard deep-link
      // effect re-selects IT on return. Without this, the page auto-selects the
      // first NON-closed book (RedesignedGroupsSection picks `!book_closed_by_user`),
      // landing the owner on the wrong book right after paying.
      success_url: `${baseUrl}/profile/groups?from=book-close-purchase&group=${groupId}`,
      cancel_url: `${baseUrl}/profile/groups`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("create-checkout-book-close-session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
