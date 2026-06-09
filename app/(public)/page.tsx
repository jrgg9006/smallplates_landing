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
import RegistryInterlude from '@/components/landing/RegistryInterlude'
import PersonalNotes from '@/components/landing/PersonalNotes'
import PricingBlock from '@/components/landing/PricingBlock'
import TheBook from '@/components/landing/TheBook'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import FAQ from '@/components/landing/FAQ'
import WhatsAppFAB from '@/components/landing/WhatsAppFAB'
import NewsletterSignup from '@/components/landing/NewsletterSignup'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <>
      <Banner />
      <main className="min-h-screen">
        <Hero />
        <TestimonialBar />
        {/* <TheProblem /> — hidden from flow; see import note */}
        <TheSolution />
        <HowItWorks />
        {/* <YourTools /> — removed from flow; see import note */}
        <RegistryInterlude />
        <PricingBlock />
        <BooksPrinted />
        <PersonalNotes />
        <TestimonialsSection />
        <TheBook />
        <EmotionalClose />
        <FAQ />
        <NewsletterSignup />
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  )
}
