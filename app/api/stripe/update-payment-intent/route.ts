import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';

export async function PATCH(request: NextRequest) {
  try {
    const { paymentIntentId, clientSecret, metadata } = await request.json();

    if (!paymentIntentId || !clientSecret || !metadata) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Reason: Verify caller owns this PI by checking the client secret
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.client_secret !== clientSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reason: Allowlist metadata keys to prevent overwriting sensitive fields
    const allowedKeys = ['email', 'buyerName'];
    const safeMetadata: Record<string, string> = {};
    for (const key of allowedKeys) {
      if (key in metadata && typeof metadata[key] === 'string') {
        safeMetadata[key] = metadata[key];
      }
    }

    await stripe.paymentIntents.update(paymentIntentId, { metadata: safeMetadata });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating payment intent:', err);
    return NextResponse.json(
      { error: 'Failed to update payment intent' },
      { status: 500 }
    );
  }
}
