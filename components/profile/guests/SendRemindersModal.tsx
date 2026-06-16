"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Loader2, Check, ChevronLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  // Responsive hook to detect mobile — drives Sheet (mobile) vs Dialog (desktop)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640); // sm breakpoint
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [view, setView] = useState<"compose" | "preview" | "recipients">("compose");
  const [coupleName, setCoupleName] = useState("The Couple");
  const [emailSubject, setEmailSubject] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [body, setBody] = useState<string>(DEFAULT_REMINDER_BODY);
  const [bodyLoaded, setBodyLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

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
      .select("email_reminder_message, couple_first_name, partner_first_name, name, occasion")
      .eq("id", groupId)
      .single();
    if (data?.email_reminder_message) {
      setBody(data.email_reminder_message);
    }
    // Reason: same source the /remind route uses (Book Name first), so the
    // preview's "From"/signature match the real email exactly. First names are
    // only a fallback for legacy rows with no name.
    if (data) {
      const names = data.name
        || [data.couple_first_name, data.partner_first_name].filter(Boolean).join(" & ")
        || "The Couple";
      setCoupleName(names);

      // Reason: mirror invitationEmail2()'s occasion-aware subject so the
      // preview's Subject line matches what actually lands in the inbox.
      const namesArePeople = Boolean(data.couple_first_name || data.partner_first_name);
      const isWedding = !data.occasion || data.occasion === "wedding" || data.occasion === "bridal_shower";
      const isPerson = isWedding || namesArePeople;
      setEmailSubject(
        isPerson
          ? `Reminder: your recipe for ${names}'s cookbook`
          : `Reminder: your recipe for ${names}`
      );
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

  const handleSave = async () => {
    if (!bodyLoaded || isSaving) return;
    setIsSaving(true);
    await fetch(`/api/v1/groups/${groupId}/event-details`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_reminder_message: body }),
    });
    setIsSaving(false);
    setJustSaved(true);
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

  const allSelected = selectedIds.size === visibleGuests.length && visibleGuests.length > 0;

  // Reason: Save/Send button contents (with their loading/saved states) are reused
  // by both the mobile and desktop footer layouts, so the logic lives in one place.
  const saveLabel = isSaving ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      Saving…
    </>
  ) : justSaved ? (
    <>
      <Check className="w-4 h-4" />
      Saved
    </>
  ) : (
    "Save"
  );

  const sendLabel = isSending ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      Sending…
    </>
  ) : (
    "Send"
  );

  const titleText =
    view === "recipients"
      ? "Choose who to remind"
      : view === "preview"
        ? "Email preview"
        : "Send an email reminder";

  // Reason: split the live textarea on blank lines the same way invitationEmail2
  // does, so the preview paragraphs match the real email.
  const previewParagraphs = (body.trim() || DEFAULT_REMINDER_BODY)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Body + footer are identical across mobile (Sheet) and desktop (Dialog);
  // only the surrounding container changes, so build them once here.
  const bodyContent = (
    <>
        {/* Body */}
        {view === "compose" ? (
          <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6 py-1 flex flex-col gap-4">
            <p className="text-gray-600 text-base leading-relaxed flex-shrink-0">
              You can send an email reminder to everyone you&apos;ve invited who hasn&apos;t sent a recipe yet.
            </p>

            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                // Reason: once the text changes the saved state is stale,
                // so drop the "Saved" confirmation until they save again.
                if (justSaved) setJustSaved(false);
              }}
              className="w-full flex-1 min-h-[200px] p-4 bg-gray-50 border border-[hsl(var(--brand-border))] rounded-lg shadow-sm resize-none focus:outline-none focus:border-[hsl(var(--brand-honey))] focus:ring-1 focus:ring-[hsl(var(--brand-honey))] focus:bg-white text-base text-[hsl(var(--brand-charcoal))] leading-relaxed transition-colors"
              placeholder={DEFAULT_REMINDER_BODY}
            />
          </div>
        ) : view === "preview" ? (
          <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6 py-1 flex flex-col">
            {/* Back to compose */}
            <button
              type="button"
              onClick={() => setView("compose")}
              className="flex items-center gap-1.5 text-sm text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] transition-colors mb-4 flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {/* Email preview card — mirrors invitationEmail2() layout so the
                organizer sees exactly what lands in the inbox, with their live
                body. From/Subject header matches the Send Invitations preview. */}
            <div className="bg-[hsl(var(--brand-cream))] rounded-xl p-4 sm:p-6 flex justify-center">
              <div className="w-full max-w-[460px] rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(45,45,45,0.08)] text-left">
                {/* Header bar */}
                <div className="bg-brand-charcoal text-center py-2.5">
                  <span className="text-sm font-medium text-white tracking-wide">New Email</span>
                </div>

                {/* From / Subject rows */}
                <div className="bg-white border-b border-brand-sand">
                  <div className="px-5 py-2.5 border-b border-brand-sand">
                    <p className="text-sm">
                      <span className="text-[hsl(var(--brand-warm-gray-light))]">From:</span>{" "}
                      <span className="text-brand-charcoal">{coupleName}</span>
                    </p>
                  </div>
                  <div className="px-5 py-2.5">
                    <p className="text-sm">
                      <span className="text-[hsl(var(--brand-warm-gray-light))]">Subject:</span>{" "}
                      <span className="text-brand-charcoal">{emailSubject}</span>
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="bg-white p-6 sm:p-9">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://smallplatesandcompany.com/images/SmallPlates_logo_horizontal1.png"
                    alt="Small Plates & Co."
                    className="h-4 w-auto mb-7"
                  />
                  <p className="text-[15px] text-[hsl(var(--brand-charcoal))] leading-[1.7] mb-5">
                    Hello,
                  </p>
                  {previewParagraphs.map((p, i) => (
                    <p
                      key={i}
                      className="text-[15px] text-[#555555] leading-[1.7] mb-5 whitespace-pre-line"
                    >
                      {p}
                    </p>
                  ))}
                  <span className="inline-block bg-[hsl(var(--brand-honey))] text-white text-sm font-medium px-7 py-3 rounded-full mt-1 mb-2">
                    Add Your Recipe
                  </span>
                  <p className="text-[12px] text-[#9A9590] leading-[1.5] mb-7">Or copy this link</p>
                  <p className="text-[15px] text-[#555555] leading-[1.7] mb-1">Thanks,</p>
                  <p className="text-[15px] text-[hsl(var(--brand-charcoal))] leading-[1.7]">{coupleName}</p>
                  <div className="border-t border-[#F0EDE8] mt-9 pt-5">
                    <p className="text-[12px] text-[#9A9590] leading-[1.6]">
                      Something off? Just reply to this email.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-[420px] -mx-6 px-6 py-1 flex flex-col">
            {/* Back to compose */}
            <button
              type="button"
              onClick={() => setView("compose")}
              className="flex items-center gap-1.5 text-sm text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] transition-colors mb-4 flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

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
    </>
  );

  const footerContent = (
    <>
        {/* Footer */}
        {view === "compose" ? (
          <div className="flex-shrink-0">
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

            {/* Mobile: Send as the one big button, secondary actions as text links */}
            <div className="sm:hidden space-y-4">
              <button
                onClick={handleSend}
                disabled={selectedIds.size === 0 || isSending}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-charcoal px-6 py-3 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sendLabel}
              </button>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] transition-colors disabled:opacity-40"
                >
                  {saveLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setView("preview")}
                  className="text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] underline underline-offset-2 transition-colors"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setView("recipients")}
                  className="text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] underline underline-offset-2 transition-colors"
                >
                  Recipients ({selectedIds.size})
                </button>
              </div>
            </div>

            {/* Desktop: Recipients link on the left, buttons on the right */}
            <div className="hidden sm:flex sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setView("preview")}
                  className="text-sm text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] underline underline-offset-2 transition-colors"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setView("recipients")}
                  className="text-sm text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] underline underline-offset-2 transition-colors"
                >
                  Recipients ({selectedIds.size})
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-[rgba(45,45,45,0.14)] px-6 py-3 text-[15px] font-medium text-brand-charcoal transition-colors hover:bg-[rgba(45,45,45,0.03)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.18)] focus-visible:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 rounded-full border border-[rgba(45,45,45,0.22)] px-6 py-3 text-[15px] font-medium text-brand-charcoal transition-colors hover:bg-[rgba(45,45,45,0.03)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.18)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saveLabel}
                </button>
                <button
                  onClick={handleSend}
                  disabled={selectedIds.size === 0 || isSending}
                  className="flex items-center justify-center gap-2 rounded-full bg-brand-charcoal px-6 py-3 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sendLabel}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-end flex-shrink-0">
            <button
              type="button"
              onClick={() => setView("compose")}
              className="rounded-full bg-brand-charcoal px-6 py-3 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2"
            >
              Done
            </button>
          </div>
        )}
    </>
  );

  // Mobile: Sheet that slides up from the bottom — matches other dashboard modals
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="!h-[90vh] !max-h-[90vh] rounded-t-[20px] flex flex-col overflow-hidden p-0"
        >
          <div className="px-6 pt-6 pb-6 flex flex-col h-full overflow-hidden">
            <SheetHeader className="px-0 flex-shrink-0 mb-3 text-left">
              <SheetTitle className="type-modal-title">{titleText}</SheetTitle>
            </SheetHeader>
            <div className="flex-1 flex flex-col overflow-hidden">{bodyContent}</div>
            <div
              className="flex-shrink-0 pt-4"
              style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
            >
              {footerContent}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: centered Dialog popup
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="type-modal-title">{titleText}</DialogTitle>
        </DialogHeader>
        {bodyContent}
        {footerContent}
      </DialogContent>
    </Dialog>
  );
}
