'use client';

import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  GroupNeedingCaptain,
  GroupWithCaptainsSummary,
  WeeklyStats,
  GroupClosingSoon,
  BookForRemindersTip,
  BookForReactivation,
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
  // Reason: secondary (i) — only for whoever has doubts, must not compete with the list.
  return (
    <details className="group mb-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer select-none inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition">
        <Info className="w-3.5 h-3.5" />
        <span>How this tab works</span>
      </summary>

      <div className="mt-2 max-w-3xl text-xs text-gray-400 leading-relaxed space-y-2">
        <p>
          Organizers who haven&rsquo;t added any captains yet. Captains share the link
          with people the organizer can&rsquo;t easily reach, so books with one get
          roughly 3&times; the recipes. Preview to see the email, Send to fire it; each
          send is logged with its date.
        </p>
        <p>
          <span className="text-gray-500 font-medium">Days without captains</span>: gray
          &lt; 7d, amber 7&ndash;21d, red &gt; 21d ·{' '}
          <span className="text-gray-500 font-medium">Closes in</span>: red &le; 7d, amber
          8&ndash;21d, gray &gt; 21d ·{' '}
          <span className="text-gray-500 font-medium">Recipes</span>: red 0, amber
          1&ndash;5, gray 6&ndash;24, green 25+ ·{' '}
          <span className="text-gray-500 font-medium">Sent</span> = captain reminders sent.
        </p>
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

// Reason: days since last sign of life. More days cold = more at risk = louder.
// < 7d still active (green), 7–21 fine (gray), 22–45 cooling (amber), > 45 cold (red).
function coldnessTone(days: number): string {
  if (days > 45) return 'text-red-600 font-medium';
  if (days > 21) return 'text-amber-600';
  if (days < 7) return 'text-green-600';
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
  // Reason: secondary (i) — only for whoever has doubts, must not compete with the list.
  return (
    <details className="group mb-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer select-none inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition">
        <Info className="w-3.5 h-3.5" />
        <span>How this tab works</span>
      </summary>

      <div className="mt-2 max-w-3xl text-xs text-gray-400 leading-relaxed space-y-2">
        <p>
          Each captain and the organizer of an active book gets a personalized weekly
          digest: total recipes, recipes this week, new people, days left. Preview to see
          a sample, then Send to fire one personalized email per recipient (each with
          their own first name and unsubscribe link). Opted-out recipients are skipped.
        </p>
        <p>
          <span className="text-gray-500 font-medium">Days left</span>: red &le; 7d, amber
          8&ndash;21d, gray &gt; 21d ·{' '}
          <span className="text-gray-500 font-medium">Sent</span> = weekly campaigns fired.
        </p>
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

// ---------- 4. Reminders tool tip ----------

export function RemindersTipGuide() {
  // Reason: this is just a "?" for anyone who has doubts — it must read as
  // secondary, not compete with the list. Small muted (i) that expands on click.
  return (
    <details className="group mb-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer select-none inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition">
        <Info className="w-3.5 h-3.5" />
        <span>How this tab works</span>
      </summary>

      <div className="mt-2 max-w-3xl text-xs text-gray-400 leading-relaxed space-y-2">
        <p>
          Active books ranked by how cold they&rsquo;ve gone: the longer since the
          organizer&rsquo;s last recipe or login, the higher up. A nudge
          (&ldquo;don&rsquo;t forget, you can do this&rdquo;) plus a heads-up that the
          Send Reminders tool exists.
        </p>
        <p>
          <span className="text-gray-500 font-medium">Cold</span> = days since last
          activity (recipe or login) ·{' '}
          <span className="text-gray-500 font-medium">Recipes</span> colors: red 0, amber
          1&ndash;5, gray 6&ndash;24, green 25+ ·{' '}
          <span className="text-gray-500 font-medium">Sent</span> = times this tip has
          gone out. Opted-out, closed, recently-emailed and duplicate books are collapsed
          below.
        </p>
      </div>
    </details>
  );
}

export function RemindersTipRow({
  book,
  onPreview,
  onSend,
  isSending,
}: {
  book: BookForRemindersTip;
  onPreview: () => void;
  onSend: () => void;
  isSending: boolean;
}) {
  const bookName = book.couple_display_name || book.group_name;
  const primary = book.organizer_name || book.organizer_email;
  const showEmailInSmall = !!book.organizer_name;
  const sentDates = book.tip_sent_dates;
  const alreadySentToday = sentToday(sentDates);

  // Reason: label what the last sign of life actually was, for the Cold tooltip.
  const activityLabel =
    book.last_activity_at && book.last_activity_at === book.last_recipe_at
      ? 'last recipe'
      : book.last_activity_at && book.last_activity_at === book.last_login_at
      ? 'last login'
      : 'book created';

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
            {showEmailInSmall && ` · ${book.organizer_email}`}
            {book.reminders_used_count === 0 && (
              <span className="ml-2 text-gray-400">never used the tool</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 shrink-0">
          <span
            className={coldnessTone(book.coldness_days)}
            title={`${activityLabel}: ${formatDate(book.last_activity_at)}`}
          >
            Cold {book.coldness_days}d
          </span>
          <span className={recipeTone(book.total_recipes)}>
            {book.total_recipes} recipe{book.total_recipes === 1 ? '' : 's'}
          </span>
          <span className={book.captain_count > 0 ? 'text-gray-500' : 'text-gray-300'}>
            {book.captain_count > 0
              ? `${book.captain_count} captain${book.captain_count === 1 ? '' : 's'}`
              : 'no captains'}
          </span>
          {book.days_left === null ? (
            <span className="text-gray-300" title="No close date set">No close date</span>
          ) : (
            <span className={deadlineTone(book.days_left)} title={`Book closes ${formatDate(book.book_close_date)}`}>
              Closes in {book.days_left}d
            </span>
          )}
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
            disabled={book.organizer_opted_out}
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

// Reason: the minimal shape the collapsed aside list needs — shared by the
// reminders-tip and reactivation queues so one component serves both.
type AsideBook = {
  group_id: string;
  group_name: string;
  couple_display_name: string | null;
  organizer_name: string | null;
  organizer_email: string;
  bucket: string;
  last_tip_sent_at: string | null;
};

// Reason: why a non-candidate book isn't in the main list — shown so nothing
// silently disappears.
function bucketReason(book: AsideBook): string {
  switch (book.bucket) {
    case 'no_time':
      return 'Book closed';
    case 'cooldown': {
      const d = daysSince(book.last_tip_sent_at ?? '');
      return book.last_tip_sent_at ? `Emailed ${d}d ago` : 'Emailed recently';
    }
    case 'exhausted':
      return 'Already emailed twice';
    case 'duplicate':
      return 'Same organizer, another book above';
    case 'opted_out':
      return 'Opted out of book updates';
    default:
      return '';
  }
}

// Reason: collapsed reference list for books we're NOT emailing right now (opted
// out, closed, in cooldown, exhausted, duplicates). Read-only, collapsed by
// default, hidden entirely when empty. Keeps them findable without clutter.
export function QueueAsideList({
  title,
  subtitle,
  books,
}: {
  title: string;
  subtitle: string;
  books: AsideBook[];
}) {
  if (books.length === 0) return null;
  return (
    <details className="group bg-white rounded-xl shadow overflow-hidden mt-6 [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer select-none flex items-center justify-between px-5 py-4 bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {title} <span className="text-gray-400 font-normal">({books.length})</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <span className="text-gray-400 text-xs transition-transform group-open:rotate-90">&#9656;</span>
      </summary>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-white">
            <th className="text-left px-5 py-2 font-medium text-gray-600 text-xs uppercase tracking-wide">Book</th>
            <th className="text-left px-5 py-2 font-medium text-gray-600 text-xs uppercase tracking-wide">Organizer</th>
            <th className="text-left px-5 py-2 font-medium text-gray-600 text-xs uppercase tracking-wide">Email</th>
            <th className="text-right px-5 py-2 font-medium text-gray-600 text-xs uppercase tracking-wide">Why not now</th>
          </tr>
        </thead>
        <tbody>
          {books.map(b => (
            <tr key={b.group_id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
              <td className="px-5 py-3 font-medium text-gray-900">{b.couple_display_name || b.group_name}</td>
              <td className="px-5 py-3 text-gray-500">{b.organizer_name || '—'}</td>
              <td className="px-5 py-3 text-gray-500">{b.organizer_email}</td>
              <td className="px-5 py-3 text-right text-gray-500">{bucketReason(b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

// ---------- 5. Reactivation ----------

export function ReactivationGuide() {
  // Reason: secondary (i), consistent with the other tabs.
  return (
    <details className="group mb-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer select-none inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition">
        <Info className="w-3.5 h-3.5" />
        <span>How this tab works</span>
      </summary>

      <div className="mt-2 max-w-3xl text-xs text-gray-400 leading-relaxed space-y-2">
        <p>
          People who signed up, then never did anything: 0 recipes, 0 guests, and no
          return visit for at least a week. A short note from Ana reminding them why they
          started, pointing back to their book. Oldest-abandoned first.
        </p>
        <p>
          <span className="text-gray-500 font-medium">Signed up</span> = days since they
          created the book ·{' '}
          <span className="text-gray-500 font-medium">Last seen</span> = days since their
          last login ·{' '}
          <span className="text-gray-500 font-medium">Sent</span> = reactivation emails so
          far (2 max). Opted-out, closed, recently-emailed, already-tried and duplicate
          books are collapsed below.
        </p>
      </div>
    </details>
  );
}

// Reason: how long they've been abandoned — older = more likely forgotten (louder).
function abandonTone(days: number): string {
  if (days > 30) return 'text-red-600 font-medium';
  if (days > 14) return 'text-amber-600';
  return 'text-gray-500';
}

export function ReactivationRow({
  book,
  onPreview,
  onSend,
  isSending,
}: {
  book: BookForReactivation;
  onPreview: () => void;
  onSend: () => void;
  isSending: boolean;
}) {
  const bookName = book.couple_display_name || book.group_name;
  const primary = book.organizer_name || book.organizer_email;
  const showEmailInSmall = !!book.organizer_name;
  const sentDates = book.tip_sent_dates;
  const alreadySentToday = sentToday(sentDates);

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
            {showEmailInSmall && ` · ${book.organizer_email}`}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 shrink-0">
          <span className={abandonTone(book.age_days)} title={`Book created ${formatDate(book.created_at)}`}>
            Signed up {book.age_days}d ago
          </span>
          {book.days_since_login === null ? (
            <span className="text-gray-300" title="No login record">never returned</span>
          ) : (
            <span className="text-gray-400" title={`Last login ${formatDate(book.last_login_at)}`}>
              Last seen {book.days_since_login}d ago
            </span>
          )}
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
            disabled={book.organizer_opted_out}
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
