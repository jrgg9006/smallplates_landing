/**
 * API Route - Get All Orders (Admin Only)
 * Returns every order with resolved print + shipping info for the admin Orders panel.
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { getAllOrdersAdmin } from '@/lib/supabase/admin-orders';

// Reason: admin data must always be fresh — never serve a cached order list.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminAuth();

    const { data, error } = await getAllOrdersAdmin();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error in get orders route:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unauthorized',
      },
      {
        status:
          error instanceof Error && error.message.includes('Admin') ? 401 : 500,
      }
    );
  }
}
