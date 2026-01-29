/**
 * API Route - Validate Purchase Activation Token
 * Checks if a token is valid and not expired/used
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get activation record
    const { data: activation, error } = await supabaseAdmin
      .from('purchase_activations')
      .select(`
        *,
        purchase_intents (
          email,
          couple_first_name,
          partner_first_name,
          user_type
        )
      `)
      .eq('token', token)
      .single();

    if (error || !activation) {
      return NextResponse.json(
        { error: 'Invalid activation token' },
        { status: 404 }
      );
    }

    // Check if already used
    if (activation.used) {
      return NextResponse.json(
        { error: 'This activation link has already been used' },
        { status: 410 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(activation.expires_at);
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'This activation link has expired' },
        { status: 410 }
      );
    }

    // Build couple names for display
    const purchaseIntent = activation.purchase_intents as any;
    let coupleNames: string | undefined;
    
    if (purchaseIntent?.couple_first_name && purchaseIntent?.partner_first_name) {
      coupleNames = `${purchaseIntent.couple_first_name} & ${purchaseIntent.partner_first_name}`;
    }

    return NextResponse.json({
      valid: true,
      email: activation.email,
      coupleNames
    });

  } catch (err) {
    console.error('Error validating activation token:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
