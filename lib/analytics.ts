// lib/analytics.ts

const STORAGE_PREFIX = 'sp_inviter_';

type TrackParams = Record<string, string | number | undefined>;

/**
 * Fire-and-forget event tracking. NEVER throws, NEVER blocks.
 * Safe to call from anywhere, including SSR.
 */
export function trackEvent(name: string, params: TrackParams = {}): void {
  try {
    if (typeof window === 'undefined') return;
    // Reason: Prevent dev/preview traffic from polluting production GA4.
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return;
    const gtag = (window as any).gtag;
    if (typeof gtag !== 'function') return;

    // Clean undefined values
    const cleanParams: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        cleanParams[k] = v;
      }
    }

    gtag('event', name, cleanParams);
  } catch {
    // Silent fail. Tracking must never break the app.
  }
}

/**
 * Capture inviter_id and UTM params from URL, scoped by bookId.
 * Safe to call from useEffect on mount. NEVER throws.
 */
export function captureAttribution(bookId: string): void {
  try {
    if (typeof window === 'undefined') return;
    if (!bookId) return;

    const params = new URLSearchParams(window.location.search);
    const inviterId = params.get('inviter_id');
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');

    // Only store if we actually got something — don't overwrite with nulls
    if (inviterId || utmSource || utmMedium || utmCampaign) {
      const data = {
        inviter_id: inviterId || undefined,
        utm_source: utmSource || undefined,
        utm_medium: utmMedium || undefined,
        utm_campaign: utmCampaign || undefined,
        captured_at: Date.now(),
      };
      try {
        localStorage.setItem(STORAGE_PREFIX + bookId, JSON.stringify(data));
      } catch {
        // localStorage can throw in Safari private mode, quota errors, etc.
        // Silent fail — tracking is optional.
      }
    }
  } catch {
    // Silent fail.
  }
}

/**
 * Read stored attribution for a given bookId.
 * Returns empty object on any failure. NEVER throws.
 */
export function getAttribution(bookId: string): TrackParams {
  try {
    if (typeof window === 'undefined') return {};
    if (!bookId) return {};
    const raw = localStorage.getItem(STORAGE_PREFIX + bookId);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      inviter_id: parsed.inviter_id,
      utm_source: parsed.utm_source,
      utm_medium: parsed.utm_medium,
      utm_campaign: parsed.utm_campaign,
    };
  } catch {
    return {};
  }
}
