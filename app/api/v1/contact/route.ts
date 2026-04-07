import { NextRequest, NextResponse } from 'next/server';
import { ServerClient } from 'postmark';

// Reason: Soft rate limit per IP to discourage abuse without adding captcha friction.
// In-memory map is fine for low volume; if traffic grows, swap for Vercel KV / Upstash.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3;
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

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many messages. Try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const couple = String(body.couple || '').trim();
    const message = String(body.message || '').trim();
    const context = String(body.context || '').trim();

    if (!name || name.length > 200) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || !isValidEmail(email) || email.length > 320) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!message || message.length > 5000) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const token = process.env.POSTMARK_SERVER_TOKEN;
    if (!token) {
      console.error('POSTMARK_SERVER_TOKEN missing');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const client = new ServerClient(token);

    const subject = `New contact: ${name}${couple ? ` — ${couple}` : ''}`;

    const html = `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
${couple ? `<p><strong>Who's getting married:</strong> ${escapeHtml(couple)}</p>` : ''}
${context ? `<p><strong>Context:</strong> ${escapeHtml(context)}</p>` : ''}
<p><strong>Message:</strong></p>
<p style="white-space: pre-wrap;">${escapeHtml(message)}</p>`;

    const text = `Name: ${name}
Email: ${email}
${couple ? `Who's getting married: ${couple}\n` : ''}${context ? `Context: ${context}\n` : ''}
Message:
${message}`;

    await client.sendEmail({
      From: `Small Plates Contact <team@smallplatesandcompany.com>`,
      To: 'team@smallplatesandcompany.com',
      ReplyTo: `${name} <${email}>`,
      Subject: subject,
      HtmlBody: html,
      TextBody: text,
      MessageStream: 'outbound',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/v1/contact:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
