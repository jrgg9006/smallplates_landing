/**
 * Wrapper around fetch() for calls to the Railway microservice.
 * Adds bearer auth, structured errors, and a 10s timeout for the accept handshake.
 *
 * Reason: existing AI engine routes call Railway without auth. As we add /qa-book
 * we introduce a shared bearer secret. Eventually the other endpoints should
 * adopt this helper, but we don't change them as part of this feature.
 */
import type { RailwayQABookRequest } from './types';

const RAILWAY_AGENT_URL =
  process.env.RAILWAY_AGENT_URL || 'https://smallplatesweb-production-f5e1.up.railway.app';

const ACCEPT_TIMEOUT_MS = 10_000;

export class RailwayError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'RailwayError';
  }
}

function getBearerHeader(): string {
  const secret = process.env.RAILWAY_AGENT_SECRET;
  if (!secret) {
    throw new RailwayError('RAILWAY_AGENT_SECRET is not set in env');
  }
  return `Bearer ${secret}`;
}

/**
 * Triggers a QA review job. Railway responds 202 immediately; the actual
 * processing happens in the background and posts back to /complete.
 */
export async function startQABookJob(body: RailwayQABookRequest): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ACCEPT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${RAILWAY_AGENT_URL}/qa-book`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: getBearerHeader(),
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new RailwayError('Railway did not respond within 10s', 504);
    }
    throw new RailwayError(`Network error reaching Railway: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (response.status !== 202) {
    const text = await response.text().catch(() => '');
    throw new RailwayError(
      `Railway returned ${response.status} (expected 202): ${text.slice(0, 200)}`,
      response.status,
    );
  }
}

/**
 * Verifies a bearer header on incoming requests from Railway (callback path).
 * Returns true if valid, false otherwise.
 */
export function verifyRailwayBearer(authHeader: string | null): boolean {
  if (!authHeader) return false;
  const secret = process.env.RAILWAY_AGENT_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
