'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { AdminOrderRow } from '@/lib/supabase/admin-orders';
import { StatusPill, fmtDate, usd } from './shared';

// Click-to-copy ID row — copies the raw value so it can be pasted into the DB.
function IdRow({ label, value }: { label: string; value: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!value) {
    return (
      <div className="flex w-full items-center justify-between gap-4">
        <span className="text-brand-charcoal/50">{label}</span>
        <span className="font-mono text-xs text-brand-charcoal/30">—</span>
      </div>
    );
  }
  const copy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy"
      className="flex w-full items-center justify-between gap-4 text-left transition-colors hover:text-brand-honey"
    >
      <span className="text-brand-charcoal/50">{label}</span>
      <span className="truncate font-mono text-xs text-brand-charcoal/70">
        {copied ? 'Copied ✓' : value}
      </span>
    </button>
  );
}

export function OrderDetailSheet({
  order,
  onClose,
}: {
  order: AdminOrderRow | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!order} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto bg-brand-warm-white sm:max-w-md">
        {order && (
          <div className="space-y-8">
            <SheetHeader className="space-y-2 text-left">
              <SheetTitle className="text-base font-medium text-brand-charcoal/60">
                {fmtDate(order.created_at)} · {order.orderType.replace(/_/g, ' ')}
              </SheetTitle>
              <StatusPill status={order.status} />
            </SheetHeader>

            {/* Cover ficha — composed like the real book cover */}
            <div className="rounded-2xl border border-brand-sand bg-white px-6 py-10 text-center">
              <div className="text-[0.65rem] uppercase tracking-[0.25em] text-brand-charcoal/50">
                {order.coverLine}
              </div>
              <div className="mx-auto my-4 h-px w-10 bg-brand-honey" />
              <div className="font-serif text-3xl text-brand-charcoal">{order.printName}</div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-brand-charcoal/40">
                Quantity
              </div>
              <div className="mt-1 text-lg">
                {order.bookQuantity} {order.bookQuantity === 1 ? 'book' : 'books'}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-brand-charcoal/40">Shipping</div>
              {order.shipping ? (
                <address className="mt-1 not-italic leading-relaxed text-brand-charcoal/90">
                  <div className="font-medium">{order.shipping.recipient_name || '—'}</div>
                  <div>{order.shipping.street_address}</div>
                  {order.shipping.apartment_unit && <div>{order.shipping.apartment_unit}</div>}
                  <div>
                    {[order.shipping.city, order.shipping.state, order.shipping.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                  <div>{order.shipping.country}</div>
                  {order.shipping.phone_number && (
                    <div className="mt-1 text-brand-charcoal/60">{order.shipping.phone_number}</div>
                  )}
                </address>
              ) : (
                <div className="mt-1 text-brand-charcoal/40">No address on file.</div>
              )}
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-brand-charcoal/40">Payment</div>
              <dl className="mt-1 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-brand-charcoal/50">Amount</dt>
                  <dd className="tabular-nums">{usd(order.amountUsd)}</dd>
                </div>
                {order.discountUsd != null && (
                  <div className="flex justify-between">
                    <dt className="text-brand-charcoal/50">Discount</dt>
                    <dd className="tabular-nums">−{usd(order.discountUsd)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-brand-charcoal/50">Email</dt>
                  <dd className="truncate pl-4">{order.email}</dd>
                </div>
                {order.stripePaymentIntent && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-brand-charcoal/50">Stripe</dt>
                    <dd className="truncate font-mono text-xs text-brand-charcoal/60">
                      {order.stripePaymentIntent}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-brand-charcoal/40">
                Reference
              </div>
              <div className="mt-1 space-y-1 text-sm">
                <IdRow label="Order ID" value={order.id} />
                <IdRow label="Group ID" value={order.groupId} />
                <IdRow label="Owner profile ID" value={order.userId} />
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
