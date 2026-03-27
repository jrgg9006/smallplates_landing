"use client";

import { useState } from "react";

const inputClass = "w-full px-4 py-3.5 bg-white border border-[#E8E0D5] rounded-xl text-[15px] text-[#2D2D2D] outline-none transition-all focus:ring-2 focus:ring-[#D4A854] focus:border-transparent";

export default function RecoverSetupPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/resend-setup-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        setError("Something went wrong. Try again.");
        setSending(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Try again.");
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8F4" }}>
      <div className="max-w-[440px] w-full mx-auto px-6 py-8 flex flex-col items-center">
        <img
          src="/images/SmallPlates_logo_horizontal1.png"
          alt="Small Plates & Co."
          className="w-auto max-w-[160px] mb-10"
        />

        {sent ? (
          <>
            <h1
              className="text-center mb-3 font-serif text-[32px] font-light leading-[1.2] text-[#2D2D2D]"
            >
              Check your email.
            </h1>
            <p
              className="text-center text-[15px] text-[#6B6560] mb-8 leading-relaxed"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              We sent a fresh login link to{" "}
              <span className="font-medium text-[#2D2D2D]">{email}</span>.
              <br />
              Click it to pick up where you left off.
            </p>
            <button
              onClick={() => { setSent(false); setSending(false); }}
              className="text-[14px] text-[#9A9590] underline underline-offset-2 hover:text-[#2D2D2D] transition-colors"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              Didn&apos;t get it? Send again
            </button>
          </>
        ) : (
          <>
            <h1
              className="text-center mb-3 font-serif text-[32px] font-light leading-[1.2] text-[#2D2D2D]"
            >
              Let&apos;s get you back in.
            </h1>
            <p
              className="text-center text-[15px] text-[#6B6560] mb-8 leading-relaxed"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              Enter the email you used to pay and we&apos;ll send you a new login link.
            </p>

            <div className="w-full space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                className={inputClass}
                placeholder="your@email.com"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
                autoFocus
              />

              {error && (
                <p className="text-sm text-red-500" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!email.trim() || sending}
                className={`w-full py-4 px-6 rounded-xl text-[15px] font-medium transition-colors ${
                  email.trim() && !sending
                    ? "bg-[#2D2D2D] text-white hover:bg-[#1a1a1a]"
                    : "bg-gray-300 text-gray-400 cursor-not-allowed"
                }`}
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                {sending ? "Sending..." : "Send me a link"}
              </button>
            </div>
          </>
        )}

        <p
          className="text-center text-[13px] text-[#9A9590] mt-6"
          style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
        >
          Still having trouble?{" "}
          <a href="mailto:team@smallplatesandcompany.com" className="text-[#D4A854] hover:underline">
            team@smallplatesandcompany.com
          </a>
        </p>
      </div>
    </div>
  );
}
