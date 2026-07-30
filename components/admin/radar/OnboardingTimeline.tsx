'use client';

import type { Milestone, OnboardingSummary } from '@/lib/radar/onboarding-timeline';
import { feedTime, feedDayLabel } from './timeAgo';

// Reason: humanize a millisecond delta into a short "+14 min" / "+3 h" / "+2 d".
function fmtDelta(msVal: number): string {
  const min = Math.round(msVal / 60_000);
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
  if (!m.done) return 'todavía no';
  if (!m.at) return '✓ (sin hora)';
  return `${feedDayLabel(m.at)} ${feedTime(m.at)}`;
}

export function OnboardingTimeline({ summary }: { summary: OnboardingSummary }) {
  const { milestones, hasShared, signupToFirstShareMs } = summary;

  // Reason: three states — real share time, shared-but-no-time (proxy), never shared.
  const star = !hasShared
    ? { text: 'Aún no comparte', danger: true }
    : signupToFirstShareMs !== null
      ? { text: `Registro → 1er share: ${fmtStar(signupToFirstShareMs)}`, danger: false }
      : { text: 'Compartió (sin hora)', danger: false };

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
          Este usuario tiene más de un libro. Mostrando el más reciente.
        </p>
      )}

      {/* Reason: full-width rows put the time far from its label; a divider per
          row + a hover band let the eye track label -> time across the gap. */}
      <ol className="-mx-2 divide-y divide-gray-100">
        {milestones.map((m) => {
          // Reason: hide sub-minute deltas ("+0 min" is noise); show real gaps inline.
          const showDelta = m.deltaFromPrevMs !== null && m.deltaFromPrevMs >= 60_000;
          return (
            <li
              key={m.key}
              className="relative flex items-baseline justify-between gap-3 rounded-md py-2 pl-8 pr-2 transition-colors hover:bg-gray-50"
            >
              <span
                className={`absolute left-2 top-3 h-2.5 w-2.5 rounded-full ${
                  m.done ? 'bg-[#D4A854]' : 'border border-gray-300 bg-white'
                }`}
              />
              <span className={`text-sm ${m.done ? 'text-gray-900' : 'text-gray-400'}`}>
                {m.label}
                {m.detail ? <span className="text-gray-500">: {m.detail}</span> : null}
              </span>
              <span className="flex shrink-0 items-baseline gap-2 whitespace-nowrap">
                {showDelta && (
                  <span className="text-[11px] tabular-nums text-gray-400">
                    {fmtDelta(m.deltaFromPrevMs as number)}
                  </span>
                )}
                <span className={`text-xs tabular-nums ${m.done ? 'text-gray-600' : 'text-gray-400'}`}>
                  {whenLabel(m)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
