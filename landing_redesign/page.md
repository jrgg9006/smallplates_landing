"use client";

import React from "react";

/**
 * LANDING PAGE — Small Plates Wedding
 * 
 * Narrative Flow (in order):
 * 
 * 1. BANNER — Navigation + credibility
 * 2. HERO — Hook + wedding context + CTA primario
 * 3. THE PROBLEM — Enemigo cultural (regalo forgettable)
 * 4. THE SOLUTION — Qué es Small Plates
 * 5. HOW IT WORKS — 3 pasos simples
 * 6. PROOF (BooksPrinted) — Libros reales, credibilidad
 * 7. FOR GIFT GIVERS — Sección para organizadoras
 * 8. EMOTIONAL CLOSE — "Still at the table"
 * 9. FAQ — Resolver dudas finales
 * 10. FOOTER — Con brand line
 * 
 * Logic:
 * - Hook (captura atención)
 * - Problem (crea tensión)
 * - Solution (presenta la respuesta)
 * - How (elimina fricción)
 * - Proof (demuestra que es real)
 * - Gift Givers (captura segundo audience)
 * - Emotional Close (cierra con el "por qué" profundo)
 * - FAQ (resuelve objeciones)
 * 
 * Voice: Margot Cole throughout.
 * "Cool on the outside. Emotional on the inside."
 * We don't lead with tears—we earn them.
 */

// Components
import Banner from '@/components/landing/Banner';
import Hero from '@/components/landing/Hero';
import TheProblem from '@/components/landing/TheProblem';
import TheSolution from '@/components/landing/TheSolution';
import HowItWorks from '@/components/landing/HowItWorks';
import BooksPrinted from '@/components/landing/BooksPrinted';
import ForGiftGivers from '@/components/landing/ForGiftGivers';
import EmotionalClose from '@/components/landing/EmotionalClose';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <>
      {/* Navigation */}
      <Banner />

      <main className="min-h-screen">
        {/* 1. Hook — First impression, sets the tone */}
        <Hero />

        {/* 2. The Problem — Create tension (the forgettable gift) */}
        <TheProblem />

        {/* 3. The Solution — Present Small Plates as the answer */}
        <TheSolution />

        {/* 4. How It Works — Remove friction, show simplicity */}
        <HowItWorks />

        {/* 5. Proof — Real books, real recipes, real credibility */}
        <BooksPrinted />

        {/* 6. For Gift Givers — Capture second audience (organizers) */}
        <ForGiftGivers />

        {/* 7. Emotional Close — "Still at the table" */}
        <EmotionalClose />

        {/* 8. FAQ — Resolve final objections */}
        <FAQ />
      </main>

      {/* Footer with brand line */}
      <Footer />
    </>
  );
}