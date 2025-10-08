"use client";

import { useRouter } from "next/navigation";
import Banner from '@/components/Banner'
import Hero from '@/components/Hero'
import TextSection from '@/components/TextSection'
import CookbookShowcase from '@/components/CookbookShowcase'
import ProductShowcase from '@/components/ProductShowcase'
import CollectorTool from '@/components/CollectorTool'
import CTAButton from '@/components/CTAButton'

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
        <CookbookShowcase />
        <ProductShowcase />
        <CollectorTool />

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
