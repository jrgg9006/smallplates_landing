import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { NewsletterSource } from '@/lib/types/database';

// Reason: Soft rate limit per IP to discourage abuse. In-memory is fine for low volume;
// swap for KV/Upstash if traffic grows. Mirrors the contact route pattern.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const hit = ipHits.get(ip);
  if (!hit || hit.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (hit.count >= RATE_LIMIT_MAX) return false;
  hit.count += 1;
  return true;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const ALLOWED_SOURCES: NewsletterSource[] = ['landing_page', 'collection_flow'];

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const rawEmail = String(body.email || '').trim().toLowerCase();
    const source = String(body.source || '') as NewsletterSource;

    if (!rawEmail || !isValidEmail(rawEmail) || rawEmail.length > 320) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_SOURCES.includes(source)) {
      return NextResponse.json(
        { error: 'Invalid source' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Reason: Upsert on email so re-subscribing is a silent no-op. We don't reveal
    // whether the email already existed — always return success on valid input.
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        { email: rawEmail, source, status: 'active' },
        { onConflict: 'email', ignoreDuplicates: false }
      );

    if (error) {
      console.error('Newsletter subscribe error:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/v1/newsletter/subscribe:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
