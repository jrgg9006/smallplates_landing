import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { emitPostPaymentAutoLogin } from "@/lib/stripe/post-payment-setup";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    if (session.metadata?.type !== "initial_purchase") {
      return NextResponse.json(
        { error: "Invalid session type" },
        { status: 400 }
      );
    }

    const email = session.customer_details?.email || session.customer_email;
    const buyerName = session.customer_details?.name || "";

    if (!email) {
      return NextResponse.json(
        { error: "No email found in session" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Reason: Determine wasExisting based on order history, not profile existence.
    // After the webhook processes the current purchase, profiles always exist —
    // but that doesn't mean the user was "returning" before this purchase.
    // Counting orders is the accurate semantic: 1 order = new user, 2+ = returning.
    const supabaseAdmin = createSupabaseAdminClient();
    const { count, error: countError } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("email", normalizedEmail);

    if (countError) {
      console.error("resend-welcome-email: order count query failed", countError);
      // Reason: Fall back to wasExisting=false (treat as new user) on query failure.
      // Better to show "Welcome" to a returning user than "Welcome back" to a new one.
    }

    const wasExisting = (count ?? 0) > 1;

    // Reason: emitPostPaymentAutoLogin handles the magic link + Postmark send
    // for both new and returning users. Safe to call from the resend path.
    await emitPostPaymentAutoLogin({
      email: normalizedEmail,
      buyerName: buyerName.trim(),
      wasExisting,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("resend-welcome-email error:", error);
    return NextResponse.json(
      { error: "Failed to resend email" },
      { status: 500 }
    );
  }
}
