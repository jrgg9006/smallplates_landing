"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Banner from '@/components/landing/Banner'
import Hero from '@/components/landing/Hero'
import FeatureGrid from '@/components/landing/FeatureGrid'
import TextSection from '@/components/landing/TextSection'
import WellWhatIf from '@/components/landing/WellWhatIf'
import BooksPrinted from '@/components/landing/BooksPrinted'
import FoodPerfect from '@/components/landing/FoodPerfect'
import WhatsIncluded from '@/components/landing/WhatsIncluded'
import HowItWorks from '@/components/landing/HowItWorks'
import ShareBanner from '@/components/landing/ShareBanner'
// import PlayModeSelection from '@/components/landing/PlayModeSelection'
import MemorableExperience from '@/components/landing/MemorableExperience'
import FAQ from '@/components/landing/FAQ'
// import Guarantee from '@/components/landing/Guarantee'
import CTAButton from '@/components/landing/CTAButton'
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
        <FeatureGrid />
        <TextSection />
        <WellWhatIf />
        <BooksPrinted />
        <FoodPerfect />
        <WhatsIncluded />
        <HowItWorks />
        <ShareBanner />
        {/* <PlayModeSelection /> */}
        <MemorableExperience />
        <FAQ />
        {/* <Guarantee /> */}

        {/* Repeat CTA at bottom per best practices */}
        {/* <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 text-center">
            <CTAButton data-cta="footer-primary" onClick={handleGetStarted} />
          </div>
        </section> */}
      </main>
      <Footer />
    </>
  )
}
