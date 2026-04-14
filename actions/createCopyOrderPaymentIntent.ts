"use server";

import { stripe } from "@/lib/stripe/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface ShippingAddress {
  recipient_name: string;
  street_address: string;
  apartment_unit: string | null;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  phone: string | null;
}

interface CreateCopyOrderInput {
  bookId: string;
  qty: number;
  email: string;
  shippingAddress: ShippingAddress;
}

// Reason: Shipping is included in the book price.
const COPY_PRICE_CENTS = 11900; // $119 per copy
const SHIPPING_CENTS = 0;

export async function createCopyOrderPaymentIntent(input: CreateCopyOrderInput): Promise<
  { clientSecret: string; paymentIntentId: string } | { error: string }
> {
  const { bookId, qty, email, shippingAddress } = input;

  if (!bookId || !email.trim()) {
    return { error: "Missing required fields." };
  }
  if (qty < 1 || qty > 6) {
    return { error: "Quantity must be between 1 and 6." };
  }

  const supabase = createSupabaseAdminClient();

  const { data: book, error: bookError } = await supabase
    .from("groups")
    .select("id, name, book_closed_by_user")
    .eq("id", bookId)
    .single();

  if (bookError || !book) {
    return { error: "Book not found." };
  }

  // Reason: book_closed_by_user (timestamp) is the real indicator that a book was closed
  if (!book.book_closed_by_user) {
    return { error: "This book is not available for ordering." };
  }

  const amountCents = (qty * COPY_PRICE_CENTS) + SHIPPING_CENTS;

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: email.trim(),
      metadata: {
        bookId,
        type: "copy_order",
        qty: String(qty),
        email: email.trim(),
        shipping_address: JSON.stringify(shippingAddress),
      },
      description: `Small Plates — ${qty} copy order for book ${bookId}`,
    });
  } catch {
    return { error: "Failed to create payment. Please try again." };
  }

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}
