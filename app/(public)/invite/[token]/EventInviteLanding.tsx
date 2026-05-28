"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface EventInviteLandingProps {
  coupleName: string;
  tagline: string;
  message: string;
  eventDate: string | null;
  eventTime: string | null;
  eventLocation: string | null;
  eventVenue?: string | null;
  coupleImageUrl: string | null;
  coupleImagePositionX: number;
  coupleImagePositionY: number;
  collectionUrl: string;
}

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
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

export function EventInviteLanding({
  coupleName,
  tagline,
  message,
  eventDate,
  eventTime,
  eventLocation,
  eventVenue,
  coupleImageUrl,
  coupleImagePositionX,
  coupleImagePositionY,
  collectionUrl,
}: EventInviteLandingProps) {
  return (
    <div className="min-h-screen bg-[hsl(var(--brand-warm-white))] relative">
      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-6 md:px-16 pt-10 pb-10">
        {/* Header */}
        <p className="text-[11px] uppercase tracking-[0.25em] text-[hsl(var(--brand-warm-gray))] mb-12 md:mb-20 text-left">
          SMALL PLATES & CO. <span className="font-bold text-[hsl(var(--brand-charcoal))]">INVITE</span>
        </p>

        {/* Mobile — couple image centered */}
        {coupleImageUrl && (
          <div className="md:hidden w-[200px] h-[200px] rounded-lg overflow-hidden mx-auto mb-8 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coupleImageUrl}
              alt={coupleName}
              className="w-full h-full object-cover"
              style={{
                objectPosition: `${coupleImagePositionX}% ${coupleImagePositionY}%`,
              }}
            />
          </div>
        )}

        <div className="flex flex-row gap-8 md:gap-12">
          {/* Left — text content */}
          <div className="flex-1 text-center max-w-[440px] mx-auto">
            <h1 className="font-serif text-[36px] md:text-[52px] font-medium text-[hsl(var(--brand-charcoal))] mb-4 leading-[1.1]">
              {coupleName}
            </h1>

            <div className="mt-10 md:mt-12 mb-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--brand-warm-gray))] mb-2">Hosted by</p>
              <p className="text-[14px] uppercase tracking-[0.15em] text-[hsl(var(--brand-charcoal))] font-medium">
                {tagline}
              </p>
            </div>

            <div className="w-full h-px bg-[hsl(var(--brand-charcoal))]/20 my-10" />

            {eventDate && (
              <>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--brand-warm-gray))] mb-2">When</p>
                <p className="text-[14px] text-[hsl(var(--brand-charcoal))] font-medium uppercase tracking-wide">
                  {formatDate(eventDate)}
                  {eventTime && ` · ${formatTime(eventTime)}`}
                </p>
              </>
            )}

            {(eventLocation || eventVenue) && (
              <>
                <div className="my-10" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--brand-warm-gray))] mb-2">Where</p>
                {eventVenue && (
                  <p className="text-[14px] text-[hsl(var(--brand-charcoal))] font-medium uppercase tracking-wide">
                    {eventVenue}
                  </p>
                )}
                {eventLocation && (
                  <p className="text-[14px] text-[hsl(var(--brand-charcoal))] font-medium uppercase tracking-wide">
                    {eventLocation}
                  </p>
                )}
              </>
            )}

            <div className="w-full h-px bg-[hsl(var(--brand-border))] my-10" />

            <div className="bg-[hsl(var(--brand-sand))]/40 rounded-xl px-6 py-5">
              <p className="text-[15px] text-[hsl(var(--brand-charcoal))] leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Right — couple image (desktop only) */}
          {coupleImageUrl && (
            <div className="hidden md:block w-[40%] flex-shrink-0 self-start">
              <div className="aspect-square rounded-lg overflow-hidden shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coupleImageUrl}
                  alt={coupleName}
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: `${coupleImagePositionX}% ${coupleImagePositionY}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sticky Share a Recipe button — mirrors the content layout to align with left column */}
        <div className="sticky bottom-6 z-50 mt-12">
          <div className="flex flex-row gap-8 md:gap-12">
            <div className="flex-1 flex justify-center max-w-[440px] mx-auto">
              <Link
                href={collectionUrl}
                className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-[hsl(var(--brand-honey))] text-white text-[15px] font-medium hover:bg-[hsl(var(--brand-honey-dark))] transition-colors shadow-lg whitespace-nowrap"
              >
                Share a Recipe →
              </Link>
            </div>
            <div className="hidden md:block w-[40%] flex-shrink-0" />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 flex flex-col items-center gap-3">
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates & Co."
            width={200}
            height={48}
            className="h-20 w-auto opacity-70"
          />
          <div className="flex items-center gap-4 text-[10px] text-[hsl(var(--brand-warm-gray))]">
            <Link href="/terms" target="_blank" className="hover:text-[hsl(var(--brand-charcoal))] transition-colors">Terms and Privacy</Link>
            <span>·</span>
            <a href="mailto:hello@smallplatesandcompany.com" className="hover:text-[hsl(var(--brand-charcoal))] transition-colors">Help</a>
          </div>
          <p className="text-[10px] text-[hsl(var(--brand-warm-gray))]">© {new Date().getFullYear()} Small Plates & Co.</p>
        </div>
      </main>

    </div>
  );
}
