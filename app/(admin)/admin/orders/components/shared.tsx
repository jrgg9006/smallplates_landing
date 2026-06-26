import type { OrderStatus } from '@/lib/types/database';

// Reason: statuses that represent a real, money-in sale. Drives the summary
// totals and the default table filter. refunded/error are intentionally out.
export const SALE_STATUSES: OrderStatus[] = [
  'paid',
  'processing',
  'in_production',
  'shipped',
  'delivered',
];

const STATUS_STYLE: Record<OrderStatus, { dot: string; label: string }> = {
  paid: { dot: 'bg-brand-charcoal/40', label: 'Paid' },
  processing: { dot: 'bg-brand-honey', label: 'Processing' },
  in_production: { dot: 'bg-brand-honey', label: 'In production' },
  shipped: { dot: 'bg-emerald-500', label: 'Shipped' },
  delivered: { dot: 'bg-emerald-600', label: 'Delivered' },
  refunded: { dot: 'bg-red-400', label: 'Refunded' },
  error: { dot: 'bg-red-500', label: 'Error' },
};

export const usd = (v: number | null) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export function StatusPill({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-brand-charcoal/70">
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
