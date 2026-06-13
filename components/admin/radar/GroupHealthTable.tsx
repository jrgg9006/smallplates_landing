'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GroupHealthRow } from '@/lib/radar/types';
import { InfoTip } from './InfoTip';
import { timeAgo } from './timeAgo';

const DOT: Record<GroupHealthRow['health'], string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-red-500',
};

export function GroupHealthTable({ rows }: { rows: GroupHealthRow[] }) {
  const [hideClosed, setHideClosed] = useState(true);
  const closedCount = rows.filter((r) => r.closed).length;
  const visible = hideClosed ? rows.filter((r) => !r.closed) : rows;

  return (
    <div className="rounded-xl bg-white p-5 shadow-lg">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center text-sm font-semibold uppercase tracking-wide text-gray-700">
          Salud por libro
          <InfoTip text="Un renglón por libro, ordenado por riesgo. Última actividad = lo más reciente entre recetas, invitados, correos, ediciones y shares. Verde: <3 días. Amarillo: 3–7. Rojo: >7 días sin actividad. Cerrados = ya en producción (reviewed/ready_to_print/printed)." />
        </div>
        {closedCount > 0 && (
          <button
            type="button"
            onClick={() => setHideClosed((v) => !v)}
            className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-800"
          >
            {hideClosed ? `Mostrar cerrados (${closedCount})` : 'Ocultar cerrados'}
          </button>
        )}
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-gray-400">No hay libros activos.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-3 font-medium">Libro</th>
                <th className="py-2 pr-3 font-medium">Etapa</th>
                <th className="py-2 pr-3 font-medium">Recetas</th>
                <th className="py-2 pr-3 font-medium">Invitados</th>
                <th className="py-2 pr-3 font-medium">Último correo</th>
                <th className="py-2 font-medium">Actividad</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.groupId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 pr-3">
                    {row.ownerUserId ? (
                      <Link href={`/admin/activity/${row.ownerUserId}`} className="font-medium text-gray-900 hover:underline">
                        {row.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900">{row.name}</span>
                    )}
                    {row.closed && (
                      <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                        cerrado
                      </span>
                    )}
                    <div className="text-xs text-gray-400">{row.ownerName ?? '—'}</div>
                  </td>
                  <td className="py-2.5 pr-3 text-gray-600">{row.stage}</td>
                  <td className="py-2.5 pr-3 text-gray-600">
                    {row.recipes}
                    <span className="text-xs text-gray-400"> ({row.recipesWithPhoto} c/foto)</span>
                  </td>
                  <td className="py-2.5 pr-3 text-gray-600">{row.guests}</td>
                  <td className="py-2.5 pr-3 text-xs text-gray-500">
                    {row.lastEmailAt ? timeAgo(row.lastEmailAt) : 'nunca'}
                  </td>
                  <td className="py-2.5">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className={`h-2.5 w-2.5 rounded-full ${DOT[row.health]}`} />
                      {row.daysInactive === 0 ? 'hoy' : `${row.daysInactive} d sin actividad`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
