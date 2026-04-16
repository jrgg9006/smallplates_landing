import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe/client";
import { OrderConfirmationClient } from "@/components/onboarding/OrderConfirmationClient";

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; payment_intent?: string }>;
}) {
  const params = await searchParams;

  // Reason: Embedded Stripe flow redirects here after 3D Secure with payment_intent param.
  // Redirect user back to onboarding to finish steps 4-5.
  if (params.payment_intent) {
    // Reason: Sanitize to prevent XSS — Stripe PI IDs are always pi_ + alphanumeric
    if (!/^pi_[A-Za-z0-9_]+$/.test(params.payment_intent)) {
      redirect("/");
    }

    // Reason: Fetch userType from PI metadata so we inject into the correct localStorage key
    // and link to the correct onboarding page (couple vs gift_giver).
    let userType: "couple" | "gift_giver" = "gift_giver";
    try {
      const pi = await stripe.paymentIntents.retrieve(params.payment_intent);
      if (pi.metadata?.userType === "couple") userType = "couple";
    } catch {
      // Reason: If PI fetch fails, default to gift_giver (most common 3D Secure path)
    }

    return <EmbeddedFlowRedirect paymentIntentId={params.payment_intent} userType={userType} />;
  }

  // --- Existing hosted checkout flow (couple flow) ---
  if (!params.session_id) {
    redirect("/");
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(params.session_id);
  } catch {
    return <OrderError />;
  }

  if (session.payment_status !== "paid") {
    return <OrderError />;
  }

  const email = session.customer_email;

  if (!email) {
    return <OrderError />;
  }

  // Reason: Extract first name only from buyerName metadata for the greeting
  const fullBuyerName = session.metadata?.buyerName || "";
  const buyerName = fullBuyerName.split(" ")[0];

  return (
    <>
      <OrderConfirmationClient email={email} buyerName={buyerName} />

      {/* Reason: Clear onboarding localStorage now that payment succeeded */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              localStorage.removeItem('onboarding_state_couple');
              localStorage.removeItem('onboarding_state_gift_giver');
            } catch(e) {}
          `,
        }}
      />
    </>
  );
}

/**
 * Shown when user returns from a 3D Secure redirect during the embedded gift flow.
 * Stores paymentIntentId and sends them back to onboarding to finish steps 4-5.
 */
function EmbeddedFlowRedirect({ paymentIntentId, userType }: { paymentIntentId: string; userType: "couple" | "gift_giver" }) {
  // Reason: Each flow stores state under its own localStorage key
  const storageKey = userType === "couple" ? "onboarding_state_couple" : "onboarding_state_gift_giver";
  const resumeUrl = userType === "couple" ? "/onboarding" : "/onboarding";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "#FAF7F2" }}
    >
      <h1
        className="text-[#2D2D2D] mb-4"
        style={{ fontFamily: "Minion Pro, Georgia, serif", fontSize: "2rem" }}
      >
        Payment confirmed.
      </h1>
      <p className="text-[#2D2D2D] max-w-[380px] mb-8">
        Continue setting up your book.
      </p>

      {/* Reason: Store paymentIntentId in localStorage so the onboarding flow can resume */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              var saved = localStorage.getItem('${storageKey}');
              if (saved) {
                var state = JSON.parse(saved);
                state.paymentIntentId = '${paymentIntentId}';
                state.currentStep = 4;
                localStorage.setItem('${storageKey}', JSON.stringify(state));
              }
            } catch(e) {}
          `,
        }}
      />

      <a
        href={resumeUrl}
        className="inline-flex items-center justify-center rounded-full bg-[#D4A854] hover:bg-[#c49b4a] text-white px-8 py-4 text-lg font-medium shadow-lg transition-all duration-200"
      >
        Continue setup &rarr;
      </a>
    </div>
  );
}

function OrderError() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "#FAF7F2" }}
    >
      <h1
        className="text-[#2D2D2D] mb-4"
        style={{ fontFamily: "Minion Pro, Georgia, serif", fontSize: "2rem" }}
      >
        Something went wrong.
      </h1>
      <p className="text-[#2D2D2D] max-w-[380px] mb-6">
        Your payment may not have gone through. Please contact us at{" "}
        <a
          href="mailto:team@smallplatesandcompany.com"
          className="text-[#D4A854] hover:underline"
        >
          team@smallplatesandcompany.com
        </a>
      </p>
    </div>
  );
}
