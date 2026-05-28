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
  coupleImageUrl,
  coupleImagePositionX,
  coupleImagePositionY,
  collectionUrl,
}: EventInviteLandingProps) {
  return (
    <div className="min-h-screen bg-[hsl(var(--brand-warm-white))] flex flex-col">
      {/* Header */}
      <header className="py-4 flex justify-center">
        <Image
          src="/images/SmallPlates_logo_horizontal.png"
          alt="Small Plates & Co."
          width={140}
          height={32}
          className="opacity-50"
        />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-[hsl(var(--brand-border))] overflow-hidden">
          {/* Card content */}
          <div className="px-8 pt-10 pb-8 text-center">
            {/* Couple photo */}
            {coupleImageUrl && (
              <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-6 border-3 border-white shadow-lg">
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

            {/* Couple names */}
            <h1 className="font-serif text-[32px] text-[hsl(var(--brand-charcoal))] leading-tight mb-3">
              {coupleName}
            </h1>

            {/* Decorative line */}
            <div className="w-14 h-px bg-[hsl(var(--brand-honey))] mx-auto my-4" />

            {/* Tagline */}
            <p className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--brand-warm-gray))] mb-6">
              {tagline}
            </p>

            {/* Event details */}
            {eventDate && (
              <p className="text-[16px] font-medium text-[hsl(var(--brand-charcoal))] mb-1">
                {formatDate(eventDate)}
                {eventTime && ` · ${formatTime(eventTime)}`}
              </p>
            )}
            {eventLocation && (
              <p className="text-[15px] text-[hsl(var(--brand-warm-gray))] mb-6">
                {eventLocation}
              </p>
            )}

            {/* Message */}
            <p className="text-[14px] text-[hsl(var(--brand-warm-gray))] leading-relaxed max-w-[340px] mx-auto mb-8">
              {message}
            </p>

            {/* CTA */}
            <Link
              href={collectionUrl}
              className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-[hsl(var(--brand-honey))] text-white text-[16px] font-medium hover:bg-[hsl(var(--brand-honey-dark))] transition-colors shadow-sm"
            >
              Share a Recipe →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 flex justify-center">
        <Image
          src="/images/SmallPlates_logo_horizontal.png"
          alt="Small Plates & Co."
          width={100}
          height={24}
          className="opacity-30"
        />
      </footer>
    </div>
  );
}
