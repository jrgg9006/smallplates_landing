import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  ADDITIONAL_BOOK_PRICE,
  EXTRA_COPIES_SHIPPING_COST,
} from "@/lib/stripe/pricing";

// TODO(phase-9): supersedes actions/createCopyOrderPaymentIntent.ts (now orphan).
// Delete the legacy server action after this endpoint has been in production
// long enough to confirm no stale clients still call it.
// TODO(phase-9-security): no rate limit on this public endpoint. A loop could
// create thousands of Stripe sessions (noise in dashboard + potential promo
// code abuse). Add IP-based throttling or Stripe idempotency-key gating.

interface ShippingAddressBody {
  recipientName: string;
  streetAddress: string;
  apartmentUnit?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
}

// Reason: Basic email regex — good enough for pre-payment validation.
// Stripe will validate authoritatively during checkout.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Reason: UUID v4 shape check — bookId is a groups.id UUID.
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const { bookId, qty, email, shippingAddress } = (await request.json()) as {
      bookId?: string;
      qty?: number;
      email?: string;
      shippingAddress?: ShippingAddressBody;
    };

    if (!bookId || !UUID_REGEX.test(bookId)) {
      return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
    }
    if (!qty || !Number.isInteger(qty) || qty < 1 || qty > 5) {
      return NextResponse.json(
        { error: "qty must be between 1 and 5" },
        { status: 400 }
      );
    }
    const trimmedEmail = (email || "").trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (
      !shippingAddress ||
      !shippingAddress.recipientName ||
      !shippingAddress.streetAddress ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode ||
      !shippingAddress.country
    ) {
      return NextResponse.json(
        { error: "Incomplete shipping address" },
        { status: 400 }
      );
    }

    // Reason: No auth — this is a public flow. Any third party with the link
    // can order a copy. We still verify the book exists and is closed so the
    // order is meaningful downstream.
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: book, error: bookError } = await supabaseAdmin
      .from("groups")
      .select("id, name, book_closed_by_user")
      .eq("id", bookId)
      .maybeSingle();

    if (bookError || !book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    if (!book.book_closed_by_user) {
      return NextResponse.json(
        { error: "This book is not available for ordering" },
        { status: 403 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error(
        "create-checkout-copy-order-session: NEXT_PUBLIC_BASE_URL is not set"
      );
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    // Reason: Same metadata on Session and PaymentIntent — consistent with
    // Phase 7A and 7B. The webhook's payment_intent.succeeded early-return
    // guard reads the PI metadata to avoid double-processing.
    const sharedMetadata: Record<string, string> = {
      type: "copy_order_purchase",
      bookId,
      email: trimmedEmail,
      qty: String(qty),
      shipping_recipient_name: shippingAddress.recipientName,
      shipping_street_address: shippingAddress.streetAddress,
      shipping_apartment_unit: shippingAddress.apartmentUnit || "",
      shipping_city: shippingAddress.city,
      shipping_state: shippingAddress.state,
      shipping_postal_code: shippingAddress.postalCode,
      shipping_country: shippingAddress.country,
      shipping_phone_number: shippingAddress.phoneNumber || "",
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: trimmedEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Cookbook Copy",
              description: `Your copy of ${book.name}`,
            },
            unit_amount: ADDITIONAL_BOOK_PRICE * 100,
          },
          quantity: qty,
        },
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Shipping",
              description: "Flat-rate shipping to your address",
            },
            unit_amount: EXTRA_COPIES_SHIPPING_COST * 100,
          },
          quantity: 1,
        },
      ],
      metadata: sharedMetadata,
      // Reason: receipt_email guarantees Stripe sends the automatic receipt in
      // test and live modes regardless of the Dashboard toggle. The Dashboard
      // docs state this parameter overrides the global setting.
      payment_intent_data: {
        receipt_email: trimmedEmail,
        metadata: sharedMetadata,
      },
      allow_promotion_codes: true,
      success_url: `${baseUrl}/copy/${bookId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/copy/${bookId}`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("create-checkout-copy-order-session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
