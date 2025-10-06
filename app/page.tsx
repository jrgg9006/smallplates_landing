import Banner from '@/components/Banner'
import Hero from '@/components/Hero'
import ProductShowcase from '@/components/ProductShowcase'
import CollectorTool from '@/components/CollectorTool'
import CTAButton from '@/components/CTAButton'

export default function Home() {
  return (
    <>
      <Banner />
      <main className="min-h-screen">
        <Hero />
        <ProductShowcase />
        <CollectorTool />

        {/* Repeat CTA at bottom per best practices */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 text-center">
            <CTAButton data-cta="footer-primary" />
          </div>
        </section>
      </main>
    </>
  )
}
