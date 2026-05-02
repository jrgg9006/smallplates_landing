'use client';

import { useEffect, useRef, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAdminEmail } from '@/lib/config/admin';
import { Button } from '@/components/ui/button';

interface PdfGuest {
  guest_id: string;
  guest_name: string;
  guest_email: string;
  showcase_opted_out: boolean;
  pdf_sent_at: string | null;
}

interface PdfGroup {
  group_id: string;
  group_name: string;
  couple_display_name: string | null;
  book_status: string;
  pdf_url: string | null;
  total_contributors: number;
  total_recipes: number;
  guests: PdfGuest[];
}

const BOOK_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  reviewed: 'Reviewed',
  ready_to_print: 'Ready to print',
  printed: 'Printed',
  inactive: 'Inactive',
};

export default function PdfDeliveryPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [groups, setGroups] = useState<PdfGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadingGroupId, setUploadingGroupId] = useState<string | null>(null);
  const [sendingGuestId, setSendingGuestId] = useState<string | null>(null);
  const [resettingGuestId, setResettingGuestId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAndLoad = async () => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdminEmail(user.email)) {
      router.push('/');
      return;
    }
    setIsAdmin(true);
    await fetchData();
    setLoading(false);
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/v1/admin/pdf-delivery');
      if (!res.ok) throw new Error('Failed to load data');
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleUploadClick = (groupId: string) => {
    uploadTargetRef.current = groupId;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const groupId = uploadTargetRef.current;
    if (!file || !groupId) return;
    e.target.value = '';

    setUploadingGroupId(groupId);
    setError(null);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('group_id', groupId);

    try {
      const res = await fetch('/api/v1/admin/pdf-delivery/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }
      const { pdf_url } = await res.json();
      setGroups(prev => prev.map(g => g.group_id === groupId ? { ...g, pdf_url } : g));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingGroupId(null);
    }
  };

  const handleSend = async (group: PdfGroup, guest: PdfGuest) => {
    setSendingGuestId(guest.guest_id);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/pdf-delivery/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: guest.guest_id,
          guest_name: guest.guest_name,
          guest_email: guest.guest_email,
          group_id: group.group_id,
          couple_name: group.couple_display_name,
          total_recipe_count: group.total_recipes,
          total_contributor_count: group.total_contributors,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Send failed');
      }
      const { sent_at } = await res.json();
      setGroups(prev => prev.map(g =>
        g.group_id !== group.group_id ? g : {
          ...g,
          guests: g.guests.map(gu =>
            gu.guest_id === guest.guest_id ? { ...gu, pdf_sent_at: sent_at } : gu
          ),
        }
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSendingGuestId(null);
    }
  };

  const handleReset = async (groupId: string, guest: PdfGuest) => {
    setResettingGuestId(guest.guest_id);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/pdf-delivery/send', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: guest.guest_id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Reset failed');
      }
      setGroups(prev => prev.map(g =>
        g.group_id !== groupId ? g : {
          ...g,
          guests: g.guests.map(gu =>
            gu.guest_id === guest.guest_id ? { ...gu, pdf_sent_at: null } : gu
          ),
        }
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setResettingGuestId(null);
    }
  };

  // Sections: printed + has PDF + has unsent guests → Ready
  const readyGroups = groups.filter(g =>
    g.book_status === 'printed' && g.pdf_url &&
    g.guests.some(gu => !gu.showcase_opted_out && !gu.pdf_sent_at)
  );
  // printed but no PDF yet
  const needsPdfGroups = groups.filter(g => g.book_status === 'printed' && !g.pdf_url);
  // not yet printed
  const waitingGroups = groups.filter(g => g.book_status !== 'printed');
  // all eligible guests sent
  const doneGroups = groups.filter(g =>
    g.book_status === 'printed' && g.pdf_url &&
    g.guests.every(gu => gu.showcase_opted_out || !!gu.pdf_sent_at)
  );

  const totalPending = readyGroups.reduce(
    (n, g) => n + g.guests.filter(gu => !gu.showcase_opted_out && !gu.pdf_sent_at).length, 0
  );
  const totalSent = groups.reduce(
    (n, g) => n + g.guests.filter(gu => !!gu.pdf_sent_at).length, 0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
          <p className="text-gray-600">Loading PDF delivery...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block">
              &larr; Back to Admin
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">PDF Delivery</h1>
            <p className="text-sm text-gray-600 mt-1">
              Send the full digital cookbook to recipe contributors
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-medium underline">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-brand-honey p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Guests pending</div>
            <div className="text-3xl font-bold text-brand-honey mt-1">{totalPending}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Needs PDF</div>
            <div className="text-3xl font-bold text-gray-600 mt-1">{needsPdfGroups.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Waiting for book</div>
            <div className="text-3xl font-bold text-gray-600 mt-1">{waitingGroups.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Guests sent</div>
            <div className="text-3xl font-bold text-gray-400 mt-1">{totalSent}</div>
          </div>
        </div>

        {/* Ready to send */}
        <GroupSection title="Ready to send" subtitle="PDF uploaded. Send to each guest below." count={readyGroups.length} tone="primary">
          {readyGroups.length === 0
            ? <EmptyRow message="Nothing pending." />
            : readyGroups.map(g => (
              <GroupCard
                key={g.group_id}
                group={g}
                expanded={expandedGroups.has(g.group_id)}
                onToggle={() => toggleGroup(g.group_id)}
                onUpload={handleUploadClick}
                onSend={handleSend}
                onReset={handleReset}
                uploadingGroupId={uploadingGroupId}
                sendingGuestId={sendingGuestId}
                resettingGuestId={resettingGuestId}
              />
            ))
          }
        </GroupSection>

        {/* Needs PDF upload */}
        <div className="mt-6">
          <GroupSection title="Needs PDF" subtitle="Book is printed — upload the PDF to unlock sending." count={needsPdfGroups.length} tone="muted">
            {needsPdfGroups.length === 0
              ? <EmptyRow message="No books waiting for PDF." />
              : needsPdfGroups.map(g => (
                <GroupCard
                  key={g.group_id}
                  group={g}
                  expanded={expandedGroups.has(g.group_id)}
                  onToggle={() => toggleGroup(g.group_id)}
                  onUpload={handleUploadClick}
                  onSend={handleSend}
                  onReset={handleReset}
                  uploadingGroupId={uploadingGroupId}
                  sendingGuestId={sendingGuestId}
                  resettingGuestId={resettingGuestId}
                />
              ))
            }
          </GroupSection>
        </div>

        {/* Waiting for book */}
        <div className="mt-6">
          <GroupSection title="Waiting for book" subtitle="Book not yet printed." count={waitingGroups.length} tone="muted">
            {waitingGroups.length === 0
              ? <EmptyRow message="No books in the pipeline." />
              : waitingGroups.map(g => (
                <GroupCard
                  key={g.group_id}
                  group={g}
                  expanded={expandedGroups.has(g.group_id)}
                  onToggle={() => toggleGroup(g.group_id)}
                  onUpload={handleUploadClick}
                  onSend={handleSend}
                  onReset={handleReset}
                  uploadingGroupId={uploadingGroupId}
                  sendingGuestId={sendingGuestId}
                  resettingGuestId={resettingGuestId}
                />
              ))
            }
          </GroupSection>
        </div>

        {/* All done */}
        {doneGroups.length > 0 && (
          <div className="mt-6">
            <GroupSection title="Completed" subtitle="All eligible guests received the PDF." count={doneGroups.length} tone="muted">
              {doneGroups.map(g => (
                <GroupCard
                  key={g.group_id}
                  group={g}
                  expanded={expandedGroups.has(g.group_id)}
                  onToggle={() => toggleGroup(g.group_id)}
                  onUpload={handleUploadClick}
                  onSend={handleSend}
                  onReset={handleReset}
                  uploadingGroupId={uploadingGroupId}
                  sendingGuestId={sendingGuestId}
                  resettingGuestId={resettingGuestId}
                />
              ))}
            </GroupSection>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ---------- Helper components ----------

function GroupSection({
  title, subtitle, count, tone, children,
}: {
  title: string; subtitle: string; count: number; tone: 'primary' | 'muted'; children: React.ReactNode;
}) {
  const countColor = tone === 'primary' ? 'text-brand-honey' : 'text-gray-500';
  const bg = tone === 'primary' ? 'bg-brand-warm-white-warm' : 'bg-gray-50';
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className={`flex items-baseline gap-3 px-5 py-4 ${bg}`}>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className={`text-xl font-bold ${countColor}`}>{count}</span>
        <p className="text-sm text-gray-500 ml-2">{subtitle}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <div className="text-center py-8 text-gray-400 text-sm">{message}</div>;
}

interface GroupCardProps {
  group: PdfGroup;
  expanded: boolean;
  onToggle: () => void;
  onUpload: (groupId: string) => void;
  onSend: (group: PdfGroup, guest: PdfGuest) => void;
  onReset: (groupId: string, guest: PdfGuest) => void;
  uploadingGroupId: string | null;
  sendingGuestId: string | null;
  resettingGuestId: string | null;
}

function GroupCard({
  group, expanded, onToggle, onUpload, onSend, onReset,
  uploadingGroupId, sendingGuestId, resettingGuestId,
}: GroupCardProps) {
  const eligibleGuests = group.guests.filter(g => !g.showcase_opted_out);
  const sentCount = eligibleGuests.filter(g => !!g.pdf_sent_at).length;
  const isUploading = uploadingGroupId === group.group_id;

  return (
    <div className="border-t first:border-t-0">
      {/* Group header row */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={e => e.key === 'Enter' && onToggle()}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition text-left cursor-pointer"
      >
        <div className="flex items-center gap-6 min-w-0">
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              {group.couple_display_name || group.group_name}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {BOOK_STATUS_LABELS[group.book_status] || group.book_status}
              {group.group_name !== group.couple_display_name && group.couple_display_name &&
                ` · ${group.group_name}`}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 shrink-0">
            <span><strong className="text-gray-900">{group.total_contributors}</strong> people</span>
            <span><strong className="text-gray-900">{group.total_recipes}</strong> recipes</span>
            <span className="text-gray-400">
              {sentCount}/{eligibleGuests.length} sent
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <button
            onClick={e => {
              e.stopPropagation();
              window.open(`/api/v1/admin/pdf-delivery/preview-cover?group_id=${group.group_id}`, '_blank');
            }}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            Preview cover
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              window.open(`/api/v1/admin/pdf-delivery/preview-email?group_id=${group.group_id}`, '_blank');
            }}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            Preview email
          </button>
          {group.pdf_url ? (
            <span className="text-xs text-green-600 font-medium">PDF ready</span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={isUploading}
              onClick={e => { e.stopPropagation(); onUpload(group.group_id); }}
              className="text-xs"
            >
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </Button>
          )}
          <span className="text-gray-400 text-sm">{expanded ? '▾' : '▸'}</span>
        </div>
      </div>

      {/* Expanded guest list */}
      {expanded && (
        <div className="border-t bg-gray-50">
          {group.guests.length === 0 ? (
            <div className="px-5 py-4 text-sm text-gray-400">No guests with email in this group.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-white">
                  <th className="text-left px-5 py-2 font-medium text-gray-600 text-xs uppercase tracking-wide">Guest</th>
                  <th className="text-left px-5 py-2 font-medium text-gray-600 text-xs uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-2 font-medium text-gray-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-2 font-medium text-gray-600 text-xs uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {group.guests.map(guest => {
                  const isSending = sendingGuestId === guest.guest_id;
                  const isResetting = resettingGuestId === guest.guest_id;
                  const canSend = !guest.showcase_opted_out && !!group.pdf_url && group.book_status === 'printed';

                  return (
                    <tr key={guest.guest_id} className="border-b last:border-b-0 hover:bg-white transition">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {guest.guest_name}
                          <button
                            onClick={() => window.open(
                              `/api/v1/admin/pdf-delivery/preview-email?group_id=${group.group_id}&guest_name=${encodeURIComponent(guest.guest_name)}`,
                              '_blank'
                            )}
                            className="text-xs text-gray-300 hover:text-gray-500 underline transition-colors shrink-0"
                          >
                            preview
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{guest.guest_email}</td>
                      <td className="px-5 py-3">
                        {guest.showcase_opted_out ? (
                          <span className="text-xs text-gray-400">Opted out</span>
                        ) : guest.pdf_sent_at ? (
                          <span className="text-xs text-green-600 font-medium">
                            Sent {new Date(guest.pdf_sent_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600">Not sent</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {guest.showcase_opted_out ? null : guest.pdf_sent_at ? (
                          <button
                            onClick={() => onReset(group.group_id, guest)}
                            disabled={isResetting}
                            className="text-xs text-gray-400 hover:text-red-500 underline transition-colors"
                          >
                            {isResetting ? 'Resetting...' : 'Reset'}
                          </button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!canSend || isSending}
                            onClick={() => onSend(group, guest)}
                            className={canSend ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 border border-gray-200'}
                          >
                            {isSending ? 'Sending...' : 'Send PDF'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {group.pdf_url && (
            <div className="px-5 py-3 border-t flex items-center gap-3">
              <span className="text-xs text-gray-400">PDF:</span>
              <Button
                size="sm"
                variant="outline"
                disabled={uploadingGroupId === group.group_id}
                onClick={() => onUpload(group.group_id)}
                className="text-xs"
              >
                Replace PDF
              </Button>
              <button
                onClick={() => window.open(
                  `/api/v1/admin/pdf-delivery/preview-email?group_id=${group.group_id}`,
                  '_blank'
                )}
                className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
              >
                Preview email
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
