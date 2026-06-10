// lib/analytics.ts

const STORAGE_PREFIX = 'sp_inviter_';
const UTM_STORAGE_KEY = 'sp_landing_utm';

type TrackParams = Record<string, string | number | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

// Reason: single registry of GA4 event names — prevents typos and silent
// event-name drift (e.g. whatsapp_click vs whatsapp_clicked).
export const EVENTS = {
  START_BOOK_CLICK: 'start_book_click',
  ONBOARDING_STEP_VIEW: 'onboarding_step_view',
  SIGN_UP: 'sign_up',
  BOOK_CREATED: 'book_created',
  SHARE: 'share',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  WHATSAPP_CLICKED: 'whatsapp_clicked',
} as const;

// Reason: CompleteRegistration is a Meta standard event (optimizable in Ads
// Manager); the others are custom signals.
export const META_EVENTS = {
  COMPLETE_REGISTRATION: 'CompleteRegistration',
  START_BOOK_CLICK: 'StartBookClick',
  ONBOARDING_COMPLETED: 'OnboardingCompleted',
} as const;

// Reason: Prevent dev/preview traffic from polluting production GA4/Meta.
function isTrackableHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1' && !host.endsWith('.local');
}

function cleanParams(params: TrackParams): Record<string, string | number> {
  const clean: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      clean[k] = v;
    }
  }
  return clean;
}

/**
 * Fire-and-forget event tracking. NEVER throws, NEVER blocks.
 * Safe to call from anywhere, including SSR.
 */
export function trackEvent(name: string, params: TrackParams = {}): void {
  try {
    if (!isTrackableHost()) return;
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, cleanParams(params));
  } catch {
    // Silent fail. Tracking must never break the app.
  }
}

/**
 * Fire-and-forget Meta Pixel event. Same contract as trackEvent.
 * Standard events use fbq('track'); pass { custom: true } for custom events.
 */
export function trackMetaEvent(
  name: string,
  params: TrackParams = {},
  opts: { custom?: boolean } = {}
): void {
  try {
    if (!isTrackableHost()) return;
    if (typeof window.fbq !== 'function') return;
    window.fbq(opts.custom ? 'trackCustom' : 'track', name, cleanParams(params));
  } catch {
    // Silent fail.
  }
}

/**
 * Landing CTA click: sends GA4 start_book_click + Meta StartBookClick together.
 */
export function trackStartBookClick(ctaLocation: string): void {
  trackEvent(EVENTS.START_BOOK_CLICK, { cta_location: ctaLocation });
  trackMetaEvent(META_EVENTS.START_BOOK_CLICK, { cta_location: ctaLocation }, { custom: true });
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

/**
 * Capture UTM params from the landing URL into sessionStorage so they survive
 * client-side navigation into the onboarding (GA4 attributes by session, but we
 * also want them as explicit params on sign_up). First-touch per session.
 * Safe to call from useEffect on mount. NEVER throws.
 */
export function captureLandingUtms(): void {
  try {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) found[key] = value;
    }
    if (Object.keys(found).length === 0) return;
    // Reason: first-touch wins — the ad that brought the user this session.
    if (sessionStorage.getItem(UTM_STORAGE_KEY)) return;
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(found));
  } catch {
    // Silent fail.
  }
}

/**
 * Read UTMs captured by captureLandingUtms. Empty object on any failure.
 */
export function getLandingUtms(): TrackParams {
  try {
    if (typeof window === 'undefined') return {};
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: TrackParams = {};
    for (const key of UTM_KEYS) {
      const value = parsed[key];
      if (typeof value === 'string') out[key] = value;
    }
    return out;
  } catch {
    return {};
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
