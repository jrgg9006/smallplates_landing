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
