import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

/**
 * GET /api/og-image?url=<supabase-storage-url>
 *
 * Fallback proxy for legacy groups whose couple_image_og_url is null.
 * New uploads pre-generate the OG version at upload time and serve it directly
 * (see lib/supabase/storage.ts: generateCoupleImageOgBuffer). This route stays
 * as a graceful-degradation path so previews never go missing entirely.
 *
 * - Resizes to 1200x630 (standard OG dimensions)
 * - Compresses as JPEG targeting <300KB (WhatsApp reliability threshold)
 * - Serves from our domain (avoids Supabase's x-robots-tag: none)
 */
export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Reason: only allow Supabase storage URLs to prevent open proxy abuse
  const allowedHost = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
    : null;

  try {
    const parsedUrl = new URL(imageUrl);
    if (allowedHost && parsedUrl.hostname !== allowedHost) {
      return new NextResponse('URL not allowed', { status: 403 });
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: 502 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Reason: flatten with white background so transparent PNGs don't get black areas in JPEG
    const optimized = await sharp(buffer)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .resize(1200, 630, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 70, progressive: true, mozjpeg: true })
      .toBuffer();

    return new NextResponse(new Uint8Array(optimized), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Content-Length': optimized.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error processing OG image:', error);
    return new NextResponse('Failed to process image', { status: 500 });
  }
}
