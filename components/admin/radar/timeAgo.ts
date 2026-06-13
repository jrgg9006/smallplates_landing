// Reason: Chicago day boundaries + clock so "Hoy"/"Ayer" and times match the
// founder's local time, not UTC.
const TZ = 'America/Chicago';
const DAY_MS = 86_400_000;

function localDayKey(ms: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms));
}

export function timeAgo(iso: string, nowMs: number = Date.now()): string {
  const s = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'hace unos segundos';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'hace 1 día' : `hace ${d} días`;
}

/** Divider label for a feed item: "Hoy", "Ayer", or "mar 10 jun". */
export function feedDayLabel(iso: string, nowMs: number = Date.now()): string {
  const itemKey = localDayKey(new Date(iso).getTime());
  if (itemKey === localDayKey(nowMs)) return 'Hoy';
  if (itemKey === localDayKey(nowMs - DAY_MS)) return 'Ayer';
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

/**
 * Per-row time: "hace 2 min" while it still feels live (same day, <1h),
 * otherwise an absolute clock time like "10:23 p.m." — easier to read than "hace 12 h".
 */
export function feedTime(iso: string, nowMs: number = Date.now()): string {
  const itemMs = new Date(iso).getTime();
  const sameDay = localDayKey(itemMs) === localDayKey(nowMs);
  const s = Math.max(0, Math.floor((nowMs - itemMs) / 1000));
  if (sameDay && s < 3600) {
    return s < 60 ? 'hace unos segundos' : `hace ${Math.floor(s / 60)} min`;
  }
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(itemMs));
}
