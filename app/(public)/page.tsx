"use client";

import React from "react";
import Banner from '@/components/landing/Banner'
import Hero from '@/components/landing/Hero'
import TheProblem from '@/components/landing/TheProblem'
import TheSolution from '@/components/landing/TheSolution'
import YourTools from '@/components/landing/YourTools'
import EmotionalClose from '@/components/landing/EmotionalClose'
import BooksPrinted from '@/components/landing/BooksPrinted'
import HowItWorks from '@/components/landing/HowItWorks'
import RegistryInterlude from '@/components/landing/RegistryInterlude'
import PersonalNotes from '@/components/landing/PersonalNotes'
import TheBook from '@/components/landing/TheBook'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import FAQ from '@/components/landing/FAQ'
import NewsletterSignup from '@/components/landing/NewsletterSignup'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <>
      <Banner />
      <main className="min-h-screen">
        <Hero />
        <TheProblem />
        <TheSolution />
        <HowItWorks />
        <YourTools />
        <RegistryInterlude />
        <BooksPrinted />
        <PersonalNotes />
        <TheBook />
        <TestimonialsSection />
        <EmotionalClose />
        <FAQ />
        <NewsletterSignup />
      </main>
      <Footer />
    </>
  )
}
