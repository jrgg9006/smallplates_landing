'use client';

import Link from 'next/link';
import type { GroupHealthRow } from '@/lib/radar/types';
import { InfoTip } from './InfoTip';

// Reason: 25 recetas es el umbral mínimo para mandar a imprimir, así que 100% = 25.
const PRINT_THRESHOLD = 25;

export function BookProgress({ rows }: { rows: GroupHealthRow[] }) {
  // Reason: solo libros que aún juntan recetas — los cerrados ya están en producción.
  const active = rows
    .filter((r) => !r.closed)
    .sort((a, b) => b.recipes - a.recipes);

  return (
    <div className="rounded-xl bg-white p-5 shadow-lg">
      <div className="mb-1 flex items-center text-sm font-semibold uppercase tracking-wide text-gray-700">
        Avance de libros activos
        <InfoTip text="Un renglón por libro activo, ordenado por número de recetas. La barra llena (100%) son 25 recetas, el mínimo para mandar a imprimir. Verde = ya pasó el umbral. Los libros cerrados (en producción) no aparecen." />
      </div>
      <p className="mb-4 text-xs text-gray-400">100% = 25 recetas (listo para imprimir)</p>
      {active.length === 0 ? (
        <p className="text-sm text-gray-400">No hay libros activos.</p>
      ) : (
        <div className="space-y-2.5">
          {active.map((row) => {
            const ready = row.recipes >= PRINT_THRESHOLD;
            const pct = Math.min(Math.round((row.recipes / PRINT_THRESHOLD) * 100), 100);
            return (
              <div key={row.groupId}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="min-w-0 truncate font-medium text-gray-700">
                    {row.ownerUserId ? (
                      <Link
                        href={`/admin/activity/${row.ownerUserId}`}
                        className="hover:underline"
                      >
                        {row.name}
                      </Link>
                    ) : (
                      row.name
                    )}
                    {row.ownerName && (
                      <span className="ml-1.5 text-gray-400">· {row.ownerName}</span>
                    )}
                  </span>
                  <span className="shrink-0 pl-2 text-gray-500">
                    {row.recipes} recetas ·{' '}
                    {ready ? (
                      <span className="font-medium text-emerald-600">listo</span>
                    ) : (
                      `${pct}%`
                    )}
                  </span>
                </div>
                <div className="h-5 w-full rounded bg-gray-100">
                  <div
                    className={`h-5 rounded transition-all duration-500 ${
                      ready ? 'bg-emerald-500' : 'bg-[#D4A854]'
                    }`}
                    style={{ width: `${Math.max(pct, row.recipes > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
