'use client';

import { Line, LineChart, ResponsiveContainer } from 'recharts';
import type { PulseMetric, RangeKey, RangeNumbers } from '@/lib/radar/types';
import { InfoTip } from './InfoTip';

const RANGE_DELTA_LABEL: Record<RangeKey, string> = {
  today: 'vs ayer completo',
  d7: 'vs 7d previos',
  d30: 'vs 30d previos',
};

function Delta({ numbers, range }: { numbers: RangeNumbers; range: RangeKey }) {
  const diff = numbers.current - numbers.previous;
  if (numbers.current === 0 && numbers.previous === 0) {
    return <span className="text-xs text-gray-400">sin movimiento</span>;
  }
  const color = diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-gray-400';
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '=';
  return (
    <span className={`text-xs font-medium ${color}`}>
      {arrow} {Math.abs(diff)} {RANGE_DELTA_LABEL[range]}
    </span>
  );
}

export function PulseCards({ metrics, range }: { metrics: PulseMetric[]; range: RangeKey }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {metrics.map((m) => {
        const numbers = m[range];
        return (
          <div key={m.key} className="rounded-xl bg-white p-4 shadow-lg">
            <div className="flex items-center text-xs font-semibold uppercase tracking-wide text-gray-500">
              {m.label}
              <InfoTip text={m.definition} />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{numbers.current}</span>
              <Delta numbers={numbers} range={range} />
            </div>
            <div className="mt-2 h-9">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={m.spark.map((v, i) => ({ i, v }))}>
                  <Line type="monotone" dataKey="v" stroke="#D4A854" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-[10px] text-gray-400">últimos 14 días</div>
          </div>
        );
      })}
    </div>
  );
}
