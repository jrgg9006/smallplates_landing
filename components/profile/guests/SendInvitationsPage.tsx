"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Mail,
  Check,
  Loader2,
  ChevronLeft,
  Plus,
  X,
  Pencil,
} from "lucide-react";
import { getGuestsByGroup, updateGuest, addGuest } from "@/lib/supabase/guests";
import { getGroupById } from "@/lib/supabase/groups";
import type { Guest } from "@/lib/types/database";

const DEFAULT_BODY = `We're making them a cookbook. A real one. With recipes from the people who matter most to them.

Send a recipe and you're in their kitchen.

Doesn't have to be fancy. Just has to be yours.`;

const MAX_BODY_CHARS = 500;

interface SendInvitationsPageProps {
  groupId: string;
  coupleNames: string;
  // Reason: drives occasion-aware copy so the preview matches the actual email
  // (wedding vs neutral). Mirrors groups.occasion.
  occasion?: string | null;
  coupleImageUrl?: string | null;
  collectionUrl?: string | null;
  senderName?: string | null;
  onBack: () => void;
  onOpenGuestSheet: () => void;
}

export function SendInvitationsPage({
  groupId,
  coupleNames,
  occasion = null,
  coupleImageUrl,
  collectionUrl,
  senderName,
  onBack,
  onOpenGuestSheet,
}: SendInvitationsPageProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
  } | null>(null);
  const [showAddEmails, setShowAddEmails] = useState(false);
  const [emailDrafts, setEmailDrafts] = useState<Record<string, string>>({});
  const [isSavingEmails, setIsSavingEmails] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [newGuestFirst, setNewGuestFirst] = useState("");
  const [newGuestLast, setNewGuestLast] = useState("");
  const [newGuestPrintedName, setNewGuestPrintedName] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [isSavingGuest, setIsSavingGuest] = useState(false);
  const [bodyMessage, setBodyMessage] = useState(DEFAULT_BODY);
  const [bodySaved, setBodySaved] = useState(false);

  const loadGuests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getGuestsByGroup(groupId);
    if (!error && data) {
      setGuests(data);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      loadGuests();
      setSendResult(null);
      setSelectedIds(new Set());
      // Reason: Load any saved custom body so the textarea shows what's already persisted
      getGroupById(groupId).then(({ data }) => {
        if (data?.email_invite_message) {
          setBodyMessage(data.email_invite_message);
        }
      });
    }
  }, [groupId, loadGuests]);

  const handleSaveBody = async () => {
    const trimmed = bodyMessage.trim();
    // Reason: Don't save if it's the default — keeps the column NULL so the
    // template renders the default copy via its own fallback.
    const valueToSave = trimmed === DEFAULT_BODY.trim() ? null : trimmed;
    try {
      await fetch(`/api/v1/groups/${groupId}/event-details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_invite_message: valueToSave }),
      });
      setBodySaved(true);
      setTimeout(() => setBodySaved(false), 1500);
    } catch {
      // Silently fail — user can retry
    }
  };

  // Reason: Filter guests with valid emails (not null, not empty, not NO_EMAIL_ prefix)
  const hasValidEmail = (guest: Guest) =>
    guest.email &&
    guest.email.trim() !== "" &&
    !guest.email.startsWith("NO_EMAIL_");

  const uninvitedGuests = useMemo(
    () => guests.filter((g) => !g.invitation_started_at && hasValidEmail(g)),
    [guests]
  );

  // Reason: Guests without email need a warning banner
  const guestsWithoutEmail = useMemo(
    () =>
      guests.filter(
        (g) => !g.invitation_started_at && !hasValidEmail(g)
      ),
    [guests]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === uninvitedGuests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(uninvitedGuests.map((g) => g.id)));
    }
  };

  const handleSendInvitations = async () => {
    if (selectedIds.size === 0) return;
    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch("/api/v1/guests/send-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestIds: Array.from(selectedIds),
          groupId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSendResult({ sent: data.sent, failed: data.failed });
        // Reason: Auto-dismiss success toast after 4 seconds
        setTimeout(() => setSendResult(null), 4000);
        setSelectedIds(new Set());
        await loadGuests();
      } else {
        setSendResult({ sent: 0, failed: selectedIds.size });
      }
    } catch {
      setSendResult({ sent: 0, failed: selectedIds.size });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveEmails = async () => {
    // Reason: Only save entries where user actually typed a valid-looking email
    const toSave = Object.entries(emailDrafts).filter(
      ([, email]) => email.trim() && email.includes("@")
    );
    if (toSave.length === 0) return;

    setIsSavingEmails(true);
    for (const [guestId, email] of toSave) {
      await updateGuest(guestId, { email: email.trim() });
    }
    setIsSavingEmails(false);
    setShowAddEmails(false);
    setEmailDrafts({});
    await loadGuests();
  };

  const handleSaveGuest = async () => {
    if (!newGuestFirst.trim()) return;
    setIsSavingGuest(true);
    await addGuest({
      first_name: newGuestFirst.trim(),
      last_name: newGuestLast.trim() || undefined,
      printed_name: newGuestPrintedName.trim() || undefined,
      email: newGuestEmail.trim() || undefined,
      group_id: groupId,
    });
    setIsSavingGuest(false);
    setShowAddGuest(false);
    setNewGuestFirst("");
    setNewGuestLast("");
    setNewGuestPrintedName("");
    setNewGuestEmail("");
    await loadGuests();
  };

  const resetAddGuest = () => {
    setShowAddGuest(false);
    setNewGuestFirst("");
    setNewGuestLast("");
    setNewGuestPrintedName("");
    setNewGuestEmail("");
  };

  // Reason: keep this preview in sync with the actual email (invitation-templates.ts).
  // Couples (wedding/bridal/anniversary, plus legacy groups with no occasion) take a
  // possessive and a "gift for {people}" framing; weddings/bridal showers say "wedding
  // cookbook". Non-couple occasions hold a book title, so they drop both.
  const isCouple =
    !occasion || occasion === 'wedding' || occasion === 'bridal_shower' || occasion === 'anniversary';
  const isWedding = !occasion || occasion === 'wedding' || occasion === 'bridal_shower';
  // Reason: only weddings/bridal showers keep "... for {couple}"; everything else
  // uses the neutral "A cookbook gift" with the name/title on its own line.
  const heroLabel = isWedding ? 'A wedding cookbook gift for' : 'A cookbook gift';
  const emailSubject = isCouple
    ? `Your recipe goes in ${coupleNames}'s cookbook`
    : `Your recipe goes in ${coupleNames}`;

  return (
    <div>
      {/* Top bar — Back on left, Add Recipients title on right */}
      <div className="border-b border-brand-sand flex">
        {/* Left side of top bar (aligned with email preview column) */}
        <div className="flex-1 lg:w-[68%] lg:flex-none px-6 lg:px-10 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-base font-medium text-brand-charcoal hover:text-[hsl(var(--brand-warm-gray-light))] transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={2} />
            Back
          </button>
        </div>
        {/* Right side of top bar (aligned with recipients column) */}
        <div className="hidden lg:flex items-center justify-between lg:w-[32%] lg:flex-none px-8 border-l border-brand-sand">
          {showAddEmails ? (
            <>
              <h2 className="font-serif text-xl font-semibold text-brand-charcoal">
                Add Email Addresses
              </h2>
              <button
                onClick={() => {
                  setShowAddEmails(false);
                  setEmailDrafts({});
                }}
                className="text-[hsl(var(--brand-warm-gray-light))] hover:text-brand-charcoal transition-colors"
              >
                <X size={18} />
              </button>
            </>
          ) : showAddGuest ? (
            <>
              <h2 className="font-serif text-xl font-semibold text-brand-charcoal">
                Add a Guest
              </h2>
              <button
                onClick={resetAddGuest}
                className="text-[hsl(var(--brand-warm-gray-light))] hover:text-brand-charcoal transition-colors"
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <>
              <h2 className="font-serif text-xl font-semibold text-brand-charcoal">
                Add Recipients
              </h2>
              <button
                onClick={() => setShowAddGuest(true)}
                className="flex items-center gap-1.5 text-[15px] text-[hsl(var(--brand-warm-gray-light))] hover:text-brand-charcoal transition-colors"
              >
                <Plus size={15} />
                Add guests
              </button>
            </>
          )}
        </div>
      </div>

      {/* Two-column layout — full width, fixed to remaining viewport height */}
      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-57px)]">
        {/* ── Left column: Email Preview (scrolls independently) ── */}
        <div className="lg:w-[68%] bg-[#F5F5F4] lg:overflow-y-auto flex items-start justify-center p-8 lg:p-12">
          <div className="w-full max-w-[560px]">
          {/* Hint: upload couple image */}
          {!coupleImageUrl && (
            <p className="text-xs text-[hsl(var(--brand-warm-gray-light))] mb-4 text-center">
              Want to add a photo to the email? Upload one in your{" "}
              <button onClick={onBack} className="underline hover:text-brand-charcoal transition-colors">
                Collect Recipes settings
              </button>.
            </p>
          )}

          {/* Email card container */}
          <div className="w-full max-w-[560px] rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* Header bar */}
            <div className="bg-brand-charcoal text-center py-2.5">
              <span className="text-sm font-medium text-white tracking-wide">
                New Email
              </span>
            </div>

            {/* From / Subject rows */}
            <div className="bg-white border-b border-brand-sand">
              <div className="px-6 py-2.5 border-b border-brand-sand">
                <p className="text-sm">
                  <span className="text-[hsl(var(--brand-warm-gray-light))]">From:</span>{" "}
                  <span className="text-brand-charcoal">{coupleNames}</span>
                </p>
              </div>
              <div className="px-6 py-2.5">
                <p className="text-sm">
                  <span className="text-[hsl(var(--brand-warm-gray-light))]">Subject:</span>{" "}
                  <span className="text-brand-charcoal">{emailSubject}</span>
                </p>
              </div>
            </div>

            {/* Email body */}
            <div className="bg-white px-8 lg:px-14 py-12 lg:py-16 text-center">
              {/* Couple names — the hero */}
              <p className="text-xs tracking-[0.25em] uppercase text-[hsl(var(--brand-warm-gray-light))] mb-3">
                {heroLabel}
              </p>
              <h2 className="font-serif text-3xl lg:text-4xl text-brand-charcoal leading-tight mb-3">
                {coupleNames}
              </h2>
              <div className="w-12 h-px bg-brand-honey mx-auto mb-10" />

              {/* Couple image — subtle, rectangular */}
              {coupleImageUrl && (
                <div className="flex justify-center mb-10">
                  <div className="w-[140px] h-[140px] rounded-2xl overflow-hidden">
                    <img
                      src={coupleImageUrl}
                      alt={coupleNames}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Body copy — editable, auto-saves on blur */}
              <div className="max-w-[380px] mx-auto mb-10">
                <div className="relative group">
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] uppercase tracking-wider text-[hsl(var(--brand-warm-gray-light))] pointer-events-none">
                    <Pencil size={10} />
                    <span>Editable</span>
                  </div>
                  <textarea
                    value={bodyMessage}
                    onChange={(e) => setBodyMessage(e.target.value.slice(0, MAX_BODY_CHARS))}
                    onBlur={handleSaveBody}
                    rows={6}
                    maxLength={MAX_BODY_CHARS}
                    className="w-full text-[15px] text-[#666666] leading-relaxed text-center bg-[hsl(var(--brand-cream))] border border-dashed border-brand-sand hover:border-brand-honey/60 focus:border-brand-honey focus:bg-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-honey/20 rounded-lg transition-all px-5 py-6"
                    placeholder="Write a quick note to your guests..."
                  />
                </div>
                <div className="flex items-center justify-between mt-2 px-2 text-[11px] text-[hsl(var(--brand-warm-gray-light))]">
                  <span>
                    {bodySaved ? (
                      <span className="text-brand-honey inline-flex items-center gap-1">
                        <Check size={10} /> Saved automatically
                      </span>
                    ) : (
                      "Click anywhere in the box to edit"
                    )}
                  </span>
                  <span>{bodyMessage.length}/{MAX_BODY_CHARS}</span>
                </div>
              </div>

              {/* CTA button */}
              {collectionUrl ? (
                <a
                  href={collectionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-10 py-3.5 bg-brand-charcoal text-white text-xs font-medium rounded tracking-[0.15em] uppercase hover:bg-[#444] transition-colors"
                >
                  Add Your Recipe
                </a>
              ) : (
                <span className="inline-block px-10 py-3.5 bg-brand-charcoal text-white text-xs font-medium rounded tracking-[0.15em] uppercase">
                  Add Your Recipe
                </span>
              )}

              {/* Sub-text */}
              <p className="text-xs text-[hsl(var(--brand-warm-gray-light))] mt-5">
                5 minutes. That&apos;s it.
              </p>

              {/* Divider + logo footer */}
              <div className="mt-12 pt-6 border-t border-brand-sand space-y-4">
                <img
                  src="/images/logo_svg/SmallPlates_logo_horizontal.svg"
                  alt="Small Plates & Co."
                  className="h-3.5 mx-auto opacity-40"
                />
                {senderName && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-[hsl(var(--brand-warm-gray-light))]">
                      This invitation was sent by {senderName} via Small Plates &amp; Co.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* ── Right column: Recipients (fixed height, internal scroll) ── */}
        <div className="lg:w-[32%] bg-white border-t lg:border-t-0 lg:border-l border-brand-sand flex flex-col lg:h-full lg:overflow-hidden">
          {/* Mobile-only title (on desktop it's in the top bar) */}
          <div className="lg:hidden px-6 pt-6 flex items-center justify-between mb-4">
            {showAddEmails ? (
              <>
                <h2 className="font-serif text-lg text-brand-charcoal">
                  Add Email Addresses
                </h2>
                <button
                  onClick={() => {
                    setShowAddEmails(false);
                    setEmailDrafts({});
                  }}
                  className="text-[hsl(var(--brand-warm-gray-light))] hover:text-brand-charcoal transition-colors"
                >
                  <X size={18} />
                </button>
              </>
            ) : showAddGuest ? (
              <>
                <h2 className="font-serif text-lg text-brand-charcoal">
                  Add a Guest
                </h2>
                <button
                  onClick={resetAddGuest}
                  className="text-[hsl(var(--brand-warm-gray-light))] hover:text-brand-charcoal transition-colors"
                >
                  <X size={18} />
                </button>
              </>
            ) : (
              <>
                <h2 className="font-serif text-lg text-brand-charcoal">
                  Add Recipients
                </h2>
                <button
                  onClick={() => setShowAddGuest(true)}
                  className="flex items-center gap-1 text-sm text-[hsl(var(--brand-warm-gray-light))] hover:text-brand-charcoal transition-colors"
                >
                  <Plus size={14} />
                  Add guests
                </button>
              </>
            )}
          </div>


          {/* Success toast */}
          {sendResult && sendResult.sent > 0 && (
            <div className="mx-6 lg:mx-8 mt-4 px-4 py-3 rounded-lg bg-brand-honey/10 border border-brand-honey/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Check size={14} className="text-brand-honey flex-shrink-0" />
              <span className="text-sm text-brand-charcoal">
                {sendResult.sent} invitation
                {sendResult.sent !== 1 ? "s" : ""} sent
              </span>
            </div>
          )}

          {/* Scrollable content area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 lg:px-8 py-5">
            {loading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : showAddGuest ? (
              /* ── Add a Guest view ── */
              <div>
                {/* First + Last Name */}
                <div className="py-5 border-b border-[#F5F5F4]">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-brand-charcoal mb-1">
                        First Name <span className="text-brand-honey">*</span>
                      </p>
                      <input
                        type="text"
                        placeholder="First Name"
                        value={newGuestFirst}
                        onChange={(e) => setNewGuestFirst(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-brand-sand rounded-xl bg-brand-warm-white-warm placeholder-[hsl(var(--brand-warm-gray-light))] text-brand-charcoal focus:outline-none focus:border-brand-honey focus:ring-1 focus:ring-brand-honey"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-brand-charcoal mb-1">
                        Last Name
                      </p>
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={newGuestLast}
                        onChange={(e) => setNewGuestLast(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-brand-sand rounded-xl bg-brand-warm-white-warm placeholder-[hsl(var(--brand-warm-gray-light))] text-brand-charcoal focus:outline-none focus:border-brand-honey focus:ring-1 focus:ring-brand-honey"
                      />
                    </div>
                  </div>
                </div>

                {/* Printed Name */}
                <div className="py-5 border-b border-[#F5F5F4]">
                  <p className="text-sm font-semibold text-brand-charcoal mb-1">
                    Printed Name
                  </p>
                  <input
                    type="text"
                    placeholder="How this person's name should appear in the book"
                    value={newGuestPrintedName}
                    onChange={(e) => setNewGuestPrintedName(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-brand-sand rounded-xl bg-brand-warm-white-warm placeholder-[hsl(var(--brand-warm-gray-light))] text-brand-charcoal focus:outline-none focus:border-brand-honey focus:ring-1 focus:ring-brand-honey"
                  />
                  <p className="text-xs text-[hsl(var(--brand-warm-gray-light))] mt-2">
                    Leave empty to use first and last name. This is how the name will appear in the printed cookbook.
                  </p>
                </div>

                {/* Email */}
                <div className="py-5">
                  <p className="text-sm font-semibold text-brand-charcoal mb-1">
                    Email
                  </p>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={newGuestEmail}
                    onChange={(e) => setNewGuestEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-brand-sand rounded-xl bg-brand-warm-white-warm placeholder-[hsl(var(--brand-warm-gray-light))] text-brand-charcoal focus:outline-none focus:border-brand-honey focus:ring-1 focus:ring-brand-honey"
                  />
                </div>
              </div>
            ) : showAddEmails ? (
              /* ── Add Email Addresses view ── */
              <div>
                <p className="text-sm text-[hsl(var(--brand-warm-gray-light))] pb-5 border-b border-[#F5F5F4]">
                  Please add email addresses for the following guests.
                </p>
                {guestsWithoutEmail.map((guest) => (
                  <div key={guest.id} className="py-5 border-b border-[#F5F5F4]">
                    <p className="text-sm font-medium text-brand-charcoal mb-2.5">
                      {guest.first_name} {guest.last_name || ""}
                    </p>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={emailDrafts[guest.id] || ""}
                      onChange={(e) =>
                        setEmailDrafts((prev) => ({
                          ...prev,
                          [guest.id]: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 text-sm border border-brand-sand rounded-xl bg-brand-warm-white-warm placeholder-[hsl(var(--brand-warm-gray-light))] text-brand-charcoal focus:outline-none focus:border-brand-honey focus:ring-1 focus:ring-brand-honey"
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* ── Compose ── */
              uninvitedGuests.length === 0 && guestsWithoutEmail.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Check className="w-8 h-8 text-brand-honey" />
                  </div>
                  <p className="text-[hsl(var(--brand-warm-gray-light))] text-sm mb-3">
                    All guests have been invited.
                  </p>
                  <p className="text-[hsl(var(--brand-warm-gray-light))] text-xs leading-relaxed max-w-[240px] mx-auto">
                    Want to nudge someone? Click <span className="font-medium text-brand-charcoal">Send Reminders</span> on the dashboard.
                  </p>
                </div>
              ) : (
                <>
                  {/* Warning: guests without email */}
                  {guestsWithoutEmail.length > 0 && (
                    <button
                      onClick={() => setShowAddEmails(true)}
                      className="mb-5 w-full text-left px-5 py-4 rounded-xl bg-[#FFF0E6] hover:bg-[#FFE8D9] transition-colors"
                    >
                      <span className="text-[15px] font-medium text-brand-charcoal underline">
                        Add an email address for {guestsWithoutEmail.length} guest{guestsWithoutEmail.length !== 1 ? "s" : ""}
                      </span>
                    </button>
                  )}

                  {/* Helper: explain who shows here so missing guests don't confuse */}
                  {uninvitedGuests.length > 0 && (
                    <div className="mb-3 px-3 py-2.5 rounded-lg bg-brand-warm-white-warm border border-brand-sand text-[12px] leading-relaxed text-[hsl(var(--brand-warm-gray-light))]">
                      Only guests with an email who haven&apos;t been invited yet show here.
                      Already invited? Use <span className="font-medium text-brand-charcoal">Send Reminders</span> on the dashboard.
                    </div>
                  )}

                  {/* Select all */}
                  {uninvitedGuests.length > 0 && (
                    <label className="flex items-center gap-4 cursor-pointer py-4 border-b border-brand-sand">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.size === uninvitedGuests.length &&
                          uninvitedGuests.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-[18px] h-[18px] rounded border-gray-300 text-brand-honey focus:ring-brand-honey"
                      />
                      <span className="text-[15px] font-semibold text-brand-charcoal">
                        Select all {uninvitedGuests.length} guest
                        {uninvitedGuests.length !== 1 ? "s" : ""}
                      </span>
                    </label>
                  )}

                  {/* Guest list */}
                  <div>
                    {uninvitedGuests.map((guest) => (
                      <label
                        key={guest.id}
                        className="flex items-center gap-4 py-4 border-b border-[#F5F5F4] cursor-pointer hover:bg-brand-warm-white-warm transition-colors -mx-2 px-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(guest.id)}
                          onChange={() => toggleSelect(guest.id)}
                          className="w-[18px] h-[18px] rounded border-gray-300 text-brand-honey focus:ring-brand-honey"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[15px] font-medium text-brand-charcoal truncate">
                              {guest.first_name} {guest.last_name || ""}
                            </p>
                            {(guest.recipes_received || 0) > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-honey/10 text-brand-honey flex-shrink-0">
                                <Check size={10} />
                                Recipe in
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-[hsl(var(--brand-warm-gray-light))] truncate mt-0.5">
                            {guest.email}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )
            )}
          </div>

          {/* Fixed footer */}
          {showAddGuest ? (
            <div className="px-6 lg:px-8 py-5 border-t border-brand-sand bg-white flex gap-3">
              <button
                onClick={resetAddGuest}
                className="flex-1 py-3 text-sm font-medium text-brand-charcoal border border-brand-sand rounded-full hover:bg-brand-warm-white-warm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGuest}
                disabled={isSavingGuest || !newGuestFirst.trim()}
                className="flex-1 py-3 text-sm font-medium text-white bg-brand-honey rounded-full hover:bg-brand-honey-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isSavingGuest ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          ) : showAddEmails ? (
            <div className="px-6 lg:px-8 py-5 border-t border-brand-sand bg-white flex gap-3">
              <button
                onClick={() => {
                  setShowAddEmails(false);
                  setEmailDrafts({});
                }}
                className="flex-1 py-3 text-sm font-medium text-brand-charcoal border border-brand-sand rounded-full hover:bg-brand-warm-white-warm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmails}
                disabled={
                  isSavingEmails ||
                  !Object.values(emailDrafts).some(
                    (e) => e.trim() && e.includes("@")
                  )
                }
                className="flex-1 py-3 text-sm font-medium text-white bg-brand-honey rounded-full hover:bg-brand-honey-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isSavingEmails ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          ) : uninvitedGuests.length > 0 ? (
            <div className="px-6 lg:px-8 py-6 border-t border-brand-sand bg-white">
              <button
                onClick={handleSendInvitations}
                disabled={selectedIds.size === 0 || isSending}
                className="w-full py-3.5 rounded-full bg-brand-honey text-white font-medium text-[15px]
                           hover:bg-brand-honey-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Send to {selectedIds.size} guest
                    {selectedIds.size !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

