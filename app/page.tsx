"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Banner from '@/components/landing/Banner'
import Hero from '@/components/landing/Hero'
import TextSection from '@/components/landing/TextSection'
import BooksPrinted from '@/components/landing/BooksPrinted'
import WhatsIncluded from '@/components/landing/WhatsIncluded'
import HowItWorks from '@/components/landing/HowItWorks'
import Guarantee from '@/components/landing/Guarantee'
import CTAButton from '@/components/landing/CTAButton'

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
        <TextSection />
        <BooksPrinted />
        <WhatsIncluded />
        <HowItWorks />
        <Guarantee />

        {/* Repeat CTA at bottom per best practices */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 text-center">
            <CTAButton data-cta="footer-primary" onClick={handleGetStarted} />
          </div>
        </section>
      </main>
    </>
  )
}
