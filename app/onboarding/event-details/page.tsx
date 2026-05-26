"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";

function EventDetailsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const groupId = params.get("groupId");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  const nextHref = `/onboarding/personalize-invite?groupId=${groupId}`;

  function handleContinue() {
    // Reason: event_date and event_location columns deferred to M2.
    router.push(nextHref);
  }

  return (
    <OnboardingShell
      title="When and where is the event?"
      subtitle="Optional. This will appear on your event page."
      backHref={`/onboarding/co-organizer?groupId=${groupId}`}
      skipHref={nextHref}
      onContinue={handleContinue}
    >
      <div className="space-y-3">
        <div>
          <label htmlFor="event-date" className="input-label">Date and time</label>
          <input
            id="event-date"
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="input-field max-w-xs"
          />
        </div>
        <div>
          <label htmlFor="event-location" className="input-label">Location</label>
          <input
            id="event-location"
            type="text"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            className="input-field"
            placeholder="Maria's house, 123 Main St"
          />
        </div>
      </div>
    </OnboardingShell>
  );
}

export default function EventDetailsPage() {
  return (
    <Suspense>
      <EventDetailsContent />
    </Suspense>
  );
}
