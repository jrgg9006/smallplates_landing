import Image from "next/image";
import { stripe } from "@/lib/stripe/client";
import ResendButton from "./ResendButton";

export default async function CheckYourEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  // Reason: Server-side validation prevents anyone from navigating to
  // /check-your-email?session_id=fake and seeing the confirmation UI with an
  // arbitrary email. We only trust sessions Stripe confirms as paid and tagged
  // as our initial_purchase flow.
  if (!sessionId || typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return <ErrorState />;
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("check-your-email: sessions.retrieve failed", { sessionId, err });
    return <ErrorState />;
  }

  if (session.payment_status !== "paid") {
    return <ErrorState />;
  }

  if (session.metadata?.type !== "initial_purchase") {
    return <ErrorState />;
  }

  const email = session.customer_details?.email || session.customer_email;
  if (!email) {
    return <ErrorState />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-10">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates & Co."
            width={200}
            height={40}
            priority
          />
        </div>

        <h1 className="font-serif text-[32px] text-[#2D2D2D] mb-4">
          Your book is ready.
        </h1>

        <p className="text-[15px] text-[#5A5550] leading-relaxed mb-2">
          We sent a login link to{" "}
          <span className="text-[#2D2D2D] font-medium">{email}</span>.
        </p>
        <p className="text-[15px] text-[#5A5550] leading-relaxed mb-8">
          Open it when you&apos;re ready to set things up.
        </p>

        <ResendButton sessionId={sessionId} />
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="font-serif text-[32px] text-[#2D2D2D] mb-4">
          Something went wrong.
        </h1>
        <p className="text-[15px] text-[#5A5550] leading-relaxed mb-8">
          We couldn&apos;t find your order. If you just completed a payment, check your email — the login link is on its way.
        </p>
      </div>
    </div>
  );
}
