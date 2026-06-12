'use client';

import type { FunnelStep } from '@/lib/radar/types';
import { InfoTip } from './InfoTip';

export function ActivationFunnel({ steps }: { steps: FunnelStep[] }) {
  const base = steps[0]?.count ?? 0;
  return (
    <div className="rounded-xl bg-white p-5 shadow-lg">
      <div className="mb-1 flex items-center text-sm font-semibold uppercase tracking-wide text-gray-700">
        Funnel de activación
        <InfoTip text="Cohorte: usuarios registrados en los últimos 30 días. Cada barra muestra cuántos de ellos llegaron a ese paso y el % respecto al registro." />
      </div>
      <p className="mb-4 text-xs text-gray-400">Registros de los últimos 30 días</p>
      <div className="space-y-2.5">
        {steps.map((step, i) => {
          const pct = base > 0 ? Math.round((step.count / base) * 100) : 0;
          const prev = steps[i - 1]?.count ?? step.count;
          const stepPct = i > 0 && prev > 0 ? Math.round((step.count / prev) * 100) : null;
          return (
            <div key={step.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center font-medium text-gray-700">
                  {step.label}
                  <InfoTip text={step.definition} />
                </span>
                <span className="text-gray-500">
                  {step.count} · {pct}%
                  {stepPct !== null && (
                    <span className="ml-1 text-gray-400">({stepPct}% del paso previo)</span>
                  )}
                </span>
              </div>
              <div className="h-5 w-full rounded bg-gray-100">
                <div
                  className="h-5 rounded bg-[#D4A854] transition-all duration-500"
                  style={{ width: `${Math.max(pct, step.count > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
