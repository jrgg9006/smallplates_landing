"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ContactForm() {
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [couple, setCouple] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reason: Allow deep links from broken email links to pre-fill context
  // (e.g. /contact?group=xxx&context=collect)
  const groupParam = searchParams.get("group");
  const contextParam = searchParams.get("context");

  useEffect(() => {
    if (groupParam && !couple) {
      setCouple(`Group ID: ${groupParam}`);
    }
    // Intentionally only on mount-equivalent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Name, email, and message are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          couple: couple.trim(),
          message: message.trim(),
          context: contextParam || "",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <h2 className="type-heading mb-4">Got it.</h2>
        <div className="w-12 h-px bg-brand-honey mx-auto mb-6"></div>
        <p className="type-body-small max-w-sm mx-auto">
          We&rsquo;ll get back to you within 24 hours. Usually faster.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="contact-name"
          className="block font-sans text-sm font-medium text-brand-charcoal mb-2"
        >
          Your name
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          required
          maxLength={200}
          className="w-full px-4 py-3 bg-white border border-[#E8E0D5] rounded-md font-sans text-base text-brand-charcoal focus:outline-none focus:border-brand-honey transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="block font-sans text-sm font-medium text-brand-charcoal mb-2"
        >
          Your email
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          required
          maxLength={320}
          className="w-full px-4 py-3 bg-white border border-[#E8E0D5] rounded-md font-sans text-base text-brand-charcoal focus:outline-none focus:border-brand-honey transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="contact-couple"
          className="block font-sans text-sm font-medium text-brand-charcoal mb-2"
        >
          Who&rsquo;s getting married?{" "}
          <span className="text-brand-charcoal/40 font-normal">(optional)</span>
        </label>
        <input
          id="contact-couple"
          type="text"
          value={couple}
          onChange={(e) => setCouple(e.target.value)}
          disabled={submitting}
          maxLength={200}
          placeholder="e.g. Jill and Juan"
          className="w-full px-4 py-3 bg-white border border-[#E8E0D5] rounded-md font-sans text-base text-brand-charcoal placeholder:text-brand-charcoal/30 focus:outline-none focus:border-brand-honey transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block font-sans text-sm font-medium text-brand-charcoal mb-2"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
          required
          rows={6}
          maxLength={5000}
          className="w-full px-4 py-3 bg-white border border-[#E8E0D5] rounded-md font-sans text-base text-brand-charcoal focus:outline-none focus:border-brand-honey transition-colors resize-none"
        />
      </div>

      {error && (
        <p className="font-sans text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-brand-honey hover:bg-[#c49b4a] disabled:bg-brand-honey/50 disabled:cursor-not-allowed text-white font-sans font-medium text-base px-6 py-4 rounded-full transition-colors"
      >
        {submitting ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
