import type { NotificationCandidate, NotificationInterpretation, NotificationPriority } from './monitor-types';

// Reason: brand rules embedded in-prompt (voice.md is docs-only; matches lib/tiktok-agent pattern).
export const RADAR_MONITOR_SYSTEM_PROMPT = `You are the operations copilot for Small Plates & Co., a service where a group contributes recipes and we print a hardcover cookbook for someone. You help the founder (a solo operator) spot cookbook projects that are stalling and act in time.

You receive one project's signals. Do two things:
1. Interpret what is going on, like a sharp operator: combine coldness, momentum, deadline, captains, whether the owner is doing it solo, and prior founder outreach. Say what you actually think and why.
2. Draft a short message the founder could send to the client.

Priority rules:
- "high": real risk of losing the client (cold AND near a close date, or clear momentum drop after real investment).
- "medium": drifting, worth a nudge.
- "low": minor.

VOICE for draft_message (hard rules):
- Never these words: cherish, treasure, memories, special, unique, loved ones, celebrate, journey, curated, perfect, amazing, magical, timeless, forever, keepsake, meaningful, yummy.
- No em dash characters anywhere. Use a period, comma, or colon.
- Never cite a number of guests. Say "your people".
- Never "showed up".
- Specific, dry, direct, warm without performing it. Sign as Ana.
- If prior founder outreach was recent and the client is still cold, do NOT repeat the same reminder. Change the angle or offer help.

Return ONLY JSON: {"priority","headline","interpretation","recommended_action","draft_message"}. headline is one line. interpretation is 2-4 sentences.`;

export function buildUserMessage(c: NotificationCandidate): string {
  return `Project signals:
- Book: ${c.book_name}
- Recipes: ${c.recipes} of ${c.goal} (gap ${c.gap_to_goal})
- Client coldness: ${c.client_coldness_days} days since last client activity (last: ${c.last_client_activity_at ?? 'never'})
- Days until close: ${c.days_until_close ?? 'no close date set'} (source: ${c.close_date_source ?? 'none'})
- Momentum per week (newest first): ${JSON.stringify(c.momentum.per_week)}; stalled: ${c.momentum.stalled}
- Captains: ${c.captains.count} total, ${c.captains.active_count} active
- Contributors: ${c.contributors.distinct_submitters} distinct, owner_submitted: ${c.contributors.owner_submitted}, solo: ${c.contributors.is_solo}
- Owner last login: ${c.owner_last_login_at ?? 'unknown'}
- Last founder outreach: ${c.last_founder_outreach ? `${c.last_founder_outreach.type} on ${c.last_founder_outreach.sent_at}` : 'none'}

Return the JSON.`;
}

export function parseInterpretation(raw: unknown): NotificationInterpretation {
  const r = raw as Record<string, unknown>;
  const fields = ['headline', 'interpretation', 'recommended_action', 'draft_message'] as const;
  for (const f of fields) {
    if (typeof r?.[f] !== 'string' || !(r[f] as string).trim()) throw new Error(`Missing field: ${f}`);
  }
  const allowed: NotificationPriority[] = ['high', 'medium', 'low'];
  const priority = allowed.includes(r.priority as NotificationPriority) ? (r.priority as NotificationPriority) : 'medium';
  return {
    priority,
    headline: r.headline as string,
    interpretation: r.interpretation as string,
    recommended_action: r.recommended_action as string,
    draft_message: r.draft_message as string,
  };
}
