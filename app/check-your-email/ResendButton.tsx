"use client";

import { useState, useEffect } from "react";

interface ResendButtonProps {
  sessionId: string;
}

export default function ResendButton({ sessionId }: ResendButtonProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Reason: Countdown decrements once per second while cooldown is active.
  // The effect re-subscribes each change to cooldownSeconds, so the captured
  // value is always fresh — no stale-closure risk.
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timeout = setTimeout(() => {
      setCooldownSeconds(cooldownSeconds - 1);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [cooldownSeconds]);

  // Reason: When the cooldown finishes while we're still in "sent" state,
  // return to idle so the button becomes clickable again.
  useEffect(() => {
    if (cooldownSeconds === 0 && status === "sent") {
      setStatus("idle");
    }
  }, [cooldownSeconds, status]);

  const handleClick = async () => {
    if (status !== "idle") return;
    setStatus("sending");

    try {
      const response = await fetch("/api/stripe/resend-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
        return;
      }

      setStatus("sent");
      setCooldownSeconds(30);
    } catch (err) {
      console.error("Resend error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const buttonText = (() => {
    if (status === "sending") return "Sending…";
    if (status === "error") return "Couldn't send. Try again.";
    if (status === "sent") {
      // Reason: First 3 seconds show "Link sent" (cooldownSeconds = 30, 29, 28),
      // then the visible countdown kicks in from "Wait 27s…" down to 0.
      if (cooldownSeconds > 27) return "Link sent";
      return `Wait ${cooldownSeconds}s…`;
    }
    return "Resend link";
  })();

  const disabled = status !== "idle";

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`type-caption underline decoration-dotted underline-offset-4 transition-colors ${
        disabled
          ? "text-[#9A9590] cursor-not-allowed"
          : "text-[#5A5550] hover:text-[#2D2D2D]"
      }`}
    >
      {buttonText}
    </button>
  );
}
