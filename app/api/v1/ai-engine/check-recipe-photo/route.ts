import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_AGENT_URL = process.env.RAILWAY_AGENT_URL || 'https://smallplatesweb-production-f5e1.up.railway.app';

// Reason: the browser aborts at 5s. This sits above it so the client is the one
// that decides, but a hung agent still can't hold the function open.
const UPSTREAM_TIMEOUT_MS = 10000;
const MAX_IMAGES = 10;

/**
 * Proxies the "does this photo contain a written recipe?" check to the AI engine.
 * Read-only: it stores nothing. The caller treats any non-2xx as "proceed".
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const imageUrls: unknown = body?.image_urls;

    if (!Array.isArray(imageUrls) || imageUrls.length === 0 || !imageUrls.every((url) => typeof url === 'string')) {
      return NextResponse.json({ error: 'image_urls must be a non-empty array of strings' }, { status: 400 });
    }

    if (imageUrls.length > MAX_IMAGES) {
      return NextResponse.json({ error: `image_urls accepts at most ${MAX_IMAGES} urls` }, { status: 400 });
    }

    const response = await fetch(`${RAILWAY_AGENT_URL}/check-recipe-photo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RAILWAY_AGENT_SECRET}`,
      },
      body: JSON.stringify({ image_urls: imageUrls }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('check-recipe-photo agent error:', response.status, errorText.slice(0, 300));
      return NextResponse.json({ error: `Agent returned ${response.status}` }, { status: response.status });
    }

    const data = await response.json();

    // Reason: log EVERY verdict, not just the negative one. A guest sailing through
    // is ambiguous from the outside: the model may have said yes, or the call may
    // have failed and fallen open. Without a line for both, the two are
    // indistinguishable and the check cannot be debugged at all.
    // The `reason` is model-generated English for us, never shown to the guest.
    console.log('check-recipe-photo verdict', {
      has_recipe: data?.has_recipe,
      likelihood: data?.recipe_likelihood,
      reason: data?.reason,
      images: imageUrls.length,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('check-recipe-photo proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
