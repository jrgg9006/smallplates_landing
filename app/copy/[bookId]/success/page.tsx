import Image from "next/image";
import { stripe } from "@/lib/stripe/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function NotAvailable() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center px-6">
      <Image
        src="/images/SmallPlates_logo_horizontal.png"
        alt="Small Plates & Co."
        width={200}
        height={40}
        priority
      />
      <p className="text-[15px] text-[#8A8780] mt-8 text-center">
        We couldn&apos;t verify this order. If you just paid, check your email for a receipt.
      </p>
      <p className="text-[13px] text-[#8A8780] mt-3 text-center">
        Questions?{" "}
        <a
          href="mailto:team@smallplatesandcompany.com"
          className="underline hover:text-[#2D2D2D] transition-colors"
        >
          team@smallplatesandcompany.com
        </a>
      </p>
    </div>
  );
}

// TODO(phase-9): upgrade this to a client component that polls /orders by
// session_id instead of relying on a hard meta-refresh. Current approach is
// good enough for the common case (webhook <2s) but full-page reloads are
// disruptive if the webhook takes longer than expected.
function OrderProcessing() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center px-6">
      {/* Reason: Auto-refresh every 5s to cover the race window between Stripe
          redirect and webhook processing. Most webhooks complete in <2s so the
          user sees the success state quickly without manual refresh. */}
      <meta httpEquiv="refresh" content="5" />
      <Image
        src="/images/SmallPlates_logo_horizontal.png"
        alt="Small Plates & Co."
        width={200}
        height={40}
        priority
      />
      <p className="text-[15px] text-[#2D2D2D] mt-8 text-center">
        Your payment was successful.
      </p>
      <p className="text-[13px] text-[#8A8780] mt-3 text-center max-w-sm">
        We&apos;re finalizing your order. This page will refresh automatically.
      </p>
    </div>
  );
}

export default async function CopySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;

  if (!params.session_id) {
    return <NotAvailable />;
  }

  // Reason: Sanitize session_id — Stripe Checkout Session IDs follow cs_* + alphanumeric.
  if (!/^cs_[A-Za-z0-9_]+$/.test(params.session_id)) {
    return <NotAvailable />;
  }

  // TODO(phase-9): cache this retrieve. Each page render hits Stripe API
  // with no cache — fine for a single visit but multiple refreshes or the
  // auto-refresh in OrderProcessing multiply the round-trips.
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(params.session_id);
  } catch {
    return <NotAvailable />;
  }

  if (session.status !== "complete" || session.payment_status !== "paid") {
    return <NotAvailable />;
  }

  if (session.metadata?.type !== "copy_order_purchase") {
    return <NotAvailable />;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  if (!paymentIntentId) {
    return <NotAvailable />;
  }

  const supabase = createSupabaseAdminClient();

  // Reason: Webhook creates the order. If we beat the webhook to the query
  // (rare but possible), show a processing state with a refresh hint.
  const { data: order } = await supabase
    .from("orders")
    .select("book_quantity, shipping_address, couple_name, email, amount_total")
    .eq("stripe_payment_intent", paymentIntentId)
    .maybeSingle();

  if (!order) {
    return <OrderProcessing />;
  }

  const address = order.shipping_address as {
    recipient_name?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  } | null;

  const addressLine = address
    ? [address.city, address.state, address.postal_code, address.country]
        .filter(Boolean)
        .join(", ")
    : null;

  const totalDollars = (order.amount_total ?? 0) / 100;

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <div className="flex items-start justify-center min-h-full px-6 pt-10 pb-16">
        <div className="w-full max-w-[560px]">
          <div className="flex justify-center mb-10">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Co."
              width={200}
              height={40}
              priority
            />
          </div>

          <p className="text-xs text-[#D4A854] uppercase tracking-[0.08em] text-center mb-2 font-medium">
            Order confirmed
          </p>

          <h1 className="font-serif text-[34px] text-[#2D2D2D] text-center leading-tight mb-3">
            Your {order.book_quantity === 1 ? "copy is" : "copies are"} on the way.
          </h1>

          <p className="text-sm text-[#8A8780] text-center mb-8">
            We&apos;ll email you tracking details when it ships. Arrives in approximately 3 weeks.
          </p>

          <div className="bg-white border border-[rgba(45,45,45,0.12)] rounded-[10px] px-[18px] py-[16px] space-y-4 mb-8">
            <div>
              <p className="text-[11px] text-[#8A8780] uppercase tracking-[0.08em] mb-0.5">Book</p>
              <p className="text-[15px] text-[#2D2D2D]">{order.couple_name || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8A8780] uppercase tracking-[0.08em] mb-0.5">Copies</p>
              <p className="text-[15px] text-[#2D2D2D]">
                {order.book_quantity} {order.book_quantity === 1 ? "copy" : "copies"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#8A8780] uppercase tracking-[0.08em] mb-0.5">Total paid</p>
              <p className="text-[15px] text-[#2D2D2D]">${totalDollars}</p>
            </div>
            {addressLine && (
              <div>
                <p className="text-[11px] text-[#8A8780] uppercase tracking-[0.08em] mb-0.5">Ships to</p>
                <p className="text-[15px] text-[#2D2D2D]">
                  {address?.recipient_name && <>{address.recipient_name}<br /></>}
                  {addressLine}
                </p>
              </div>
            )}
          </div>

          <p className="text-[13px] text-[#8A8780] text-center leading-relaxed">
            {order.email && <>A receipt is on its way to {order.email}.<br /></>}
            Questions?{" "}
            <a
              href="mailto:team@smallplatesandcompany.com"
              className="underline hover:text-[#2D2D2D] transition-colors"
            >
              team@smallplatesandcompany.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
