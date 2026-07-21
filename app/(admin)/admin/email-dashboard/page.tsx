'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/config/admin';
import type {
  GroupNeedingCaptain,
  GroupWithCaptainsSummary,
  WeeklyStats,
  GroupClosingSoon,
  BookForRemindersTip,
} from '@/lib/email/queries';
import {
  Section,
  EmptyRow,
  EmailMetaCard,
  CaptainReminderGuide,
  CaptainReminderRow,
  BooksWithCaptainsTable,
  WeeklyStatusGuide,
  WeeklyStatusRow,
  ClosingNudgeRow,
  RemindersTipGuide,
  RemindersTipRow,
  RemindersTipAsideList,
} from './components/EmailDashboardSections';

interface DashboardData {
  captainReminder: GroupNeedingCaptain[];
  booksWithCaptains: GroupWithCaptainsSummary[];
  weeklyStatus: WeeklyStats[];
  closingNudge: GroupClosingSoon[];
  remindersTip: BookForRemindersTip[];
}

type Tab = 'captain-reminder' | 'weekly-status' | 'closing-nudge' | 'reminders-tip';

export default function EmailDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('captain-reminder');
  const [showAllBooks, setShowAllBooks] = useState(false);
  // Reason: client-side hostname check so any send button can refuse if we're
  // on localhost. Initial value defers to false until mount to avoid hydration
  // mismatch (window doesn't exist server-side).
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    const h = window.location.hostname;
    setIsLocalhost(h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local'));
  }, []);

  useEffect(() => {
    void checkAdminAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAndLoad = async () => {
    const supabase = createSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || !isAdminEmail(auth.user.email)) {
      router.push('/');
      return;
    }
    setIsAdmin(true);
    await fetchData();
    setLoading(false);
  };

  const fetchData = async (includeAll = showAllBooks) => {
    try {
      const url = `/api/v1/admin/email-dashboard${includeAll ? '?include_all=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to load');
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  };

  const toggleShowAll = async () => {
    const next = !showAllBooks;
    setShowAllBooks(next);
    await fetchData(next);
  };

  const openPreview = (path: string, params: Record<string, string>) => {
    const search = new URLSearchParams(params).toString();
    window.open(`${path}?${search}`, '_blank');
  };

  const sendEmail = async (
    type: 'captain-reminder' | 'weekly-status' | 'closing-nudge' | 'reminders-tip',
    groupId: string,
    confirmMessage: string
  ) => {
    if (!window.confirm(confirmMessage)) return;
    const key = `${type}:${groupId}`;
    setSendingKey(key);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/email-dashboard/${type}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Send failed');
      const summary =
        typeof json.sent === 'number'
          ? `${json.sent} sent${json.skipped ? `, ${json.skipped} skipped` : ''}${json.errored ? `, ${json.errored} failed` : ''}`
          : `Sent to ${json.recipient ?? 'recipient'}`;
      // Reason: brief inline confirmation; refetch refreshes the counts.
      setError(`✓ ${summary}`);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSendingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
          <p className="text-gray-600">Loading email dashboard…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-[1400px] mx-auto">
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block"
          >
            ← Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Email Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            
          </p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {isLocalhost && (
          <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-400 rounded-lg flex items-start gap-3">
            <span className="text-2xl leading-none" aria-hidden>⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 mb-0.5">
                Heads up &mdash; you&rsquo;re on localhost.
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Any email you send from here will contain links to{' '}
                <code className="px-1 py-0.5 bg-amber-100 rounded">localhost:3000</code>{' '}
                and won&rsquo;t work for the recipient. Sending still works for experiments &mdash;
                just don&rsquo;t send to real customers from here.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 font-medium underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Tabs (the count cards double as the navigation). */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <TabCard
                label="Captain reminder"
                value={data.captainReminder.length}
                active={activeTab === 'captain-reminder'}
                onClick={() => setActiveTab('captain-reminder')}
              />
              <TabCard
                label="Weekly status"
                value={data.weeklyStatus.length}
                active={activeTab === 'weekly-status'}
                onClick={() => setActiveTab('weekly-status')}
              />
              <TabCard
                label="Closing in ≤ 7 days"
                value={data.closingNudge.length}
                active={activeTab === 'closing-nudge'}
                onClick={() => setActiveTab('closing-nudge')}
              />
              <TabCard
                label="Reminders tip"
                value={data.remindersTip.filter(b => b.bucket === 'candidate').length}
                active={activeTab === 'reminders-tip'}
                onClick={() => setActiveTab('reminders-tip')}
              />
            </div>

            {activeTab === 'captain-reminder' && (
              <>
                <CaptainReminderGuide />
                <EmailMetaCard
                  subject="{Couple}'s book needs captains."
                />
                <div className="mb-3 flex items-center justify-end">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showAllBooks}
                      onChange={toggleShowAll}
                      className="h-4 w-4 rounded border-gray-300 text-brand-honey focus:ring-brand-honey"
                    />
                    <span>
                      Show all books{' '}
                      <span className="text-gray-400 text-xs">
                        (includes reviewed, printed, etc.)
                      </span>
                    </span>
                  </label>
                </div>
                <Section title="Captain reminder" tone="primary">
                  {data.captainReminder.length === 0 ? (
                    <EmptyRow message="Every group already has a captain. Nice." />
                  ) : (
                    data.captainReminder.map(g => (
                      <CaptainReminderRow
                        key={g.group_id}
                        group={g}
                        onPreview={() =>
                          openPreview(
                            '/api/v1/admin/email-dashboard/captain-reminder/preview',
                            { group_id: g.group_id }
                          )
                        }
                        onSend={() =>
                          sendEmail(
                            'captain-reminder',
                            g.group_id,
                            `Send captain reminder to ${g.organizer_email}?`
                          )
                        }
                        isSending={sendingKey === `captain-reminder:${g.group_id}`}
                      />
                    ))
                  )}
                </Section>
                <BooksWithCaptainsTable groups={data.booksWithCaptains} />
              </>
            )}

            {activeTab === 'weekly-status' && (
              <>
                <WeeklyStatusGuide />
                <EmailMetaCard
                  subject="Your weekly update - {Couple}'s book"
                />
                <Section title="Weekly status" tone="muted">
                {data.weeklyStatus.length === 0 ? (
                  <EmptyRow message="No active books right now." />
                ) : (
                  data.weeklyStatus.map(s => (
                    <WeeklyStatusRow
                      key={s.group_id}
                      stats={s}
                      onPreview={() =>
                        openPreview(
                          '/api/v1/admin/email-dashboard/weekly-status/preview',
                          { group_id: s.group_id }
                        )
                      }
                      onSend={() =>
                        sendEmail(
                          'weekly-status',
                          s.group_id,
                          `Send weekly status to ${s.recipients.filter(r => !r.notification_emails_opt_out).length} recipient(s) for ${s.couple_display_name || s.group_name}?`
                        )
                      }
                      isSending={sendingKey === `weekly-status:${s.group_id}`}
                    />
                  ))
                )}
                </Section>
              </>
            )}

            {activeTab === 'closing-nudge' && (
              <>
                <EmailMetaCard
                  subject="{Couple}'s book closes {Day}."
                />
                <Section title="Pre-closing nudge" tone="muted">
                {data.closingNudge.length === 0 ? (
                  <EmptyRow message="Nothing closing in the next 7 days." />
                ) : (
                  data.closingNudge.map(g => (
                    <ClosingNudgeRow
                      key={g.group_id}
                      group={g}
                      onPreview={() =>
                        openPreview(
                          '/api/v1/admin/email-dashboard/closing-nudge/preview',
                          { group_id: g.group_id }
                        )
                      }
                      onSend={() =>
                        sendEmail(
                          'closing-nudge',
                          g.group_id,
                          `Send closing nudge to ${g.eligible_guests_count} guest(s) of ${g.couple_display_name || g.group_name}?`
                        )
                      }
                      isSending={sendingKey === `closing-nudge:${g.group_id}`}
                    />
                  ))
                )}
                </Section>
              </>
            )}

            {activeTab === 'reminders-tip' && (
              <>
                <RemindersTipGuide />
                <EmailMetaCard subject="Send reminders in one click" />
                <Section title="Coldest first" tone="primary">
                  {data.remindersTip.filter(b => b.bucket === 'candidate').length === 0 ? (
                    <EmptyRow message="No active book needs a nudge right now." />
                  ) : (
                    data.remindersTip
                      .filter(b => b.bucket === 'candidate')
                      .map(b => (
                        <RemindersTipRow
                          key={b.group_id}
                          book={b}
                          onPreview={() =>
                            openPreview(
                              '/api/v1/admin/email-dashboard/reminders-tip/preview',
                              { group_id: b.group_id }
                            )
                          }
                          onSend={() =>
                            sendEmail(
                              'reminders-tip',
                              b.group_id,
                              `Send the Send Reminders tip to ${b.organizer_email}?`
                            )
                          }
                          isSending={sendingKey === `reminders-tip:${b.group_id}`}
                        />
                      ))
                  )}
                </Section>
                <RemindersTipAsideList
                  title="Not sending right now"
                  subtitle="Closed books, recently emailed, or a duplicate of a colder book above."
                  books={data.remindersTip.filter(
                    b => b.bucket === 'no_time' || b.bucket === 'cooldown' || b.bucket === 'duplicate'
                  )}
                />
                <RemindersTipAsideList
                  title="Opted out"
                  subtitle="These organizers opted out of book updates, so they're never emailed here."
                  books={data.remindersTip.filter(b => b.bucket === 'opted_out')}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  // Reason: active tab uses brand-honey + a subtle ring; inactive is muted
  // and gets a hover state to telegraph it's clickable.
  const containerClass = active
    ? 'bg-white rounded-xl border-2 border-brand-honey ring-2 ring-brand-honey/20 p-4 text-left transition'
    : 'bg-white rounded-xl border border-gray-200 p-4 text-left transition hover:border-gray-400 hover:shadow-sm';
  const numColor = active ? 'text-brand-honey' : 'text-gray-600';
  return (
    <button onClick={onClick} className={containerClass} aria-pressed={active}>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className={`text-3xl font-bold ${numColor} mt-1`}>{value}</div>
    </button>
  );
}
