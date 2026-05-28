"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getUserCollectionToken } from "@/lib/supabase/collection";
import { createSupabaseClient } from "@/lib/supabase/client";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { Check, Copy, ArrowRight, Calendar, X, Smartphone, Monitor, MessageCircle } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { addMonths, format, parse } from "date-fns";
import type { GroupWithMembers } from "@/lib/types/database";
import BrandLoader from "@/components/ui/BrandLoader";

function EventInviteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const groupId = params.get("groupId");
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteTitle, setInviteTitle] = useState("");
  const [inviteTagline, setInviteTagline] = useState("You're invited");
  const [inviteMessage, setInviteMessage] = useState("");

  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop" | "whatsapp">("desktop");
  const [dateTimeModalOpen, setDateTimeModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [eventVenue, setEventVenue] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarInputRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const timeInputRef = useRef<HTMLDivElement>(null);

  const fromDate = new Date();
  const toDate = addMonths(new Date(), 18);

  const loadGroup = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    const supabase = createSupabaseClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setLoading(false);
      return;
    }

    const { data: membership } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("profile_id", authUser.id)
      .eq("group_id", groupId)
      .single();

    if (!membership) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("groups")
      .select("*, group_members(*, profiles!group_members_profile_id_fkey(id, full_name, email))")
      .eq("id", groupId)
      .single();

    if (data) {
      setGroup(data as GroupWithMembers);
      if (data.event_date) {
        setEventDate(data.event_date);
        setSelectedDate(parse(data.event_date, "yyyy-MM-dd", new Date()));
      }
      if (data.event_time) setEventTime(data.event_time);
      if (data.event_location) setEventLocation(data.event_location);
      if (data.event_venue) setEventVenue(data.event_venue);
      if (data.event_date && data.event_location) {
        setStep(3);
      }
      const name = data.couple_display_name || data.name || "the couple";
      setInviteTitle(data.invite_title || "Let's Shower the Bride!");
      const ownerMember = (data.group_members || []).find((m: { role: string; profiles?: { full_name?: string | null } | null }) => m.role === "owner");
      const ownerName = (ownerMember?.profiles as { full_name?: string | null } | null)?.full_name || "";
      setInviteTagline(data.invite_tagline || ownerName || "The Family");
      setInviteMessage(data.invite_message || `${name} invites you to share your favorite recipe with them! They will print a cookbook with recipes from family and friends.`);
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/");
      return;
    }
    loadGroup();
  }, [authLoading, user, loadGroup, router]);

  useEffect(() => {
    if (!calendarOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        calendarRef.current && !calendarRef.current.contains(e.target as Node) &&
        calendarInputRef.current && !calendarInputRef.current.contains(e.target as Node)
      ) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen]);

  useEffect(() => {
    if (!timePickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        timeRef.current && !timeRef.current.contains(e.target as Node) &&
        timeInputRef.current && !timeInputRef.current.contains(e.target as Node)
      ) {
        setTimePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [timePickerOpen]);

  useEffect(() => {
    if (step !== 3 || !groupId) return;
    getUserCollectionToken().then(({ data: token }) => {
      if (token) {
        setInviteUrl(`${window.location.origin}/invite/${token}?group=${groupId}`);
      }
    });
  }, [step, groupId]);

  const saveEventDetails = async () => {
    if (!groupId) return;
    setSaving(true);
    try {
      await fetch(`/api/v1/groups/${groupId}/event-details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_date: eventDate,
          event_time: eventTime,
          event_location: eventLocation,
        }),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStep1Continue = () => {
    if (!eventDate) return;
    setStep(2);
  };

  const handleStep2Continue = async () => {
    if (!eventLocation.trim()) return;
    await saveEventDetails();
    setStep(3);
  };

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!inviteUrl || !group) return;
    const message = `${inviteMessage}\n\n${inviteUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const saveField = useCallback(async (fields: Record<string, string>) => {
    if (!groupId) return;
    await fetch(`/api/v1/groups/${groupId}/event-details`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
  }, [groupId]);

  if (loading || authLoading) return <BrandLoader />;
  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[hsl(var(--brand-warm-gray))]">
          Could not load group. <button onClick={() => router.push("/profile/groups")} className="text-[hsl(var(--brand-honey))] underline">Back to dashboard</button>
        </p>
      </div>
    );
  }

  const coupleName = group.couple_display_name || group.name || "Your Cookbook";

  const shell = (children: React.ReactNode) => (
    <div className="h-screen flex flex-col overflow-hidden">
      <ProfileHeader />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );

  if (step === 1) {
    return shell(
      <OnboardingShell
        title="When is the event?"
        subtitle={`Set the date and time for ${coupleName}'s event.`}
        backHref="/profile/groups"
        onContinue={handleStep1Continue}
        continueDisabled={!eventDate}
        imageUrl=""
      >
        <div className="space-y-5">
          <div>
            <label className="input-label">Date</label>
            <div className="relative max-w-md">
              <div
                ref={calendarInputRef}
                role="button"
                tabIndex={0}
                onClick={() => setCalendarOpen((prev) => !prev)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCalendarOpen((prev) => !prev); } }}
                className="w-full h-12 px-4 flex items-center rounded-lg cursor-pointer transition-all duration-200 bg-[hsl(var(--brand-warm-white))]"
                style={{
                  border: `1px solid ${selectedDate ? "hsl(var(--brand-honey))" : calendarOpen ? "hsl(var(--brand-honey))" : "hsl(var(--brand-sand))"}`,
                  boxShadow: calendarOpen ? "0 0 0 2px rgba(212, 168, 84, 0.15)" : "none",
                }}
              >
                <Calendar className="w-[18px] h-[18px] text-[hsl(var(--brand-warm-gray))] mr-2.5 flex-shrink-0" strokeWidth={1.5} />
                {selectedDate ? (
                  <span className="text-[15px] font-medium text-[hsl(var(--brand-charcoal))] flex-1 text-left">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </span>
                ) : (
                  <span className="text-[15px] text-[hsl(var(--brand-warm-gray))] flex-1 text-left">
                    Pick a date
                  </span>
                )}
                {selectedDate && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedDate(undefined); setEventDate(""); }}
                    className="p-1 rounded-full hover:bg-[hsl(var(--brand-sand))] transition-colors ml-1"
                  >
                    <X className="w-4 h-4 text-[hsl(var(--brand-warm-gray))]" strokeWidth={1.5} />
                  </button>
                )}
              </div>
              {calendarOpen && (
                <div
                  ref={calendarRef}
                  className="absolute left-0 right-0 z-50 mt-2 bg-white rounded-xl p-4 flex justify-center"
                  style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
                >
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (date) {
                        setEventDate(format(date, "yyyy-MM-dd"));
                        setCalendarOpen(false);
                      }
                    }}
                    startMonth={fromDate}
                    endMonth={toDate}
                    disabled={{ before: fromDate, after: toDate }}
                    defaultMonth={selectedDate || fromDate}
                    style={{
                      ["--rdp-accent-color" as string]: "hsl(var(--brand-honey))",
                      ["--rdp-accent-background-color" as string]: "hsl(var(--brand-honey))",
                      ["--rdp-today-color" as string]: "hsl(var(--brand-honey))",
                      ["--rdp-day-height" as string]: "44px",
                      ["--rdp-day-width" as string]: "44px",
                      ["--rdp-selected-border" as string]: "none",
                      fontFamily: "inherit",
                      color: "hsl(var(--brand-charcoal))",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="input-label">Time</label>
            <div className="relative max-w-md">
              <div
                ref={timeInputRef}
                role="button"
                tabIndex={0}
                onClick={() => setTimePickerOpen((prev) => !prev)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTimePickerOpen((prev) => !prev); } }}
                className="w-full h-12 px-4 flex items-center rounded-lg cursor-pointer transition-all duration-200 bg-[hsl(var(--brand-warm-white))]"
                style={{
                  border: `1px solid ${eventTime ? "hsl(var(--brand-honey))" : timePickerOpen ? "hsl(var(--brand-honey))" : "hsl(var(--brand-sand))"}`,
                  boxShadow: timePickerOpen ? "0 0 0 2px rgba(212, 168, 84, 0.15)" : "none",
                }}
              >
                {eventTime ? (
                  <span className="text-[15px] font-medium text-[hsl(var(--brand-charcoal))] flex-1 text-left">
                    {formatEventTime(eventTime)}
                  </span>
                ) : (
                  <span className="text-[15px] text-[hsl(var(--brand-warm-gray))] flex-1 text-left">
                    Pick a time
                  </span>
                )}
                {eventTime && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEventTime(""); }}
                    className="p-1 rounded-full hover:bg-[hsl(var(--brand-sand))] transition-colors ml-1"
                  >
                    <X className="w-4 h-4 text-[hsl(var(--brand-warm-gray))]" strokeWidth={1.5} />
                  </button>
                )}
              </div>
              {timePickerOpen && (
                <div
                  ref={timeRef}
                  className="absolute left-0 z-50 mt-2 bg-white rounded-xl p-3 max-h-[280px] overflow-y-auto w-[200px]"
                  style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
                >
                  <div className="grid grid-cols-1 gap-0.5">
                    {generateTimeSlots().map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => { setEventTime(slot.value); setTimePickerOpen(false); }}
                        className={`text-left px-3 py-2 rounded-lg text-[14px] transition-colors ${
                          eventTime === slot.value
                            ? "bg-[hsl(var(--brand-honey))] text-white font-medium"
                            : "text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-warm-white))]"
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </OnboardingShell>
    );
  }

  if (step === 2) {
    return shell(
      <OnboardingShell
        title="Where is it?"
        subtitle="The address or place name for the event."
        onContinue={handleStep2Continue}
        continueDisabled={!eventLocation.trim() || saving}
        continueLabel={saving ? "Saving..." : "Continue"}
        imageUrl=""
      >
        <div>
          <label htmlFor="event-location" className="input-label">Location</label>
          <input
            id="event-location"
            type="text"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            className="input-field"
            placeholder="Maria's house, 123 Main St, City"
          />
        </div>
        <button
          onClick={() => setStep(1)}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back
        </button>
      </OnboardingShell>
    );
  }

  const invitePreview = (
    <div className="bg-[hsl(var(--brand-warm-white))] px-12 pt-10 pb-12">
      <p className="text-[11px] uppercase tracking-[0.25em] text-[hsl(var(--brand-warm-gray))] mb-20 text-left">
        SMALL PLATES & CO. <span className="font-bold text-[hsl(var(--brand-charcoal))]">INVITE</span>
      </p>

      {/* Mobile mode — couple image centered */}
      {previewMode === "mobile" && group.couple_image_url && (
        <div className="w-[200px] h-[200px] rounded-lg overflow-hidden mx-auto mb-8 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={group.couple_image_url}
            alt="Couple"
            className="w-full h-full object-cover"
            style={{
              objectPosition: `${group.couple_image_position_x ?? 50}% ${group.couple_image_position_y ?? 50}%`,
            }}
          />
        </div>
      )}

      <div className="flex flex-row gap-8 md:gap-12">
        {/* Left — text content */}
        <div className="flex-1 text-center max-w-[440px] mx-auto">
          <EditableField
            value={inviteTitle || coupleName}
            onChange={(v) => { setInviteTitle(v); saveField({ invite_title: v }); }}
            className={`font-serif ${previewMode === "mobile" ? "text-[32px]" : "text-[52px]"} font-medium text-[hsl(var(--brand-charcoal))] mb-4 leading-[1.1]`}
          />

          <div className="mt-10 md:mt-12 mb-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--brand-warm-gray))] mb-2">Hosted by</p>
            <EditableField
              value={inviteTagline}
              onChange={(v) => { setInviteTagline(v); saveField({ invite_tagline: v }); }}
              className="text-[14px] uppercase tracking-[0.15em] text-[hsl(var(--brand-charcoal))] font-medium"
            />
          </div>

          <div className="w-full h-px bg-[hsl(var(--brand-charcoal))]/20 my-10" />

          <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--brand-warm-gray))] mb-2">When</p>
          <EditableField
            value={eventDate ? `${formatEventDate(eventDate)}${eventTime ? ` · ${formatEventTime(eventTime)}` : ""}` : ""}
            onClick={() => setDateTimeModalOpen(true)}
            className="text-[14px] text-[hsl(var(--brand-charcoal))] font-medium uppercase tracking-wide"
            readOnly
          />

          <div className="my-10" />

          <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--brand-warm-gray))] mb-2">Where</p>
          <div
            onClick={() => setLocationModalOpen(true)}
            className="cursor-pointer rounded px-2 py-0.5 transition-colors hover:bg-[hsl(var(--brand-honey))]/10"
          >
            {eventVenue && (
              <p className="text-[14px] text-[hsl(var(--brand-charcoal))] font-medium uppercase tracking-wide">
                {eventVenue}
              </p>
            )}
            {eventLocation ? (
              <p className="text-[14px] text-[hsl(var(--brand-charcoal))] font-medium uppercase tracking-wide">
                {eventLocation}
              </p>
            ) : !eventVenue ? (
              <p className="text-[14px] italic opacity-50 text-[hsl(var(--brand-charcoal))]">
                Add location
              </p>
            ) : null}
          </div>

          <div className="w-full h-px bg-[hsl(var(--brand-border))] my-10" />

          <EditableField
            value={inviteMessage}
            onChange={(v) => { setInviteMessage(v); saveField({ invite_message: v }); }}
            className="text-[13px] text-[hsl(var(--brand-warm-gray))] leading-relaxed"
            multiline
          />

        </div>

        {/* Right — couple image (desktop only) */}
        {previewMode !== "mobile" && group.couple_image_url && (
          <div className="w-[40%] flex-shrink-0 self-start">
            <div className="aspect-square rounded-lg overflow-hidden shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={group.couple_image_url}
                alt="Couple"
                className="w-full h-full object-cover"
                style={{
                  objectPosition: `${group.couple_image_position_x ?? 50}% ${group.couple_image_position_y ?? 50}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky Share a Recipe button — mirrors layout */}
      <div className="sticky bottom-6 z-50 mt-12">
        <div className="flex flex-row gap-8 md:gap-12">
          <div className="flex-1 flex justify-center max-w-[440px] mx-auto">
            <span className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-[hsl(var(--brand-honey))] text-white text-[15px] font-medium shadow-lg whitespace-nowrap">
              Share a Recipe →
            </span>
          </div>
          {previewMode !== "mobile" && group.couple_image_url && (
            <div className="w-[40%] flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/SmallPlates_logo_horizontal.png" alt="Small Plates & Co." className="h-20 opacity-70" />
        <div className="flex items-center gap-4 text-[10px] text-[hsl(var(--brand-warm-gray))]">
          <a href="/terms" target="_blank" rel="noreferrer" className="hover:text-[hsl(var(--brand-charcoal))] transition-colors">Terms and Privacy</a>
          <span>·</span>
          <a href="mailto:hello@smallplatesandcompany.com" className="hover:text-[hsl(var(--brand-charcoal))] transition-colors">Help</a>
        </div>
        <p className="text-[10px] text-[hsl(var(--brand-warm-gray))]">© {new Date().getFullYear()} Small Plates & Co.</p>
      </div>
    </div>
  );

  return shell(
    <div className="flex-1 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 py-10 flex flex-col lg:flex-row gap-6 items-start">

        {/* Left — Preview */}
        <div className="flex-1 flex flex-col items-center">
          {/* Device toggle */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setPreviewMode("mobile")}
              className={`p-2 rounded-full transition-colors ${
                previewMode === "mobile"
                  ? "bg-[hsl(var(--brand-charcoal))] text-white"
                  : "text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))]"
              }`}
            >
              <Smartphone size={18} />
            </button>
            <button
              onClick={() => setPreviewMode("desktop")}
              className={`p-2 rounded-full transition-colors ${
                previewMode === "desktop"
                  ? "bg-[hsl(var(--brand-charcoal))] text-white"
                  : "text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))]"
              }`}
            >
              <Monitor size={18} />
            </button>
          </div>

          {/* Mobile / Desktop preview */}
          {previewMode !== "whatsapp" && (
            <div
              className={`bg-gray-100 rounded-2xl overflow-hidden shadow-lg border border-gray-200 transition-all duration-300 flex flex-col max-h-[80vh] relative ${
                previewMode === "mobile" ? "w-[360px]" : "w-full"
              }`}
            >
              <div className="bg-gray-200 px-4 py-2 flex items-center gap-1.5 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {invitePreview}
              </div>
            </div>
          )}

          {/* WhatsApp preview — realistic chat */}
          {previewMode === "whatsapp" && (
            <div className="w-[320px] rounded-2xl overflow-hidden shadow-lg border border-gray-200"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='20' cy='20' r='1.5' fill='%23d4cfc6' opacity='.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='200' height='200' fill='%23ECE5DD'/%3E%3Crect width='200' height='200' fill='url(%23p)'/%3E%3C/svg%3E\")", backgroundSize: "200px 200px" }}
            >
              {/* Chat area */}
              <div className="px-3 pt-6 pb-3 min-h-[400px] flex flex-col justify-end">
                <div className="max-w-[88%] ml-auto">
                  <div className="bg-[#d9fdd3] rounded-lg rounded-tr-none shadow-sm overflow-hidden">
                    {/* OG Image */}
                    {group.couple_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={group.couple_image_url}
                        alt="Preview"
                        className="w-full h-[140px] object-cover"
                        style={{
                          objectPosition: `${group.couple_image_position_x ?? 50}% ${group.couple_image_position_y ?? 50}%`,
                        }}
                      />
                    ) : (
                      <div className="w-full h-[140px] bg-[hsl(var(--brand-warm-white))]" />
                    )}
                    {/* OG text */}
                    <div className="px-3 py-2.5">
                      <p className="text-[13px] font-bold text-gray-900 leading-snug">
                        Share a Recipe to my Cookbook - SP&amp;Co
                      </p>
                      <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">
                        {inviteMessage}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-[11px]">🔗</span>
                        <span className="text-[11px] text-gray-400">smallplatesandcompany.com</span>
                      </div>
                    </div>
                    {/* Timestamp */}
                    <div className="px-3 pb-2 flex justify-end">
                      <span className="text-[10px] text-[#667781]">9:42 AM ✓✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input bar */}
              <div className="bg-[#f0f2f5] px-2 py-2 flex items-center gap-2">
                <span className="text-gray-500 text-[16px]">+</span>
                <div className="flex-1 bg-white rounded-full px-3 py-1.5 flex items-center">
                  <span className="flex-1" />
                  <span className="text-gray-400 text-[14px]">☺</span>
                </div>
                <span className="text-gray-500 text-[14px]">📷</span>
                <span className="text-gray-500 text-[14px]">🎤</span>
              </div>
            </div>
          )}
        </div>

        {/* Right — Share actions */}
        <div className="w-full lg:w-[260px] flex-shrink-0 lg:pt-24">
          <h2 className="font-serif text-[28px] text-[hsl(var(--brand-charcoal))] mb-3 leading-tight">
            Your invite is ready
          </h2>
          <p className="text-[15px] text-[hsl(var(--brand-warm-gray))] mb-4">
            Share this link with the people you want to invite.
          </p>
          <p className="text-[12px] text-[hsl(var(--brand-warm-gray))] italic mb-6">
            Click any text on the invite to edit it.
          </p>

          <button
            onClick={handleCopyLink}
            className="btn btn-sm btn-honey w-full gap-2 mb-2"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Link Copied!" : "Copy Invite Link"}
          </button>

          <button
            onClick={handleWhatsApp}
            className="btn btn-sm btn-outline w-full gap-2 mb-2"
          >
            Share via WhatsApp
            <ArrowRight size={16} />
          </button>

          <div className="flex items-start gap-3 mt-4 mb-4">
            <Copy size={16} className="text-[hsl(var(--brand-warm-gray))] flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-[hsl(var(--brand-warm-gray))] leading-relaxed">
              Share the link anywhere: text, social media, email, or WhatsApp.
            </p>
          </div>

          <button
            onClick={() => router.push("/profile/groups")}
            className="w-full text-center text-sm text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] transition-colors py-3"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>

      {/* Location edit modal */}
      {locationModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => setLocationModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-[22px] text-[hsl(var(--brand-charcoal))] mb-6">
              Where is the event?
            </h3>

            <div className="space-y-4">
              <div>
                <label className="input-label">Venue Name</label>
                <input
                  type="text"
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  onBlur={() => saveField({ event_venue: eventVenue })}
                  className="input-field"
                  placeholder="Maria's House, Casa Lilyth..."
                />
              </div>
              <div>
                <label className="input-label">Address</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  onBlur={() => saveField({ event_location: eventLocation })}
                  className="input-field"
                  placeholder="455 E Waterside Dr, Chicago, IL"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  saveField({ event_venue: eventVenue, event_location: eventLocation });
                  setLocationModalOpen(false);
                }}
                className="btn btn-sm btn-honey"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date & Time edit modal */}
      {dateTimeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => { setDateTimeModalOpen(false); setCalendarOpen(false); setTimePickerOpen(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-[22px] text-[hsl(var(--brand-charcoal))] mb-6">
              When is the event?
            </h3>

            <div className="space-y-4">
              {/* Date trigger */}
              <div>
                <label className="input-label">Date</label>
                <div className="relative">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setCalendarOpen((p) => !p); setTimePickerOpen(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCalendarOpen((p) => !p); } }}
                    className="w-full h-12 px-4 flex items-center rounded-lg cursor-pointer transition-all duration-200 bg-[hsl(var(--brand-warm-white))]"
                    style={{
                      border: `1px solid ${selectedDate ? "hsl(var(--brand-honey))" : calendarOpen ? "hsl(var(--brand-honey))" : "hsl(var(--brand-sand))"}`,
                      boxShadow: calendarOpen ? "0 0 0 2px rgba(212, 168, 84, 0.15)" : "none",
                    }}
                  >
                    <Calendar className="w-[18px] h-[18px] text-[hsl(var(--brand-warm-gray))] mr-2.5 flex-shrink-0" strokeWidth={1.5} />
                    {selectedDate ? (
                      <span className="text-[15px] font-medium text-[hsl(var(--brand-charcoal))] flex-1 text-left">
                        {format(selectedDate, "EEEE, MMMM d, yyyy")}
                      </span>
                    ) : (
                      <span className="text-[15px] text-[hsl(var(--brand-warm-gray))] flex-1 text-left">
                        Pick a date
                      </span>
                    )}
                  </div>
                  {calendarOpen && (
                    <div
                      className="absolute left-0 right-0 z-50 mt-2 bg-white rounded-xl p-4 flex justify-center"
                      style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
                    >
                      <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (date) {
                            const formatted = format(date, "yyyy-MM-dd");
                            setEventDate(formatted);
                            saveField({ event_date: formatted });
                            setCalendarOpen(false);
                          }
                        }}
                        startMonth={fromDate}
                        endMonth={toDate}
                        disabled={{ before: fromDate, after: toDate }}
                        defaultMonth={selectedDate || fromDate}
                        style={{
                          ["--rdp-accent-color" as string]: "hsl(var(--brand-honey))",
                          ["--rdp-accent-background-color" as string]: "hsl(var(--brand-honey))",
                          ["--rdp-today-color" as string]: "hsl(var(--brand-honey))",
                          ["--rdp-day-height" as string]: "40px",
                          ["--rdp-day-width" as string]: "40px",
                          ["--rdp-selected-border" as string]: "none",
                          fontFamily: "inherit",
                          color: "hsl(var(--brand-charcoal))",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Time trigger */}
              <div>
                <label className="input-label">Time</label>
                <div className="relative">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => { setTimePickerOpen((p) => !p); setCalendarOpen(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTimePickerOpen((p) => !p); } }}
                    className="w-full h-12 px-4 flex items-center rounded-lg cursor-pointer transition-all duration-200 bg-[hsl(var(--brand-warm-white))]"
                    style={{
                      border: `1px solid ${eventTime ? "hsl(var(--brand-honey))" : timePickerOpen ? "hsl(var(--brand-honey))" : "hsl(var(--brand-sand))"}`,
                      boxShadow: timePickerOpen ? "0 0 0 2px rgba(212, 168, 84, 0.15)" : "none",
                    }}
                  >
                    {eventTime ? (
                      <span className="text-[15px] font-medium text-[hsl(var(--brand-charcoal))] flex-1 text-left">
                        {formatEventTime(eventTime)}
                      </span>
                    ) : (
                      <span className="text-[15px] text-[hsl(var(--brand-warm-gray))] flex-1 text-left">
                        Pick a time
                      </span>
                    )}
                  </div>
                  {timePickerOpen && (
                    <div
                      className="absolute left-0 z-50 mt-2 bg-white rounded-xl p-3 max-h-[240px] overflow-y-auto w-[200px]"
                      style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)" }}
                    >
                      <div className="grid grid-cols-1 gap-0.5">
                        {generateTimeSlots().map((slot) => (
                          <button
                            key={slot.value}
                            type="button"
                            onClick={() => { setEventTime(slot.value); saveField({ event_time: slot.value }); setTimePickerOpen(false); }}
                            className={`text-left px-3 py-2 rounded-lg text-[14px] transition-colors ${
                              eventTime === slot.value
                                ? "bg-[hsl(var(--brand-honey))] text-white font-medium"
                                : "text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-warm-white))]"
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => { setDateTimeModalOpen(false); setCalendarOpen(false); setTimePickerOpen(false); }}
                className="btn btn-sm btn-honey"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function generateTimeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];
  for (let h = 8; h <= 22; h++) {
    for (const m of [0, 15, 30, 45]) {
      const hour24 = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";
      const label = `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
      slots.push({ value: hour24, label });
    }
  }
  return slots;
}

function formatEventDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatEventTime(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return timeStr;
  }
}

function EditableField({
  value,
  onChange,
  onClick,
  className = "",
  placeholder = "",
  multiline = false,
  readOnly = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  onClick?: () => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (readOnly) return;
    setEditing(true);
  };

  const handleBlur = () => {
    setEditing(false);
    if (draft !== value && onChange) {
      onChange(draft);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  if (editing) {
    const sharedClasses = `${className} bg-white/80 outline-none ring-2 ring-[hsl(var(--brand-honey))]/30 rounded px-2 py-1 w-full text-center`;
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          rows={3}
          className={`${sharedClasses} resize-none`}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={sharedClasses}
      />
    );
  }

  const displayValue = value || placeholder;
  const isPlaceholder = !value && placeholder;

  return (
    <p
      onClick={handleClick}
      className={`${className} cursor-pointer rounded px-2 py-0.5 transition-colors hover:bg-[hsl(var(--brand-honey))]/10 ${isPlaceholder ? "italic opacity-50" : ""}`}
    >
      {displayValue}
    </p>
  );
}

export default function EventInvitePage() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <EventInviteContent />
    </Suspense>
  );
}
