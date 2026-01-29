/**
 * API Route - Create Purchase Activation Token (Admin Only)
 * Generates a unique activation token for a paid purchase intent
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAuth } from '@/lib/auth/admin';
import crypto from 'crypto';

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

export async function POST(request: Request) {
  try {
    // Check admin authentication
    const adminUser = await requireAdminAuth();
    
    const { purchaseIntentId, email: customEmail } = await request.json();

    if (!purchaseIntentId) {
      return NextResponse.json(
        { error: 'purchaseIntentId is required' },
        { status: 400 }
      );
    }

    // Get purchase intent
    const { data: purchaseIntent, error: intentError } = await supabaseAdmin
      .from('purchase_intents')
      .select('*')
      .eq('id', purchaseIntentId)
      .single();

    if (intentError || !purchaseIntent) {
      return NextResponse.json(
        { error: 'Purchase intent not found' },
        { status: 404 }
      );
    }

    // Use custom email if provided, otherwise use purchase intent email
    const activationEmail = customEmail?.trim() || purchaseIntent.email;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(activationEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if activation already exists and is unused for this email
    // Only reuse if email matches (to prevent token reuse with different emails)
    const { data: existingActivation } = await supabaseAdmin
      .from('purchase_activations')
      .select('*')
      .eq('purchase_intent_id', purchaseIntentId)
      .eq('email', activationEmail)
      .eq('used', false)
      .single();

    if (existingActivation) {
      // Check if expired
      const now = new Date();
      const expiresAt = new Date(existingActivation.expires_at);
      if (now < expiresAt) {
        // Return existing valid token
        const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/activate/${existingActivation.token}`;
        return NextResponse.json({
          success: true,
          token: existingActivation.token,
          activationUrl,
          expiresAt: existingActivation.expires_at,
          email: activationEmail,
          message: 'Existing valid activation token found'
        });
      }
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create activation record (expires in 30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: activation, error: activationError } = await supabaseAdmin
      .from('purchase_activations')
      .insert({
        purchase_intent_id: purchaseIntentId,
        token,
        email: activationEmail,
        expires_at: expiresAt.toISOString(),
        created_by: adminUser.id
      })
      .select()
      .single();

    if (activationError) {
      console.error('Error creating activation:', activationError);
      return NextResponse.json(
        { error: 'Failed to create activation token' },
        { status: 500 }
      );
    }

    const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/activate/${token}`;

    return NextResponse.json({
      success: true,
      token,
      activationUrl,
      expiresAt: activation.expires_at,
      email: activationEmail,
      originalEmail: purchaseIntent.email,
      message: 'Activation token created successfully'
    });

  } catch (err) {
    console.error('Error creating activation token:', err);
    
    // Handle auth errors
    if (err instanceof Error && err.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
