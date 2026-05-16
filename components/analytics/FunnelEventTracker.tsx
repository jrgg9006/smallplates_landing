"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

type FunnelEvent =
  | { type: "begin_checkout" }
  | {
      type: "purchase";
      transactionId: string;
      value: number;
      currency: string;
    };

const META_EVENT: Record<FunnelEvent["type"], string> = {
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

export default function FunnelEventTracker(props: { event: FunnelEvent }) {
  const { event } = props;

  useEffect(() => {
    // Reason: Dedupe so a refresh on a success/checkout page doesn't double-fire
    // the event. Purchases dedupe by Stripe session id; begin_checkout dedupes
    // per browser session (sessionStorage clears on tab close).
    const dedupeKey =
      event.type === "purchase"
        ? `funnel_${event.type}_${event.transactionId}`
        : `funnel_${event.type}`;

    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(dedupeKey)) return;
      sessionStorage.setItem(dedupeKey, "1");
    } catch {
      // Storage unavailable (private mode, etc.) — fall through and still fire.
    }

    if (event.type === "purchase") {
      window.fbq?.("track", "Purchase", {
        value: event.value,
        currency: event.currency,
        content_ids: [event.transactionId],
      });
      window.gtag?.("event", "purchase", {
        transaction_id: event.transactionId,
        value: event.value,
        currency: event.currency,
      });
      return;
    }

    window.fbq?.("track", META_EVENT[event.type]);
    window.gtag?.("event", event.type);
  }, [event]);

  return null;
}
