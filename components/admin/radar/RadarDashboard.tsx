'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RadarPayload, RangeKey } from '@/lib/radar/types';
import { PulseCards } from './PulseCards';
import { LiveFeed } from './LiveFeed';
import { ActivationFunnel } from './ActivationFunnel';
import { GroupHealthTable } from './GroupHealthTable';

const POLL_MS = 60_000;

const RANGE_LABEL: Record<RangeKey, string> = {
  today: 'Hoy',
  d7: '7 días',
  d30: '30 días',
};

export default function RadarDashboard() {
  const [data, setData] = useState<RadarPayload | null>(null);
  const [range, setRange] = useState<RangeKey>('today');
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/radar', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(res.status === 401 ? 'No autorizado' : `Error ${res.status}`);
      }
      const payload = (await res.json()) as RadarPayload;
      setData(payload);
      setError(null);
      setLastFetch(Date.now());
    } catch (e) {
      // Reason: keep the last good data on screen — a blip must not blank the radar.
      setError(e instanceof Error ? e.message : 'Error de conexión');
    }
  }, []);

  useEffect(() => {
    const start = () => {
      // Reason: defensive — guarantees a single live interval even if a future
      // caller (e.g. manual refresh) invokes start() while one is running.
      if (timerRef.current) clearInterval(timerRef.current);
      void load();
      timerRef.current = setInterval(() => void load(), POLL_MS);
    };
    const stop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // Reason: pause polling in hidden tabs — zero wasted requests.
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [load]);

  return (
    <div className="min-h-screen bg-brand-warm-white p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📡 Radar</h1>
            <p className="text-sm text-gray-500">
              Qué están haciendo los usuarios, ahora mismo
              {lastFetch && (
                <span className="ml-2 text-xs text-gray-400">
                  · actualizado {new Date(lastFetch).toLocaleTimeString('es-MX')}
                </span>
              )}
            </p>
          </div>
          <div className="flex rounded-lg bg-white p-1 shadow">
            {(Object.keys(RANGE_LABEL) as RangeKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  range === key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {RANGE_LABEL[key]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {error === 'No autorizado'
              ? 'No autorizado — inicia sesión con una cuenta admin.'
              : `Sin conexión (${error}) — mostrando los últimos datos, reintentando…`}
          </div>
        )}
        {data && data.degraded.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Fuentes con error (sección incompleta): {data.degraded.join(', ')}
          </div>
        )}

        {!data && !error && <p className="text-sm text-gray-400">Cargando radar…</p>}

        {data && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <PulseCards metrics={data.pulse} range={range} />
              <ActivationFunnel steps={data.funnel} />
              <GroupHealthTable rows={data.groups} />
            </div>
            <div>
              <LiveFeed items={data.feed} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
