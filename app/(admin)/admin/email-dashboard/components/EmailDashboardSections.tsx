'use client';

import { Button } from '@/components/ui/button';
import type {
  GroupNeedingCaptain,
  GroupWithCaptainsSummary,
  WeeklyStats,
  GroupClosingSoon,
} from '@/lib/email/queries';

// ---------- Shared section shell ----------

export function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: 'primary' | 'muted';
  children: React.ReactNode;
}) {
  const bg = tone === 'primary' ? 'bg-brand-warm-white-warm' : 'bg-gray-50';
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className={`px-5 py-4 ${bg}`}>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}

export function EmptyRow({ message }: { message: string }) {
  return <div className="text-center py-8 text-gray-400 text-sm">{message}</div>;
}

// ---------- Email Meta Card (subject + in-email title preview) ----------

export function EmailMetaCard({
  subject,
  subjectVariants,
}: {
  subject: string;
  subjectVariants?: string[];
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 mb-4 flex items-baseline gap-4">
      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide shrink-0">
        Subject line
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-mono text-gray-900 break-words">{subject}</p>
        {subjectVariants && subjectVariants.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {subjectVariants.map((v, i) => (
              <li key={i} className="text-xs font-mono text-gray-500 break-words">
                {v}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------- Onboarding guide (per-tab explainer) ----------

export function CaptainReminderGuide() {
  return (
    <details className="group bg-white rounded-xl border border-gray-200 mb-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer select-none flex items-center justify-between px-5 py-3 text-sm text-gray-600 hover:text-gray-900 transition">
        <span>
          <span className="font-medium">What this tab is</span>
          <span className="text-gray-400 mx-2">&middot;</span>
          <span>how to read the colors</span>
        </span>
        <span className="text-gray-400 text-xs transition-transform group-open:rotate-90">&#9656;</span>
      </summary>

      <div className="px-5 pb-5 pt-2 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-5">

        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            What this is
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            Organizers who haven&rsquo;t added any captains yet. Captains share the
            link with people the organizer can&rsquo;t easily reach &mdash; they
            roughly <span className="font-medium">3&times; the recipes</span>.
            Without one, the organizer is doing it alone.
          </p>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            What you do here
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            Click <span className="font-medium">Preview</span> to see the email,
            then <span className="font-medium">Send</span> to fire it. The organizer
            gets a short note explaining how to add a captain in 30 seconds. Each
            send is logged with its date so you can see the full trail.
          </p>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Reading the colors
          </div>
          <ul className="text-sm text-gray-700 leading-relaxed space-y-1">
            <li>
              <span className="font-medium">Days without captains</span>:{' '}
              <span className="text-gray-500">gray</span> &lt; 7d ·{' '}
              <span className="text-amber-600">amber</span> 7&ndash;21d ·{' '}
              <span className="text-red-600 font-medium">red</span> &gt; 21d
            </li>
            <li>
              <span className="font-medium">Closes in</span>:{' '}
              <span className="text-red-600 font-medium">red</span> &le; 7d ·{' '}
              <span className="text-amber-600">amber</span> 8&ndash;21d ·{' '}
              <span className="text-gray-500">gray</span> &gt; 21d
            </li>
            <li>
              <span className="font-medium">Recipes</span>:{' '}
              <span className="text-red-600 font-medium">red</span> 0 ·{' '}
              <span className="text-amber-600">amber</span> 1&ndash;5 ·{' '}
              <span className="text-gray-500">gray</span> 6&ndash;24 ·{' '}
              <span className="text-green-600 font-medium">green</span> 25+
            </li>
            <li>
              <span className="font-medium">Sent</span>: total count of captain reminders sent. The full chronological trail shows below the row.
            </li>
          </ul>
        </div>

      </div>
    </details>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

// Reason: long, human-readable form for the captain reminder trail.
// Output looks like "miércoles 5 de mayo de 2026".
function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / ONE_DAY_MS);
}

// Reason: interns work this dashboard and can easily fire a duplicate the same
// day. If ANY send for this row happened today (same calendar day), we flip the
// button to amber + "Already sent today" so it's impossible to miss. We do NOT
// block the send — just make accidental double-sends loud.
function sentToday(sentDates: string[]): boolean {
  const now = new Date();
  return sentDates.some(iso => {
    const d = new Date(iso);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  });
}

// ---------- Shared send button ----------
// Reason: the three rows shared identical Send-button logic; centralizing it
// keeps the "already sent today" warning consistent everywhere.
function SendButton({
  isSending,
  disabled,
  disabledTitle,
  alreadySentToday,
  onSend,
}: {
  isSending: boolean;
  disabled: boolean;
  disabledTitle?: string;
  alreadySentToday: boolean;
  onSend: () => void;
}) {
  const label = isSending
    ? 'Sending…'
    : alreadySentToday
    ? 'Already sent today'
    : 'Send';
  const className =
    isSending || disabled
      ? 'bg-gray-100 text-gray-400 border border-gray-200'
      : alreadySentToday
      ? 'bg-amber-500 text-white hover:bg-amber-600'
      : 'bg-black text-white hover:bg-gray-800';
  return (
    <Button
      size="sm"
      disabled={isSending || disabled}
      onClick={onSend}
      className={className}
      title={
        disabled
          ? disabledTitle
          : alreadySentToday
          ? 'You already sent this today — only send again if you really mean to.'
          : ''
      }
    >
      {label}
    </Button>
  );
}

// Reason: gravity color for "how long has this book gone without a captain."
// < 7d: just bought, give it room. 7–21d: nudge worth it. > 21d: urgent (color carries the meaning).
function ageTone(days: number): string {
  if (days > 21) return 'text-red-600 font-medium';
  if (days >= 7) return 'text-amber-600';
  return 'text-gray-500';
}

// Reason: combined with ageTone, this signals the gravity of an at-risk book.
// 0 = alarm. 1–5 = slow. 6–24 = moving. 25+ = healthy book, organizer pulling it off.
function recipeTone(count: number): string {
  if (count === 0) return 'text-red-600 font-medium';
  if (count <= 5) return 'text-amber-600';
  if (count >= 25) return 'text-green-600 font-medium';
  return 'text-gray-500';
}

// Reason: how close the book is to closing — together with age and recipes,
// completes the gravity picture. ≤ 7d = red (urgent), 8–21d = amber, > 21d = gray.
function deadlineTone(daysLeft: number): string {
  if (daysLeft <= 7) return 'text-red-600 font-medium';
  if (daysLeft <= 21) return 'text-amber-600';
  return 'text-gray-500';
}

// ---------- 1. Captain reminder rows ----------

export function CaptainReminderRow({
  group,
  onPreview,
  onSend,
  isSending,
}: {
  group: GroupNeedingCaptain;
  onPreview: () => void;
  onSend: () => void;
  isSending: boolean;
}) {
  const bookName = group.couple_display_name || group.group_name;
  // Reason: lead with the human (organizer) — that's who Ricardo is sending to
  // and recognizing. Book name + email are supporting context.
  const primary = group.organizer_name || group.organizer_email;
  const showEmailInSmall = !!group.organizer_name;
  const ageDays = daysSince(group.group_created_at);
  const ageClass = ageTone(ageDays);
  const sentDates = group.reminder_sent_dates;
  const alreadySentToday = sentToday(sentDates);
  const closeDays = group.book_close_date
    ? Math.max(
        0,
        Math.floor((new Date(group.book_close_date).getTime() - Date.now()) / ONE_DAY_MS)
      )
    : null;

  return (
    <div
      className={`border-t first:border-t-0 px-5 py-4 transition ${
        alreadySentToday ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate">{primary}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {bookName}
            {showEmailInSmall && ` · ${group.organizer_email}`}
            {group.organizer_opted_out && (
              <span className="ml-2 text-red-500">(opted out)</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 shrink-0">
          <span className={ageClass} title={`Book created ${formatDate(group.group_created_at)}`}>
            {ageDays}d without captains
          </span>
          {closeDays !== null ? (
            <span
              className={deadlineTone(closeDays)}
              title={`Book closes ${formatDate(group.book_close_date)}`}
            >
              Closes in {closeDays}d
            </span>
          ) : (
            <span className="text-gray-300" title="No close date set">
              No close date
            </span>
          )}
          <span className={recipeTone(group.total_recipes)}>
            {group.total_recipes} recipe{group.total_recipes === 1 ? '' : 's'}
          </span>
          <span>
            <strong className="text-gray-900">{sentDates.length}</strong> sent
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onPreview}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            Preview
          </button>
          <SendButton
            isSending={isSending}
            disabled={group.organizer_opted_out}
            disabledTitle="Organizer opted out of book updates"
            alreadySentToday={alreadySentToday}
            onSend={onSend}
          />
        </div>
      </div>

      {sentDates.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="font-medium uppercase tracking-wide text-[10px] text-gray-400 mr-2">
            Sent
          </span>
          {sentDates.map((d, i) => (
            <span key={d}>
              {i > 0 && <span className="mx-2 text-gray-300">·</span>}
              {formatDateLong(d)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Weekly Status Guide ----------

export function WeeklyStatusGuide() {
  return (
    <details className="group bg-white rounded-xl border border-gray-200 mb-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer select-none flex items-center justify-between px-5 py-3 text-sm text-gray-600 hover:text-gray-900 transition">
        <span>
          <span className="font-medium">What this tab is</span>
          <span className="text-gray-400 mx-2">&middot;</span>
          <span>how the weekly send works</span>
        </span>
        <span className="text-gray-400 text-xs transition-transform group-open:rotate-90">&#9656;</span>
      </summary>

      <div className="px-5 pb-5 pt-2 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-5">

        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            What this is
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            Each captain and the organizer of an active book gets a personalized
            weekly digest: total recipes, recipes this week, new people, days left.
            Keeps momentum going so they don&rsquo;t lose interest mid-collection.
          </p>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            What you do here
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            Click <span className="font-medium">Preview</span> to see a sample,
            then <span className="font-medium">Send</span> to fire <em>one personalized
            email per recipient</em> (each gets their own first name + their own
            unsubscribe link). Already opted-out recipients are skipped automatically.
          </p>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Reading the colors
          </div>
          <ul className="text-sm text-gray-700 leading-relaxed space-y-1">
            <li>
              <span className="font-medium">Days left</span>:{' '}
              <span className="text-red-600 font-medium">red</span> &le; 7d ·{' '}
              <span className="text-amber-600">amber</span> 8&ndash;21d ·{' '}
              <span className="text-gray-500">gray</span> &gt; 21d
            </li>
            <li>
              <span className="font-medium">Sent</span>: total weekly campaigns fired. Full chronological trail shows below the row.
            </li>
          </ul>
        </div>

      </div>
    </details>
  );
}

// ---------- 1b. Books WITH captains (reference table, read-only) ----------

export function BooksWithCaptainsTable({ groups }: { groups: GroupWithCaptainsSummary[] }) {
  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow overflow-hidden mt-6">
        <div className="px-5 py-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Books with captains</h2>
          <p className="text-xs text-gray-500 mt-0.5">Reference only &mdash; no books have captains yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden mt-6">
      <div className="px-5 py-4 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Books with captains</h2>
        <p className="text-xs text-gray-500 mt-0.5">Reference only &mdash; for context on what healthy books look like.</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-white">
            <th className="text-left px-5 py-2 font-medium text-gray-600 text-xs uppercase tracking-wide">Book</th>
            <th className="text-left px-5 py-2 font-medium text-gray-600 text-xs uppercase tracking-wide">Organizer</th>
            <th className="text-right px-5 py-2 font-medium text-gray-600 text-xs uppercase tracking-wide">Captains</th>
            <th className="text-right px-5 py-2 font-medium text-gray-600 text-xs uppercase tracking-wide">Recipes</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(g => {
            const bookName = g.couple_display_name || g.group_name;
            const captainsLabel = g.captain_names.length > 0
              ? g.captain_names.join(', ')
              : `${g.captain_count} captain${g.captain_count === 1 ? '' : 's'}`;
            return (
              <tr key={g.group_id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                <td className="px-5 py-3 font-medium text-gray-900">{bookName}</td>
                <td className="px-5 py-3 text-gray-500">{g.organizer_name || '—'}</td>
                <td className="px-5 py-3 text-gray-700">{captainsLabel}</td>
                <td className={`px-5 py-3 text-right font-medium ${recipeTone(g.total_recipes)}`}>
                  {g.total_recipes}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------- 2. Weekly status rows ----------

export function WeeklyStatusRow({
  stats,
  onPreview,
  onSend,
  isSending,
}: {
  stats: WeeklyStats;
  onPreview: () => void;
  onSend: () => void;
  isSending: boolean;
}) {
  const displayName = stats.couple_display_name || stats.group_name;
  const eligibleRecipients = stats.recipients.filter(r => !r.notification_emails_opt_out);
  const noRecipients = eligibleRecipients.length === 0;
  const sentDates = stats.status_sent_dates;
  const alreadySentToday = sentToday(sentDates);

  return (
    <div
      className={`border-t first:border-t-0 px-5 py-4 transition ${
        alreadySentToday ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate">{displayName}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {eligibleRecipients.length}/{stats.recipients.length} recipient
            {stats.recipients.length === 1 ? '' : 's'} (captains + organizer)
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 shrink-0">
          {stats.days_left === null ? (
            <span className="text-gray-300" title="No close date set">No close date</span>
          ) : (
            <span
              className={deadlineTone(stats.days_left)}
              title={`Book closes ${formatDate(stats.book_close_date)}`}
            >
              Closes in {stats.days_left}d
            </span>
          )}
          <span className="text-gray-400 text-xs">
            {stats.total_recipes} recipe{stats.total_recipes === 1 ? '' : 's'}
          </span>
          <span className="text-gray-400 text-xs">
            +{stats.recipes_this_week} this week
          </span>
          <span className="text-gray-400 text-xs">
            +{stats.new_guests_this_week} new people
          </span>
          <span>
            <strong className="text-gray-900">{sentDates.length}</strong> sent
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onPreview}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            Preview
          </button>
          <SendButton
            isSending={isSending}
            disabled={noRecipients}
            disabledTitle="No eligible recipients (everyone opted out)"
            alreadySentToday={alreadySentToday}
            onSend={onSend}
          />
        </div>
      </div>

      {sentDates.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="font-medium uppercase tracking-wide text-[10px] text-gray-400 mr-2">
            Sent
          </span>
          {sentDates.map((d, i) => (
            <span key={d}>
              {i > 0 && <span className="mx-2 text-gray-300">·</span>}
              {formatDateLong(d)}
            </span>
          ))}
        </div>
      )}

      <ul className="mt-2 ml-3 space-y-1">
        {stats.recipients.map(r => (
          <li key={r.profile_id} className="text-xs text-gray-600">
            <span className="font-medium text-gray-700">
              {r.role === 'owner' ? 'Owner' : 'Captain'}:
            </span>{' '}
            <span className="text-gray-900">{r.full_name || '—'}</span>{' '}
            <span className="text-gray-500">{r.email}</span>
            {r.notification_emails_opt_out && (
              <span className="text-red-500 text-[10px] uppercase tracking-wide ml-2">
                opted out
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- 3. Closing nudge rows ----------

export function ClosingNudgeRow({
  group,
  onPreview,
  onSend,
  isSending,
}: {
  group: GroupClosingSoon;
  onPreview: () => void;
  onSend: () => void;
  isSending: boolean;
}) {
  const displayName = group.couple_display_name || group.group_name;
  const noEligible = group.eligible_guests_count === 0;
  const closeDate = new Date(group.book_close_date);
  const closeDateLabel = closeDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="border-t first:border-t-0 px-5 py-4 hover:bg-gray-50 transition">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate">{displayName}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Closes {closeDateLabel}
            {' · '}
            <span
              className={
                group.days_until_close <= 3
                  ? 'text-red-600 font-medium'
                  : group.days_until_close <= 7
                  ? 'text-amber-600'
                  : 'text-gray-500'
              }
            >
              {group.days_until_close} day{group.days_until_close === 1 ? '' : 's'} left
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 shrink-0">
          <span>
            <strong className="text-gray-900">{group.eligible_guests_count}</strong> eligible
          </span>
          <span className="text-gray-400">
            {group.closing_nudge_sent_count} already nudged
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onPreview}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            Preview
          </button>
          <SendButton
            isSending={isSending}
            disabled={noEligible}
            disabledTitle="No eligible guests"
            alreadySentToday={false}
            onSend={onSend}
          />
        </div>
      </div>
    </div>
  );
}
