"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Mail,
  Check,
  Clock,
  Send,
  Loader2,
  ChevronLeft,
  Plus,
  X,
} from "lucide-react";
import { getGuestsByGroup, updateGuest, addGuest } from "@/lib/supabase/guests";
import type { Guest } from "@/lib/types/database";

interface SendInvitationsPageProps {
  groupId: string;
  coupleNames: string;
  coupleImageUrl?: string | null;
  collectionUrl?: string | null;
  senderName?: string | null;
  onBack: () => void;
  onOpenGuestSheet: () => void;
}

type Tab = "compose" | "sent";

export function SendInvitationsPage({
  groupId,
  coupleNames,
  coupleImageUrl,
  collectionUrl,
  senderName,
  onBack,
  onOpenGuestSheet,
}: SendInvitationsPageProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("compose");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
  } | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());
  const [showAddEmails, setShowAddEmails] = useState(false);
  const [emailDrafts, setEmailDrafts] = useState<Record<string, string>>({});
  const [isSavingEmails, setIsSavingEmails] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [newGuestFirst, setNewGuestFirst] = useState("");
  const [newGuestLast, setNewGuestLast] = useState("");
  const [newGuestPrintedName, setNewGuestPrintedName] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [isSavingGuest, setIsSavingGuest] = useState(false);

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
      setRemindedIds(new Set());
    }
  }, [groupId, loadGuests]);

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

  const invitedGuests = useMemo(
    () =>
      guests
        .filter((g) => g.invitation_started_at)
        .sort((a, b) => {
          // Pending first (actionable), then recipe added
          const aHasRecipe = (a.recipes_received || 0) > 0;
          const bHasRecipe = (b.recipes_received || 0) > 0;
          if (aHasRecipe !== bHasRecipe) return aHasRecipe ? 1 : -1;
          return new Date(b.invitation_started_at!).getTime() -
            new Date(a.invitation_started_at!).getTime();
        }),
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
        setActiveTab("sent");
      } else {
        setSendResult({ sent: 0, failed: selectedIds.size });
      }
    } catch {
      setSendResult({ sent: 0, failed: selectedIds.size });
    } finally {
      setIsSending(false);
    }
  };

  const handleRemind = async (guestId: string) => {
    setRemindingId(guestId);
    try {
      const response = await fetch("/api/v1/guests/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, groupId }),
      });

      if (response.ok) {
        setRemindedIds((prev) => new Set(prev).add(guestId));
        setTimeout(() => {
          setRemindedIds((prev) => {
            const next = new Set(prev);
            next.delete(guestId);
            return next;
          });
        }, 3000);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setRemindingId(null);
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const emailSubject = `${coupleNames} need your recipe`;

  return (
    <div>
      {/* Top bar — Back on left, Add Recipients title on right */}
      <div className="border-b border-[#E8E0D5] flex">
        {/* Left side of top bar (aligned with email preview column) */}
        <div className="flex-1 lg:w-[68%] lg:flex-none px-6 lg:px-10 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-base font-medium text-[#2D2D2D] hover:text-[#9A9590] transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={2} />
            Back
          </button>
        </div>
        {/* Right side of top bar (aligned with recipients column) */}
        <div className="hidden lg:flex items-center justify-between lg:w-[32%] lg:flex-none px-8 border-l border-[#E8E0D5]">
          {showAddEmails ? (
            <>
              <h2 className="font-serif text-xl font-semibold text-[#2D2D2D]">
                Add Email Addresses
              </h2>
              <button
                onClick={() => {
                  setShowAddEmails(false);
                  setEmailDrafts({});
                }}
                className="text-[#9A9590] hover:text-[#2D2D2D] transition-colors"
              >
                <X size={18} />
              </button>
            </>
          ) : showAddGuest ? (
            <>
              <h2 className="font-serif text-xl font-semibold text-[#2D2D2D]">
                Add a Guest
              </h2>
              <button
                onClick={resetAddGuest}
                className="text-[#9A9590] hover:text-[#2D2D2D] transition-colors"
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <>
              <h2 className="font-serif text-xl font-semibold text-[#2D2D2D]">
                Add Recipients
              </h2>
              <button
                onClick={() => setShowAddGuest(true)}
                className="flex items-center gap-1.5 text-[15px] text-[#9A9590] hover:text-[#2D2D2D] transition-colors"
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
          {/* Email card container */}
          <div className="w-full max-w-[560px] rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* "New Email" header bar */}
            <div className="bg-[#2D2D2D] text-center py-2.5">
              <span className="text-sm font-medium text-white tracking-wide">New Email</span>
            </div>

            {/* From / Subject rows */}
            <div className="bg-white border-b border-[#E8E0D5]">
              <div className="px-6 py-2.5 border-b border-[#F0EDE8]">
                <p className="text-sm">
                  <span className="text-[#9A9590]">From:</span>{" "}
                  <span className="text-[#2D2D2D]">{coupleNames}</span>
                </p>
              </div>
              <div className="px-6 py-2.5">
                <p className="text-sm">
                  <span className="text-[#9A9590]">Subject:</span>{" "}
                  <span className="text-[#2D2D2D]">{emailSubject}</span>
                </p>
              </div>
            </div>

            {/* Email body */}
            <div className="bg-white px-8 lg:px-14 py-12 lg:py-16 text-center">
              {/* Couple names — the hero */}
              <p className="text-xs tracking-[0.25em] uppercase text-[#9A9590] mb-3">
                A wedding cookbook gift for
              </p>
              <h2 className="font-serif text-3xl lg:text-4xl text-[#2D2D2D] leading-tight mb-3">
                {coupleNames}
              </h2>
              <div className="w-12 h-px bg-[#D4A854] mx-auto mb-10" />

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

              {/* Body copy */}
              <div className="text-[15px] text-[#666666] leading-relaxed max-w-[340px] mx-auto mb-10 space-y-4">
                <p>
                  We&apos;re making them a cookbook. A real one.
                  With recipes from the people who matter most to them.
                </p>
                <p>
                  Send a recipe and you&apos;re in their kitchen.
                </p>
                <p className="text-[#2D2D2D] font-medium">
                  Doesn&apos;t have to be fancy. Just has to be yours.
                </p>
              </div>

              {/* CTA button */}
              {collectionUrl ? (
                <a
                  href={collectionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-10 py-3.5 bg-[#2D2D2D] text-white text-xs font-medium rounded tracking-[0.15em] uppercase hover:bg-[#444] transition-colors"
                >
                  Add Your Recipe
                </a>
              ) : (
                <span className="inline-block px-10 py-3.5 bg-[#2D2D2D] text-white text-xs font-medium rounded tracking-[0.15em] uppercase">
                  Add Your Recipe
                </span>
              )}

              {/* Sub-text */}
              <p className="text-xs text-[#9A9590] mt-5">
                5 minutes. That&apos;s it.
              </p>

              {/* Divider + logo footer */}
              <div className="mt-12 pt-6 border-t border-[#F0EDE8] space-y-4">
                <img
                  src="/images/logo_svg/SmallPlates_logo_horizontal.svg"
                  alt="Small Plates & Co."
                  className="h-3.5 mx-auto opacity-40"
                />
                {senderName && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-[#9A9590]">
                      This invitation was sent by {senderName} via Small Plates &amp; Co.
                    </p>
                    <p className="text-xs text-[#C4BDB6]">
                      If you don&apos;t know {senderName} or didn&apos;t expect this invitation, you can safely ignore this email.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column: Recipients (fixed height, internal scroll) ── */}
        <div className="lg:w-[32%] bg-white border-t lg:border-t-0 lg:border-l border-[#E8E0D5] flex flex-col lg:h-full lg:overflow-hidden">
          {/* Mobile-only title (on desktop it's in the top bar) */}
          <div className="lg:hidden px-6 pt-6 flex items-center justify-between mb-4">
            {showAddEmails ? (
              <>
                <h2 className="font-serif text-lg text-[#2D2D2D]">
                  Add Email Addresses
                </h2>
                <button
                  onClick={() => {
                    setShowAddEmails(false);
                    setEmailDrafts({});
                  }}
                  className="text-[#9A9590] hover:text-[#2D2D2D] transition-colors"
                >
                  <X size={18} />
                </button>
              </>
            ) : showAddGuest ? (
              <>
                <h2 className="font-serif text-lg text-[#2D2D2D]">
                  Add a Guest
                </h2>
                <button
                  onClick={resetAddGuest}
                  className="text-[#9A9590] hover:text-[#2D2D2D] transition-colors"
                >
                  <X size={18} />
                </button>
              </>
            ) : (
              <>
                <h2 className="font-serif text-lg text-[#2D2D2D]">
                  Add Recipients
                </h2>
                <button
                  onClick={() => setShowAddGuest(true)}
                  className="flex items-center gap-1 text-sm text-[#9A9590] hover:text-[#2D2D2D] transition-colors"
                >
                  <Plus size={14} />
                  Add guests
                </button>
              </>
            )}
          </div>

          {/* Tabs (hidden when adding emails or guests) */}
          {!showAddEmails && !showAddGuest && (
            <div className="px-6 lg:px-8 pt-3 lg:pt-5">
              <div className="flex border-b border-[#E8E0D5]">
                <button
                  onClick={() => setActiveTab("compose")}
                  className={`pb-3.5 px-1 mr-6 text-[15px] font-medium transition-colors border-b-2 ${
                    activeTab === "compose"
                      ? "border-[#2D2D2D] text-[#2D2D2D]"
                      : "border-transparent text-[#9A9590] hover:text-[#2D2D2D]"
                  }`}
                >
                  Compose ({uninvitedGuests.length})
                </button>
                <button
                  onClick={() => setActiveTab("sent")}
                  className={`pb-3.5 px-1 text-[15px] font-medium transition-colors border-b-2 ${
                    activeTab === "sent"
                      ? "border-[#2D2D2D] text-[#2D2D2D]"
                      : "border-transparent text-[#9A9590] hover:text-[#2D2D2D]"
                  }`}
                >
                  Sent ({invitedGuests.length})
                </button>
              </div>
            </div>
          )}

          {/* Success toast */}
          {sendResult && sendResult.sent > 0 && (
            <div className="mx-6 lg:mx-8 mt-4 px-4 py-3 rounded-lg bg-[#D4A854]/10 border border-[#D4A854]/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Check size={14} className="text-[#D4A854] flex-shrink-0" />
              <span className="text-sm text-[#2D2D2D]">
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
                  <div className="flex gap-3 mb-1">
                    <p className="flex-1 text-sm font-semibold text-[#2D2D2D]">
                      First Name <span className="text-[#D4A854]">*</span>
                    </p>
                    <p className="flex-1 text-sm font-semibold text-[#2D2D2D]">
                      Last Name
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={newGuestFirst}
                      onChange={(e) => setNewGuestFirst(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-sm border border-[#E8E0D5] rounded-xl bg-[#FAF7F2] placeholder-[#9A9590] text-[#2D2D2D] focus:outline-none focus:border-[#D4A854] focus:ring-1 focus:ring-[#D4A854]"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={newGuestLast}
                      onChange={(e) => setNewGuestLast(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-sm border border-[#E8E0D5] rounded-xl bg-[#FAF7F2] placeholder-[#9A9590] text-[#2D2D2D] focus:outline-none focus:border-[#D4A854] focus:ring-1 focus:ring-[#D4A854]"
                    />
                  </div>
                </div>

                {/* Printed Name */}
                <div className="py-5 border-b border-[#F5F5F4]">
                  <p className="text-sm font-semibold text-[#2D2D2D] mb-1">
                    Printed Name
                  </p>
                  <input
                    type="text"
                    placeholder="How this person's name should appear in the book"
                    value={newGuestPrintedName}
                    onChange={(e) => setNewGuestPrintedName(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-[#E8E0D5] rounded-xl bg-[#FAF7F2] placeholder-[#9A9590] text-[#2D2D2D] focus:outline-none focus:border-[#D4A854] focus:ring-1 focus:ring-[#D4A854]"
                  />
                  <p className="text-xs text-[#9A9590] mt-2">
                    Leave empty to use first and last name. This is how the name will appear in the printed cookbook.
                  </p>
                </div>

                {/* Email */}
                <div className="py-5">
                  <p className="text-sm font-semibold text-[#2D2D2D] mb-1">
                    Email
                  </p>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={newGuestEmail}
                    onChange={(e) => setNewGuestEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-[#E8E0D5] rounded-xl bg-[#FAF7F2] placeholder-[#9A9590] text-[#2D2D2D] focus:outline-none focus:border-[#D4A854] focus:ring-1 focus:ring-[#D4A854]"
                  />
                </div>
              </div>
            ) : showAddEmails ? (
              /* ── Add Email Addresses view ── */
              <div>
                <p className="text-sm text-[#9A9590] pb-5 border-b border-[#F5F5F4]">
                  Please add email addresses for the following guests.
                </p>
                {guestsWithoutEmail.map((guest) => (
                  <div key={guest.id} className="py-5 border-b border-[#F5F5F4]">
                    <p className="text-sm font-medium text-[#2D2D2D] mb-2.5">
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
                      className="w-full px-4 py-2.5 text-sm border border-[#E8E0D5] rounded-xl bg-[#FAF7F2] placeholder-[#9A9590] text-[#2D2D2D] focus:outline-none focus:border-[#D4A854] focus:ring-1 focus:ring-[#D4A854]"
                    />
                  </div>
                ))}
              </div>
            ) : activeTab === "compose" ? (
              /* ── Compose Tab ── */
              uninvitedGuests.length === 0 && guestsWithoutEmail.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Check className="w-8 h-8 text-[#D4A854]" />
                  </div>
                  <p className="text-[#9A9590] text-sm">
                    All guests have been invited.
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
                      <span className="text-[15px] font-medium text-[#2D2D2D] underline">
                        Add an email address for {guestsWithoutEmail.length} guest{guestsWithoutEmail.length !== 1 ? "s" : ""}
                      </span>
                    </button>
                  )}

                  {/* Select all */}
                  {uninvitedGuests.length > 0 && (
                    <label className="flex items-center gap-4 cursor-pointer py-4 border-b border-[#E8E0D5]">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.size === uninvitedGuests.length &&
                          uninvitedGuests.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-[18px] h-[18px] rounded border-gray-300 text-[#D4A854] focus:ring-[#D4A854]"
                      />
                      <span className="text-[15px] font-semibold text-[#2D2D2D]">
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
                        className="flex items-center gap-4 py-4 border-b border-[#F5F5F4] cursor-pointer hover:bg-[#FAF7F2] transition-colors -mx-2 px-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(guest.id)}
                          onChange={() => toggleSelect(guest.id)}
                          className="w-[18px] h-[18px] rounded border-gray-300 text-[#D4A854] focus:ring-[#D4A854]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-medium text-[#2D2D2D] truncate">
                            {guest.first_name} {guest.last_name || ""}
                          </p>
                          <p className="text-sm text-[#9A9590] truncate mt-0.5">
                            {guest.email}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )
            ) : (
              /* ── Sent Tab ── */
              invitedGuests.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Send className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-[#9A9590] text-sm">
                    No invitations sent yet.
                  </p>
                </div>
              ) : (
                <div>
                  {invitedGuests.map((guest) => {
                    const hasRecipe = (guest.recipes_received || 0) > 0;
                    const isReminding = remindingId === guest.id;
                    const justReminded = remindedIds.has(guest.id);

                    return (
                      <div
                        key={guest.id}
                        className="flex items-center gap-3 py-3.5 border-b border-[#F5F5F4]"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2D2D2D] truncate">
                            {guest.first_name} {guest.last_name || ""}
                          </p>
                          <p className="text-xs text-[#9A9590]">
                            Invited{" "}
                            {guest.invitation_started_at
                              ? formatDate(guest.invitation_started_at)
                              : ""}
                          </p>
                        </div>

                        {hasRecipe ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#D4A854]/10 text-[#D4A854]">
                            <Check size={12} />
                            Recipe added
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-[#9A9590]">
                              <Clock size={12} />
                              Awaiting recipe
                            </span>
                            <button
                              onClick={() => handleRemind(guest.id)}
                              disabled={isReminding || justReminded}
                              className="text-xs font-medium px-3 py-1.5 rounded-md border border-[#E8E0D5] text-[#2D2D2D] hover:border-[#2D2D2D] transition-colors disabled:opacity-50 disabled:cursor-default"
                            >
                              {isReminding ? (
                                <span className="flex items-center gap-1">
                                  <Loader2
                                    size={12}
                                    className="animate-spin"
                                  />
                                  Sending
                                </span>
                              ) : justReminded ? (
                                <span className="flex items-center gap-1 text-[#D4A854]">
                                  <Check size={12} />
                                  Sent
                                </span>
                              ) : (
                                "Remind"
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* Fixed footer */}
          {showAddGuest ? (
            <div className="px-6 lg:px-8 py-5 border-t border-[#E8E0D5] bg-white flex gap-3">
              <button
                onClick={resetAddGuest}
                className="flex-1 py-3 text-sm font-medium text-[#2D2D2D] border border-[#E8E0D5] rounded-full hover:bg-[#FAF7F2] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGuest}
                disabled={isSavingGuest || !newGuestFirst.trim()}
                className="flex-1 py-3 text-sm font-medium text-white bg-[#D4A854] rounded-full hover:bg-[#C19940] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
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
            <div className="px-6 lg:px-8 py-5 border-t border-[#E8E0D5] bg-white flex gap-3">
              <button
                onClick={() => {
                  setShowAddEmails(false);
                  setEmailDrafts({});
                }}
                className="flex-1 py-3 text-sm font-medium text-[#2D2D2D] border border-[#E8E0D5] rounded-full hover:bg-[#FAF7F2] transition-colors"
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
                className="flex-1 py-3 text-sm font-medium text-white bg-[#D4A854] rounded-full hover:bg-[#C19940] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
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
          ) : activeTab === "compose" && uninvitedGuests.length > 0 ? (
            <div className="px-6 lg:px-8 py-6 border-t border-[#E8E0D5] bg-white">
              <button
                onClick={handleSendInvitations}
                disabled={selectedIds.size === 0 || isSending}
                className="w-full py-3.5 rounded-full bg-[#D4A854] text-white font-medium text-[15px]
                           hover:bg-[#C19940] transition-colors disabled:opacity-40 disabled:cursor-not-allowed
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

