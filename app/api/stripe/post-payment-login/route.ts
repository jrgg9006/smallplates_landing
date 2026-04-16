import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import {
  runPostPaymentSetup,
  emitPostPaymentAutoLogin,
} from "@/lib/stripe/post-payment-setup";

/**
 * POST /api/stripe/post-payment-login
 *
 * Called from the checkout page immediately after a successful `stripe.confirmPayment()`.
 * Does the full synchronous post-payment setup (user + profile + order + group) and
 * returns a magic-link tokenHash so the browser can auto-login without waiting for the
 * webhook.
 *
 * To avoid invalidating magic-link tokens with parallel `generateLink` calls, this
 * endpoint only generates a token when it wrote the order row itself (`orderCreated=true`).
 * If the Stripe webhook beat it to the punch, it returns `{ tokenHash: null }` so the
 * browser falls back to the CheckEmailStep and uses the link the webhook already sent.
 *
 * Body: { paymentIntentId, email, buyerName }
 * Returns: { success: true, tokenHash, email } — `tokenHash` is null if the webhook was first.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paymentIntentId: string | undefined = body.paymentIntentId;
    const rawEmail: string | undefined = body.email;
    const rawBuyerName: string | undefined = body.buyerName;

    if (!paymentIntentId || !rawEmail) {
      return NextResponse.json({ error: "Missing paymentIntentId or email" }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();
    const buyerName = rawBuyerName?.trim() || "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Reason: Anti-hijack — the email we auto-login must match the email on the PI.
    // If piEmail is missing (update-payment-intent never ran), reject — an attacker could
    // call this endpoint with any email and claim someone else's payment.
    const piEmail = paymentIntent.metadata?.email?.trim().toLowerCase();
    if (!piEmail || piEmail !== email) {
      return NextResponse.json({ error: "Email does not match payment record" }, { status: 403 });
    }

    const setup = await runPostPaymentSetup({ paymentIntent, email, buyerName });

    if (!setup.orderCreated) {
      // Reason: The webhook fired first and has already sent its own magic-link email.
      // Generating another token here would invalidate the one in the email. Tell the
      // browser to fall back to the CheckEmailStep.
      return NextResponse.json({
        success: true,
        tokenHash: null,
        email,
        alreadyHandled: true,
      });
    }

    const login = await emitPostPaymentAutoLogin({
      email,
      buyerName,
      wasExisting: setup.wasExisting,
    });

    if (!login.tokenHash) {
      // Reason: generateLink failed server-side. The browser will fall back to CheckEmail.
      return NextResponse.json({ success: true, tokenHash: null, email });
    }

    return NextResponse.json({ success: true, tokenHash: login.tokenHash, email });
  } catch (err) {
    console.error("post-payment-login route error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
