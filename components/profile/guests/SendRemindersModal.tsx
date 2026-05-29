"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { X, Loader2, Check, ChevronLeft } from "lucide-react";
import { getGuestsByGroup } from "@/lib/supabase/guests";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { Guest } from "@/lib/types/database";

interface SendRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

const DEFAULT_REMINDER_BODY = `Thanks to everyone who has already sent a recipe. The book is starting to come together.

If you haven't yet, the page is still open and we'd love yours. It only takes 5 minutes. Doesn't have to be fancy. Just something you actually make.`;

function daysAgo(dateString: string | null): string {
  if (!dateString) return "";
  const ms = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function SendRemindersModal({ isOpen, onClose, groupId }: SendRemindersModalProps) {
  const [view, setView] = useState<"compose" | "recipients">("compose");
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

  // Reason: show every guest with a valid email who already got the first
  // invitation. Recipe-submitted ones show with a badge so the organizer
  // can decide whether to include them. Backend still caps at 4 emails per
  // guest — if hit, the send fails silently for that one.
  const visibleGuests = useMemo(
    () =>
      guests
        .filter((g) => hasValidEmail(g) && g.invitation_started_at)
        .sort((a, b) => {
          // Reason: pending first (the ones the organizer probably wants to nudge),
          // submitted at the bottom (lighter priority but still visible).
          const aHasRecipe = (a.recipes_received || 0) > 0;
          const bHasRecipe = (b.recipes_received || 0) > 0;
          if (aHasRecipe !== bHasRecipe) return aHasRecipe ? 1 : -1;
          // Among pending: oldest contact first
          const aTime = a.last_email_sent_at ? new Date(a.last_email_sent_at).getTime() : 0;
          const bTime = b.last_email_sent_at ? new Date(b.last_email_sent_at).getTime() : 0;
          return aTime - bTime;
        }),
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
      setView("compose");
    }
    if (!isOpen) {
      setSelectedIds(new Set());
    }
  }, [isOpen, groupId, loadGuests, loadBody]);

  // Reason: pre-check only guests who haven't submitted a recipe yet — those
  // are the ones the organizer probably wants to nudge. Submitted ones stay
  // visible but unchecked so they don't get a reminder by accident.
  useEffect(() => {
    if (!loading && isOpen && visibleGuests.length > 0 && selectedIds.size === 0) {
      setSelectedIds(
        new Set(
          visibleGuests
            .filter((g) => (g.recipes_received || 0) === 0)
            .map((g) => g.id)
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isOpen, visibleGuests.length]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleGuests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleGuests.map((g) => g.id)));
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
    // for the batch. Rate-limit guard caps it anyway.
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

  const allSelected = selectedIds.size === visibleGuests.length && visibleGuests.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 ">
          {view === "recipients" ? (
            <button
              onClick={() => setView("compose")}
              className="flex items-center gap-1.5 text-sm text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] transition-colors"
              type="button"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <h3 className="type-modal-title text-[hsl(var(--brand-charcoal))]">
              Send an email reminder
            </h3>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {view === "compose" ? (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <p className="text-gray-600 text-base leading-relaxed">
              You can send an email reminder to everyone you&apos;ve invited who hasn&apos;t sent a recipe yet.
            </p>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={handleBodyBlur}
              rows={6}
              className="w-full p-4 bg-gray-50 border border-[hsl(var(--brand-border))] rounded-lg shadow-sm resize-none focus:outline-none focus:border-[hsl(var(--brand-honey))] focus:ring-1 focus:ring-[hsl(var(--brand-honey))] focus:bg-white text-sm text-[hsl(var(--brand-charcoal))] leading-relaxed transition-colors"
              placeholder={DEFAULT_REMINDER_BODY}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-[420px] px-6 py-5 flex flex-col">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : visibleGuests.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-[hsl(var(--brand-warm-gray))]">
                  No one to remind yet. Send the first invitation first.
                </p>
              </div>
            ) : (
              <>
                {/* Sticky select-all stays visible while list scrolls below */}
                <label className="flex items-center gap-2.5 mb-3 cursor-pointer text-sm pb-3 border-b border-gray-100 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))]"
                  />
                  <span className="text-[hsl(var(--brand-charcoal))] font-medium">
                    Select all {visibleGuests.length}
                  </span>
                </label>

                <ul className="space-y-1 flex-1 overflow-y-auto -mx-2 px-2">
                  {visibleGuests.map((guest) => {
                    const checked = selectedIds.has(guest.id);
                    const hasRecipe = (guest.recipes_received || 0) > 0;
                    const lastSentLabel = daysAgo(guest.last_email_sent_at);
                    return (
                      <li key={guest.id}>
                        <label className="flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
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
                          {hasRecipe ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[hsl(var(--brand-honey))]/10 text-[hsl(var(--brand-honey))] flex-shrink-0">
                              <Check className="w-2.5 h-2.5" />
                              Recipe received
                            </span>
                          ) : lastSentLabel ? (
                            <span className="text-[11px] text-[hsl(var(--brand-warm-gray))] flex-shrink-0">
                              {lastSentLabel}
                            </span>
                          ) : null}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4">
          {view === "compose" ? (
            <>
              {sendResult && (
                <div
                  className={`mb-3 p-2.5 rounded-lg text-sm flex items-center gap-2 ${
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

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setView("recipients")}
                  className="text-sm text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] underline underline-offset-2 transition-colors"
                >
                  Recipients ({selectedIds.size})
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-[hsl(var(--brand-charcoal))] hover:bg-gray-50 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={selectedIds.size === 0 || isSending}
                    className="px-5 py-2 rounded-full bg-[hsl(var(--brand-honey))] hover:bg-[hsl(var(--brand-honey-dark))] text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setView("compose")}
                className="px-5 py-2 rounded-full bg-[hsl(var(--brand-charcoal))] hover:bg-black text-white font-medium text-sm transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
