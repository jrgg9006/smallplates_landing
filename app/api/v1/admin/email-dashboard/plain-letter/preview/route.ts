import { NextResponse } from 'next/server';
import { buildPlainLetterHTML } from '@/lib/email/plain-letter-template';

// Reason: read-only preview with placeholder copy, so the plain-letter format can
// be eyeballed before any real email is wired to it. Same no-auth pattern as the
// other preview routes.
export async function GET() {
  const html = buildPlainLetterHTML({
    bodyParagraphs: [
      'Hey Sarah,',
      "Quick one. I noticed your book has a handful of recipes in already, and I wanted to make sure you knew the link is easy to pass around. Most people just drop it in the family group chat and let it do the work.",
      "If it helps, here's a button straight to your book. You can share the collection link from there in about ten seconds.",
      "And if anything is confusing, just reply to this. It comes to me.",
    ],
    button: { label: 'Open your book', url: 'https://smallplatesandcompany.com' },
    footerReason: "You're getting this because you're organizing a book.",
  });

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Email-Subject': encodeURIComponent('A quick note about your book'),
    },
  });
}
