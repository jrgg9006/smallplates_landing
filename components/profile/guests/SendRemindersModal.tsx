"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { X, Send, Loader2, Check, AlertCircle, Bell } from "lucide-react";
import { getGuestsByGroup } from "@/lib/supabase/guests";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { Guest } from "@/lib/types/database";

interface SendRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

const DEFAULT_REMINDER_BODY = `Just a friendly nudge — the recipe page is still open and we'd love yours in the cookbook.

It only takes 5 minutes. Doesn't have to be fancy — just something you actually make.`;

function daysAgo(dateString: string | null): string {
  if (!dateString) return "";
  const ms = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

export function SendRemindersModal({ isOpen, onClose, groupId }: SendRemindersModalProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [body, setBody] = useState<string>(DEFAULT_REMINDER_BODY);
  const [bodyLoaded, setBodyLoaded] = useState(false);

  const hasValidEmail = (guest: Guest) =>
    guest.email &&
    guest.email.trim() !== "" &&
    !guest.email.startsWith("NO_EMAIL_");

  // Reason: only show guests who were invited (emails_sent_count >= 1)
  // AND haven't submitted a recipe AND haven't hit the per-guest cap (4).
  const eligibleGuests = useMemo(
    () =>
      guests
        .filter(
          (g) =>
            hasValidEmail(g) &&
            g.invitation_started_at &&
            (g.recipes_received || 0) === 0 &&
            (g.emails_sent_count || 0) < 4
        )
        .sort((a, b) => {
          // Reason: oldest contact first — those are the ones who most need a nudge
          const aTime = a.last_email_sent_at ? new Date(a.last_email_sent_at).getTime() : 0;
          const bTime = b.last_email_sent_at ? new Date(b.last_email_sent_at).getTime() : 0;
          return aTime - bTime;
        }),
    [guests]
  );

  const submittedCount = useMemo(
    () => guests.filter((g) => (g.recipes_received || 0) > 0).length,
    [guests]
  );

  const loadGuests = useCallback(async () => {
    setLoading(true);
    const { data } = await getGuestsByGroup(groupId);
    if (data) setGuests(data);
    setLoading(false);
  }, [groupId]);

  const loadBody = useCallback(async () => {
    const supabase = createSupabaseClient();
    const { data } = await supabase
      .from("groups")
      .select("email_reminder_message")
      .eq("id", groupId)
      .single();
    if (data?.email_reminder_message) {
      setBody(data.email_reminder_message);
    }
    setBodyLoaded(true);
  }, [groupId]);

  useEffect(() => {
    if (isOpen && groupId) {
      loadGuests();
      loadBody();
      setSendResult(null);
    }
    if (!isOpen) {
      setSelectedIds(new Set());
    }
  }, [isOpen, groupId, loadGuests, loadBody]);

  // Reason: pre-check everyone eligible so it's one-click-to-all by default
  useEffect(() => {
    if (!loading && isOpen && eligibleGuests.length > 0 && selectedIds.size === 0) {
      setSelectedIds(new Set(eligibleGuests.map((g) => g.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isOpen, eligibleGuests.length]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === eligibleGuests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligibleGuests.map((g) => g.id)));
    }
  };

  const handleBodyBlur = async () => {
    if (!bodyLoaded) return;
    await fetch(`/api/v1/groups/${groupId}/event-details`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_reminder_message: body }),
    });
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) return;
    setIsSending(true);
    setSendResult(null);

    // Reason: save body so all reminders use the latest text
    await fetch(`/api/v1/groups/${groupId}/event-details`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_reminder_message: body }),
    });

    let sent = 0;
    let failed = 0;
    // Reason: the existing /remind endpoint sends one guest at a time. Loop here
    // for the batch. This is slow for large lists but the rate-limit guard caps
    // it anyway. If perf becomes an issue, add a batch endpoint.
    for (const guestId of Array.from(selectedIds)) {
      try {
        const res = await fetch("/api/v1/guests/remind", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId, groupId }),
        });
        if (res.ok) sent++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setSendResult({ sent, failed });
    setSelectedIds(new Set());
    await loadGuests();
    setIsSending(false);
  };

  if (!isOpen) return null;

  const allSelected = selectedIds.size === eligibleGuests.length && eligibleGuests.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-[hsl(var(--brand-honey))]" />
            <h3 className="type-modal-title text-[hsl(var(--brand-charcoal))]">
              Send reminders
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <p className="text-sm text-[hsl(var(--brand-warm-gray))] leading-relaxed">
            A friendly nudge to guests who haven&apos;t mailed in a recipe yet. The couple&apos;s photo, name, and the &quot;Add Your Recipe&quot; button are added automatically.
          </p>

          {/* Editable body */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--brand-warm-gray))] mb-2 block">
              Your reminder message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={handleBodyBlur}
              rows={5}
              className="w-full p-3 bg-[hsl(var(--brand-warm-white))] border border-[hsl(var(--brand-border))] rounded-lg resize-none focus:outline-none focus:border-[hsl(var(--brand-honey))] focus:ring-1 focus:ring-[hsl(var(--brand-honey))] text-sm text-[hsl(var(--brand-charcoal))] leading-relaxed"
              placeholder={DEFAULT_REMINDER_BODY}
            />
            <p className="text-[11px] text-[hsl(var(--brand-warm-gray))] mt-1">
              Saved automatically.
            </p>
          </div>

          {/* Recipients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--brand-warm-gray))]">
                Recipients
              </label>
              {submittedCount > 0 && (
                <span className="text-[11px] text-[hsl(var(--brand-warm-gray))] flex items-center gap-1">
                  <Check className="w-3 h-3 text-[hsl(var(--brand-honey))]" />
                  {submittedCount} already submitted
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : eligibleGuests.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[hsl(var(--brand-border))] rounded-lg">
                <p className="text-sm text-[hsl(var(--brand-warm-gray))]">
                  No guests need a reminder right now.
                </p>
                <p className="text-[11px] text-[hsl(var(--brand-warm-gray))] mt-1">
                  This list only shows guests who were emailed an invite and haven&apos;t submitted yet.
                </p>
              </div>
            ) : (
              <>
                <label className="flex items-center gap-2 mb-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))]"
                  />
                  <span className="text-[hsl(var(--brand-charcoal))] font-medium">
                    Select all {eligibleGuests.length}
                  </span>
                </label>

                <ul className="space-y-1 max-h-[280px] overflow-y-auto -mx-1 px-1">
                  {eligibleGuests.map((guest) => {
                    const checked = selectedIds.has(guest.id);
                    const lastSentLabel = daysAgo(guest.last_email_sent_at);
                    const reminderCount = (guest.emails_sent_count || 1) - 1;
                    return (
                      <li key={guest.id}>
                        <label
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                            checked
                              ? "bg-[hsl(var(--brand-honey))]/10"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelect(guest.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[hsl(var(--brand-charcoal))] truncate">
                              {guest.first_name} {guest.last_name || ""}
                            </p>
                            <p className="text-[11px] text-[hsl(var(--brand-warm-gray))] truncate">
                              {guest.email}
                            </p>
                          </div>
                          <div className="text-[11px] text-[hsl(var(--brand-warm-gray))] text-right flex-shrink-0">
                            <p>Last sent {lastSentLabel}</p>
                            {reminderCount > 0 && (
                              <p className="text-amber-700 flex items-center gap-1 justify-end">
                                <AlertCircle className="w-3 h-3" />
                                {reminderCount} reminder{reminderCount === 1 ? "" : "s"} already
                              </p>
                            )}
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          {sendResult && (
            <div
              className={`mb-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                sendResult.failed === 0
                  ? "bg-green-50 text-green-800"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>
                {sendResult.sent > 0 && `Sent ${sendResult.sent} reminder${sendResult.sent === 1 ? "" : "s"}`}
                {sendResult.sent > 0 && sendResult.failed > 0 && " · "}
                {sendResult.failed > 0 && `${sendResult.failed} failed`}
              </span>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={selectedIds.size === 0 || isSending}
            className="w-full min-h-[44px] rounded-full bg-[hsl(var(--brand-honey))] hover:bg-[hsl(var(--brand-honey-dark))] text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send {selectedIds.size > 0 ? `to ${selectedIds.size} guests` : "reminders"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
