import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { emitPostPaymentAutoLogin } from "@/lib/stripe/post-payment-setup";

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

    // Reason: emitPostPaymentAutoLogin handles the magic link + Postmark send
    // for both new and returning users. Safe to call from the resend path.
    await emitPostPaymentAutoLogin({
      email: email.trim().toLowerCase(),
      buyerName: buyerName.trim(),
      // Reason: At resend time, the user already exists in the DB (either the
      // webhook processed OR they were a returning customer). Treating as
      // existing skips the onboarding welcome copy that new users get.
      wasExisting: true,
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
