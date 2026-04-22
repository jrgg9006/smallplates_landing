"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Banner from '@/components/landing/Banner'
import Hero from '@/components/landing/Hero'
import TheProblem from '@/components/landing/TheProblem'
import TheSolution from '@/components/landing/TheSolution'
import ForGiftGivers from '@/components/landing/ForGiftGivers'
import YourTools from '@/components/landing/YourTools'
import EmotionalClose from '@/components/landing/EmotionalClose'
import BooksPrinted from '@/components/landing/BooksPrinted'
import HowItWorks from '@/components/landing/HowItWorks'
import GuestListStrip from '@/components/landing/GuestListStrip'
import RegistryInterlude from '@/components/landing/RegistryInterlude'
import PersonalNotes from '@/components/landing/PersonalNotes'
import TheBook from '@/components/landing/TheBook'
import FAQ from '@/components/landing/FAQ'
import NewsletterSignup from '@/components/landing/NewsletterSignup'
import Footer from '@/components/landing/Footer'

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/onboarding");
  };

  return (
    <>
      <Banner />
      <main className="min-h-screen">
        <Hero />
        <TheProblem />
        <TheSolution />
        <HowItWorks />
        <YourTools />
        {/* <GuestListStrip /> */}
        <RegistryInterlude />
        <BooksPrinted />
        <PersonalNotes />
        <TheBook />
        {/* <ForGiftGivers /> */}
        <EmotionalClose />
        <FAQ />
        <NewsletterSignup />
      </main>
      <Footer />
    </>
  )
}
