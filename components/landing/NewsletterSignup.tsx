"use client";

import { useState } from "react";
import { motion } from "framer-motion";

/**
 * NEWSLETTER SIGNUP — The Kitchen Table
 *
 * Sits between FAQ and Footer on the landing page.
 * Captures emails into newsletter_subscribers via /api/v1/newsletter/subscribe.
 *
 * Voice: Margot Cole — direct, real, no fluff.
 * We send one email a month with the 5 most unexpected recipes people actually sent in.
 */

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/v1/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "landing_page" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data?.error || "Something went wrong. Try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMessage("Something went wrong. Try again.");
      setStatus("error");
    }
  };

  return (
    <section
      className="bg-[#FAF7F2] py-20 md:py-28"
      aria-labelledby="newsletter-heading"
    >
      <div className="mx-auto max-w-2xl px-6 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="type-eyebrow text-[#D4A854] mb-5">
            A Monthly Newsletter
          </p>

          <h2
            id="newsletter-heading"
            className="type-heading text-brand-charcoal"
          >
            One email a month. Real recipes from real kitchens.
          </h2>

          <p className="type-body text-brand-charcoal/70 mt-6 max-w-xl mx-auto">
            Every month we pick the 5 most unexpected, ridiculous, and honest
            recipes people actually sent in for their books. Just real food
            from real people. No fluff.
          </p>

          {status === "success" ? (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="type-body text-brand-charcoal mt-10"
            >
              You&apos;re in. First one lands soon.
            </motion.p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              noValidate
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="your@email.com"
                required
                maxLength={320}
                disabled={status === "loading"}
                className="flex-1 px-4 py-3 bg-white border border-[#E8E0D5] rounded-md font-sans text-base text-brand-charcoal placeholder:text-brand-charcoal/30 focus:outline-none focus:border-[#D4A854] transition-colors disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === "loading" || !email.trim()}
                className="rounded-full bg-[#D4A854] hover:bg-[#c49b4a] text-white px-8 py-3 font-sans font-semibold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {status === "loading" ? "Adding..." : "I'm in"}
              </button>
            </form>
          )}

          {status === "error" && errorMessage && (
            <p className="type-caption text-[#C4856C] mt-3" role="alert">
              {errorMessage}
            </p>
          )}

          {status !== "success" && (
            <p className="type-caption text-brand-charcoal/50 mt-4">
              One email a month. Unsubscribe anytime.
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
