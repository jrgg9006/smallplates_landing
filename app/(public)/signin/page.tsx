"use client";

import { useState } from "react";
import { sendMagicLink, signInWithGoogle } from "@/lib/supabase/auth";
import { isFreeTierEnabled } from "@/lib/feature-flags";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await sendMagicLink(email, {
      allowSignup: isFreeTierEnabled(),
      redirectTo: "/onboarding/about-you",
    });
    if (error) {
      setErrorMsg(error);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  async function handleGoogle() {
    await signInWithGoogle({
      redirectTo: `${window.location.origin}/api/v1/auth/callback?next=/onboarding/about-you`,
    });
  }

  if (status === "sent") {
    return (
      <div className="min-h-screen bg-[hsl(var(--brand-warm-white-airy))]">
        <header className="border-b border-[hsl(var(--brand-sand))]">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <img
              src="/images/SmallPlates_logo_horizontal1.png"
              alt="Small Plates & Co."
              className="w-auto max-w-[140px]"
            />
          </div>
        </header>
        <main className="max-w-md mx-auto px-6 py-20 text-center">
          <h1 className="type-subheading mb-4">Revisa tu correo</h1>
          <p className="type-body-small">
            Te mandamos un link a <span className="font-medium text-brand-charcoal">{email}</span>.
            Toca el link para continuar.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--brand-warm-white-airy))]">
      <header className="border-b border-[hsl(var(--brand-sand))]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <img
            src="/images/SmallPlates_logo_horizontal1.png"
            alt="Small Plates & Co."
            className="w-auto max-w-[140px]"
          />
        </div>
      </header>

      <main className="max-w-[420px] mx-auto px-6 py-16">
        <h1 className="type-subheading mb-2">Empieza tu libro</h1>
        <p className="type-body-small mb-8">
          Sin compromiso. Creas tu evento, invitas a tu gente, y decides después si imprimes.
        </p>

        <form onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="signin-email" className="input-label">Correo</label>
            <input
              id="signin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <button
            type="submit"
            disabled={status === "sending"}
            className="btn btn-md btn-honey btn-form w-full"
          >
            {status === "sending" ? "Enviando…" : "Continuar con correo"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[hsl(var(--brand-sand))]" />
          <span className="type-caption">o</span>
          <div className="flex-1 h-px bg-[hsl(var(--brand-sand))]" />
        </div>

        <button
          onClick={handleGoogle}
          className="btn btn-md btn-outline btn-form w-full"
        >
          Continuar con Google
        </button>

        <p className="type-caption mt-6 text-center">
          Al continuar, aceptas nuestros{" "}
          <a href="/terms" target="_blank" rel="noreferrer" className="underline hover:text-brand-charcoal">Términos de Servicio</a>
          {" "}y nuestra{" "}
          <a href="/privacy" target="_blank" rel="noreferrer" className="underline hover:text-brand-charcoal">Política de Privacidad</a>.
        </p>

        {status === "error" && (
          <p className="mt-4 text-sm text-red-600">{errorMsg}</p>
        )}
      </main>
    </div>
  );
}
