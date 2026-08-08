"use client";

import React from "react";
import Banner from '@/components/landing/Banner'
import Hero from '@/components/landing/Hero'
import TestimonialBar from '@/components/landing/TestimonialBar'
// import TheProblem from '@/components/landing/TheProblem' // Hidden from flow: standalone text-only "belief" beat was a speed bump before the product. Component kept for later reuse.
import TheSolution from '@/components/landing/TheSolution'
// import YourTools from '@/components/landing/YourTools' // Removed from flow: redundant 2nd card grid after HowItWorks; component kept for later reuse
import EmotionalClose from '@/components/landing/EmotionalClose'
import BooksPrinted from '@/components/landing/BooksPrinted'
import HowItWorks from '@/components/landing/HowItWorks'
// import RegistryInterlude from '@/components/landing/RegistryInterlude' // Hidden from flow: registry interlude paused per founder; component kept for later reuse
import CookbookSpecialist from '@/components/landing/CookbookSpecialist'
import PersonalNotes from '@/components/landing/PersonalNotes'
import PricingBlock from '@/components/landing/PricingBlock'
import TheBook from '@/components/landing/TheBook'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import FAQ from '@/components/landing/FAQ'
import WhatsAppFAB from '@/components/landing/WhatsAppFAB'
import NewsletterSignup from '@/components/landing/NewsletterSignup'
import Footer from '@/components/landing/Footer'
import ProductRouter from '@/components/landing/ProductRouter'
import TheClub from '@/components/landing/TheClub'
import TheTiles from '@/components/landing/TheTiles'
import { isClubEnabled, isTilesEnabled } from '@/lib/feature-flags'

export default function Home() {
  const showClub = isClubEnabled()
  const showTiles = isTilesEnabled()

  return (
    <>
      <Banner />
      <main className="min-h-screen">
        <Hero />
        <TestimonialBar />
        <ProductRouter showClub={showClub} showTiles={showTiles} />
        {/* <TheProblem /> — hidden from flow; see import note */}
        <HowItWorks showTilesToggle={showTiles} />
        {showClub && <TheClub />}
        <TheSolution />
        {/* <YourTools /> — removed from flow; see import note */}
        {/* <RegistryInterlude /> — hidden from flow; see import note */}
        <CookbookSpecialist />
        <PricingBlock />
        <BooksPrinted />
        <PersonalNotes />
        <TestimonialsSection />
        <TheBook />
        {showTiles && <TheTiles />}
        <EmotionalClose />
        <FAQ showClub={showClub} showTiles={showTiles} />
        <NewsletterSignup />
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  )
}
