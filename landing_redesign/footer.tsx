import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * FOOTER — Small Plates Wedding Landing Page
 * 
 * Voice: Margot Cole
 * Purpose: Close the page with brand presence. Not a dumping ground for links.
 * 
 * Key elements:
 * - Brand line: "Still at the table." — signature moment
 * - Clean, minimal links — only what matters
 * - Warm but not cluttered
 * 
 * Design rationale:
 * - Dark background (Soft Charcoal) — anchors the page
 * - Logo prominent but not overwhelming
 * - Social links subtle — Margot doesn't beg for follows
 */

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#2D2D2D]">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          
          {/* Logo and Brand Line */}
          <div className="lg:col-span-5">
            <Link href="/" className="inline-block">
              <Image
                src="/images/SmallPlates_logo_horizontal.png"
                alt="Small Plates & Co."
                width={200}
                height={40}
                className="brightness-0 invert"
              />
            </Link>
            
            {/* Brand Line */}
            <p className="mt-6 font-serif text-xl text-[#D4A854] italic">
              Still at the table.
            </p>
            
            {/* Descriptor */}
            <p className="mt-4 font-sans text-base text-white/60 max-w-sm">
              Wedding cookbooks made by the people who love you.
              Not keepsakes—kitchen books.
            </p>
          </div>

          {/* Links */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-2 gap-8">
              {/* Product */}
              <div>
                <h3 className="font-sans text-sm font-medium uppercase tracking-wider text-white/40 mb-4">
                  Product
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link 
                      href="/how-it-works" 
                      className="font-sans text-base text-white/70 hover:text-white transition-colors"
                    >
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/pricing" 
                      className="font-sans text-base text-white/70 hover:text-white transition-colors"
                    >
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/examples" 
                      className="font-sans text-base text-white/70 hover:text-white transition-colors"
                    >
                      Example Books
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="font-sans text-sm font-medium uppercase tracking-wider text-white/40 mb-4">
                  Company
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link 
                      href="/about" 
                      className="font-sans text-base text-white/70 hover:text-white transition-colors"
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <a 
                      href="mailto:hello@smallplates.co" 
                      className="font-sans text-base text-white/70 hover:text-white transition-colors"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="lg:col-span-3">
            <h3 className="font-sans text-sm font-medium uppercase tracking-wider text-white/40 mb-4">
              Ready?
            </h3>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-full bg-[#D4A854] hover:bg-[#c49b4a] text-white px-6 py-3 text-base font-medium transition-colors"
            >
              Start Your Book
            </Link>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Copyright */}
            <p className="font-sans text-sm text-white/40">
              © {currentYear} Small Plates & Co. All rights reserved.
            </p>

            {/* Legal Links */}
            <div className="flex items-center gap-6">
              <Link 
                href="/privacy" 
                className="font-sans text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Privacy
              </Link>
              <Link 
                href="/terms" 
                className="font-sans text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Terms
              </Link>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}