import Image from "next/image";
import { stripe } from "@/lib/stripe/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

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

export default async function CopySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string }>;
}) {
  const params = await searchParams;

  if (!params.payment_intent) {
    return <NotAvailable />;
  }

  // Reason: Sanitize to prevent XSS — Stripe PI IDs are always pi_ + alphanumeric
  if (!/^pi_[A-Za-z0-9_]+$/.test(params.payment_intent)) {
    return <NotAvailable />;
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(params.payment_intent);
  } catch {
    return <NotAvailable />;
  }

  if (paymentIntent.status !== "succeeded") {
    return <NotAvailable />;
  }

  const { bookId, qty: qtyStr, email } = paymentIntent.metadata;
  const qty = parseInt(qtyStr, 10);
  const totalDollars = paymentIntent.amount / 100;

  const supabase = createSupabaseAdminClient();

  // Reason: Insert order on success — idempotent via upsert on stripe_payment_intent
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_payment_intent", params.payment_intent)
    .single();

  // Reason: Parse shipping address from metadata where we stored it during PaymentIntent creation
  const shippingAddress = paymentIntent.metadata.shipping_address
    ? JSON.parse(paymentIntent.metadata.shipping_address)
    : null;

  const { data: book } = await supabase
    .from("groups")
    .select("name")
    .eq("id", bookId)
    .single();

  if (!existingOrder) {
    await supabase.from("orders").insert({
      email: email || "",
      book_quantity: qty,
      shipping_address: shippingAddress,
      stripe_payment_intent: params.payment_intent,
      amount_total: paymentIntent.amount,
      status: "paid",
      order_type: "copy_order",
      group_id: bookId,
      couple_name: book?.name || null,
      user_type: "copy_buyer",
    });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("shipping_address")
    .eq("stripe_payment_intent", params.payment_intent)
    .single();

  const address = order?.shipping_address as {
    recipient_name?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  } | null;

  const addressLine = address
    ? [address.city, address.region, address.postal_code, address.country]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <div className="flex items-start justify-center min-h-full px-6 pt-10 pb-16">
        <div className="w-full max-w-[560px]">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Co."
              width={200}
              height={40}
              priority
            />
          </div>

          {/* Eyebrow */}
          <p className="text-xs text-[#D4A854] uppercase tracking-[0.08em] text-center mb-2 font-medium">
            Order confirmed
          </p>

          {/* Title */}
          <h1 className="font-serif text-[34px] text-[#2D2D2D] text-center leading-tight mb-3">
            Your {qty === 1 ? "copy is" : "copies are"} on the way.
          </h1>

          {/* Sub */}
          <p className="text-sm text-[#8A8780] text-center mb-8">
            We&apos;ll email you tracking details when it ships. Arrives in approximately 3 weeks.
          </p>

          {/* Details card */}
          <div className="bg-white border border-[rgba(45,45,45,0.12)] rounded-[10px] px-[18px] py-[16px] space-y-4 mb-8">
            <div>
              <p className="text-[11px] text-[#8A8780] uppercase tracking-[0.08em] mb-0.5">Book</p>
              <p className="text-[15px] text-[#2D2D2D]">{book?.name || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8A8780] uppercase tracking-[0.08em] mb-0.5">Copies</p>
              <p className="text-[15px] text-[#2D2D2D]">
                {qty} {qty === 1 ? "copy" : "copies"}
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

          {/* Footer */}
          <p className="text-[13px] text-[#8A8780] text-center leading-relaxed">
            {email && <>A receipt is on its way to {email}.<br /></>}
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
