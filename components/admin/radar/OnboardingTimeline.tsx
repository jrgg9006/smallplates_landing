'use client';

import type { Milestone, OnboardingSummary } from '@/lib/radar/onboarding-timeline';
import { feedTime, feedDayLabel } from './timeAgo';

// Reason: humanize a millisecond delta into a short "+14 min" / "+3 h" / "+2 d".
function fmtDelta(msVal: number): string {
  const min = Math.round(msVal / 60_000);
  if (min < 1) return '+0 min';
  if (min < 60) return `+${min} min`;
  const hrs = Math.round(min / 60);
  if (hrs < 48) return `+${hrs} h`;
  return `+${Math.round(hrs / 24)} d`;
}

function fmtStar(msVal: number): string {
  const min = Math.round(msVal / 60_000);
  if (min < 60) return `${min} min`;
  const hrs = Math.floor(min / 60);
  const rem = min % 60;
  if (hrs < 48) return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
  return `${Math.round(hrs / 24)} d`;
}

function whenLabel(m: Milestone): string {
  if (!m.done) return '— todavía no';
  if (!m.at) return '✓ (sin hora)';
  return `${feedDayLabel(m.at)} ${feedTime(m.at)}`;
}

export function OnboardingTimeline({ summary }: { summary: OnboardingSummary }) {
  const { milestones, hasShared, signupToFirstShareMs } = summary;

  const star = hasShared && signupToFirstShareMs !== null
    ? { text: `Registro → 1er share: ${fmtStar(signupToFirstShareMs)}`, danger: false }
    : { text: 'Aún no comparte', danger: true };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          Primeros momentos
        </h2>
        <span className={`text-sm font-medium ${star.danger ? 'text-red-600' : 'text-gray-700'}`}>
          {star.text}
        </span>
      </div>

      {summary.multipleBooks && (
        <p className="mb-3 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
          Este usuario tiene más de un libro — mostrando el más reciente.
        </p>
      )}

      <ol className="space-y-0">
        {milestones.map((m) => (
          <li key={m.key} className="relative pl-6">
            {/* dot */}
            <span
              className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${
                m.done ? 'bg-[#D4A854]' : 'border border-gray-300 bg-white'
              }`}
            />
            <div className="flex items-baseline justify-between py-1.5">
              <span className={`text-sm ${m.done ? 'text-gray-900' : 'text-gray-400'}`}>
                {m.label}
                {m.detail ? <span className="text-gray-500">: {m.detail}</span> : null}
              </span>
              <span className={`text-xs ${m.done ? 'text-gray-500' : 'text-gray-400'}`}>
                {whenLabel(m)}
              </span>
            </div>
            {m.deltaFromPrevMs !== null && (
              <div className="ml-[-1px] border-l border-gray-200 pl-3 pb-1 text-[11px] text-gray-400">
                {fmtDelta(m.deltaFromPrevMs)}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
