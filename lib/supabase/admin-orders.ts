import { createSupabaseAdminClient } from './admin';
import type { OrderStatus, OrderType } from '@/lib/types/database';

/**
 * Get all orders for the admin Orders panel (read-only).
 * Uses the service-role client to bypass RLS — admin sees ALL orders.
 *
 * Single join to `groups` (via group_id) to pull the cover line, which lives on
 * the group and NOT on orders. Everything else (shipping snapshot, amount, print
 * name) is already on the order row.
 */

// Reason: same default the checkout wizard renders when the organizer leaves the
// cover line untouched (lib/cover/layout.ts). Mirrored here so the admin ficha
// shows what will actually print, not a blank.
const DEFAULT_COVER_LINE = 'RECIPES FROM THE PEOPLE WHO LOVE';

export interface AdminShippingAddress {
  recipient_name: string;
  street_address: string;
  apartment_unit: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone_number: string | null;
}

export interface AdminOrderRow {
  id: string;
  created_at: string;
  email: string;
  amountUsd: number | null;
  discountUsd: number | null;
  bookQuantity: number;
  status: OrderStatus;
  orderType: OrderType;
  groupId: string | null;
  userId: string | null;
  stripePaymentIntent: string | null;
  /** Resolved print name (group.print_couple_name → order.couple_name → group.name). */
  printName: string;
  /** Resolved cover line (group.print_cover_line → default). */
  coverLine: string;
  /** Parsed shipping snapshot from orders.shipping_address JSONB; null if absent. */
  shipping: AdminShippingAddress | null;
}

type EmbeddedGroup = {
  print_cover_line: string | null;
  print_couple_name: string | null;
  name: string | null;
  created_by: string | null;
};

interface RawOrderRow {
  id: string;
  created_at: string;
  email: string;
  user_id: string | null;
  amount_total: number | null;
  book_quantity: number;
  shipping_address: Record<string, unknown> | null;
  couple_name: string | null;
  status: OrderStatus;
  order_type: OrderType;
  group_id: string | null;
  discount_amount: number | null;
  stripe_payment_intent: string | null;
  // Supabase returns the embedded resource as an object for to-one relations,
  // but can surface an array depending on FK inference — handle both.
  groups: EmbeddedGroup | EmbeddedGroup[] | null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function nullableStr(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function parseShipping(raw: Record<string, unknown> | null): AdminShippingAddress | null {
  if (!raw || typeof raw !== 'object') return null;
  // Require at least one substantive field so empty snapshots render as "no address".
  if (!str(raw.recipient_name) && !str(raw.street_address) && !str(raw.city)) {
    return null;
  }
  return {
    recipient_name: str(raw.recipient_name),
    street_address: str(raw.street_address),
    apartment_unit: nullableStr(raw.apartment_unit),
    city: str(raw.city),
    state: str(raw.state),
    postal_code: str(raw.postal_code),
    country: str(raw.country),
    phone_number: nullableStr(raw.phone_number),
  };
}

export async function getAllOrdersAdmin(): Promise<{
  data: AdminOrderRow[];
  error: string | null;
}> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, created_at, email, user_id, amount_total, book_quantity, shipping_address, couple_name, status, order_type, group_id, discount_amount, stripe_payment_intent, groups(print_cover_line, print_couple_name, name, created_by)'
    )
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  const rows = (data as unknown as RawOrderRow[] | null) || [];

  const mapped: AdminOrderRow[] = rows.map((o) => {
    const group = Array.isArray(o.groups) ? o.groups[0] ?? null : o.groups;

    const printName =
      nullableStr(group?.print_couple_name) ||
      nullableStr(o.couple_name) ||
      nullableStr(group?.name) ||
      '—';
    const coverLine = nullableStr(group?.print_cover_line) || DEFAULT_COVER_LINE;

    return {
      id: o.id,
      created_at: o.created_at,
      email: o.email,
      amountUsd: typeof o.amount_total === 'number' ? o.amount_total / 100 : null,
      discountUsd:
        typeof o.discount_amount === 'number' && o.discount_amount > 0
          ? o.discount_amount / 100
          : null,
      bookQuantity: o.book_quantity,
      status: o.status,
      orderType: o.order_type,
      groupId: o.group_id,
      // Reason: the group OWNER's profile (groups.created_by) — always set —
      // rather than orders.user_id, which can be NULL on some orders.
      userId: group?.created_by || o.user_id || null,
      stripePaymentIntent: o.stripe_payment_intent,
      printName,
      coverLine,
      shipping: parseShipping(o.shipping_address),
    };
  });

  return { data: mapped, error: null };
}
