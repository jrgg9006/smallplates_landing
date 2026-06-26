'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { OrderStatus } from '@/lib/types/database';
import type { AdminOrderRow } from '@/lib/supabase/admin-orders';
import { OrderDetailSheet } from './components/OrderDetailSheet';
import { SALE_STATUSES, StatusPill, fmtDate, usd } from './components/shared';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand-sand/50 bg-white p-6">
      <div className="mb-3 h-px w-8 bg-brand-honey" />
      <div className="text-xs uppercase tracking-widest text-brand-charcoal/40">{label}</div>
      <div className="mt-1 text-4xl font-semibold tabular-nums text-brand-charcoal">{value}</div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'sales' | 'all' | OrderStatus>('sales');
  const [range, setRange] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AdminOrderRow | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/v1/admin/orders', { cache: 'no-store' });
        if (res.status === 401) {
          router.replace('/admin');
          return;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load orders');
        if (active) setOrders(json.data as AdminOrderRow[]);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  // Reason: lower bound for the selected range. null = all time. Calendar-based
  // for month/year; rolling 7 days for "week".
  const since = useMemo(() => {
    if (range === 'all') return null;
    const now = new Date();
    if (range === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
    return new Date(now.getFullYear(), 0, 1); // year
  }, [range]);

  const inRange = useMemo(
    () => (iso: string) => !since || new Date(iso) >= since,
    [since]
  );

  const sales = useMemo(
    () => orders.filter((o) => SALE_STATUSES.includes(o.status) && inRange(o.created_at)),
    [orders, inRange]
  );

  const totals = useMemo(
    () => ({
      count: sales.length,
      books: sales.reduce((n, o) => n + (o.bookQuantity || 0), 0),
      revenue: sales.reduce((n, o) => n + (o.amountUsd || 0), 0),
    }),
    [sales]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (!inRange(o.created_at)) return false;
      if (filter === 'sales' && !SALE_STATUSES.includes(o.status)) return false;
      if (filter !== 'sales' && filter !== 'all' && o.status !== filter) return false;
      if (!q) return true;
      return o.email.toLowerCase().includes(q) || o.printName.toLowerCase().includes(q);
    });
  }, [orders, filter, query, inRange]);

  return (
    <div className="min-h-screen bg-brand-warm-white text-brand-charcoal">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/admin"
          className="text-sm text-brand-charcoal/50 transition-colors hover:text-brand-charcoal"
        >
          ← Admin
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-brand-charcoal/50">
          Sales, shipping, and the print sheet for every book.
        </p>

        {/* Summary */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Orders" value={loading ? '—' : String(totals.count)} />
          <Stat label="Books sold" value={loading ? '—' : String(totals.books)} />
          <Stat label="Total revenue" value={loading ? '—' : usd(totals.revenue)} />
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or name…"
            className="flex-1 rounded-xl border border-brand-sand bg-white px-4 py-2.5 text-sm outline-none placeholder:text-brand-charcoal/30 focus:border-brand-honey"
          />
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as typeof range)}
            className="rounded-xl border border-brand-sand bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-honey"
          >
            <option value="all">All time</option>
            <option value="week">Last week</option>
            <option value="month">This month</option>
            <option value="year">This year</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-xl border border-brand-sand bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-honey"
          >
            <option value="sales">Sales</option>
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="in_production">In production</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="refunded">Refunded</option>
            <option value="error">Error</option>
          </select>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-brand-sand/50 bg-white">
          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-brand-charcoal/40">
              Loading orders…
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center text-sm text-red-500">{error}</div>
          ) : visible.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-brand-charcoal/40">
              No orders yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-sand/60 text-left text-xs uppercase tracking-wider text-brand-charcoal/40">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Print name</th>
                  <th className="px-5 py-3 text-right font-medium">Qty</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Destination</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className="cursor-pointer border-b border-brand-sand/40 transition-colors last:border-0 hover:bg-brand-sand/20"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-brand-charcoal/70">
                      {fmtDate(o.created_at)}
                    </td>
                    <td className="px-5 py-4">{o.email}</td>
                    <td className="px-5 py-4">{o.printName}</td>
                    <td className="px-5 py-4 text-right tabular-nums">{o.bookQuantity}</td>
                    <td className="px-5 py-4 text-right tabular-nums">{usd(o.amountUsd)}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="hidden px-5 py-4 text-brand-charcoal/60 md:table-cell">
                      {o.shipping
                        ? [o.shipping.city, o.shipping.country].filter(Boolean).join(', ') || '—'
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <OrderDetailSheet order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
