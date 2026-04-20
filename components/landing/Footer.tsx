"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BookDetailsModal from './BookDetailsModal';
import RegistryHowToModal from './RegistryHowToModal';
import { trackEvent } from '@/lib/analytics';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isBookDetailsOpen, setIsBookDetailsOpen] = useState(false);
  const [isRegistryHowToOpen, setIsRegistryHowToOpen] = useState(false);
  
  return (
    <footer className="bg-brand-charcoal">
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
            <p className="mt-6 font-serif text-xl text-brand-honey italic">
              Still at the table.
            </p>
            
            {/* Descriptor */}
            <p className="mt-4 type-body-small text-white/60 max-w-sm">
              Wedding cookbooks made by the people who love you.
              Not keepsakes—kitchen books.
            </p>
          </div>
          
          {/* Links */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-2 gap-8">
              {/* Product */}
              <div>
                <h3 className="type-eyebrow text-white/40 mb-4">
                  Product
                </h3>
                <ul className="space-y-3">
                  <li>
                    <span 
                      className="font-sans font-light text-base text-white/30 cursor-not-allowed"
                    >
                      How It Works
                    </span>
                  </li>
                  <li>
                    <Link
                      href="/onboarding"
                      onClick={() => trackEvent('start_book_click', { cta_location: 'footer_nav' })}
                      className="font-sans font-light text-base text-white/70 hover:text-white transition-colors"
                    >
                      Get Started
                    </Link>
                  </li>
                  <li>
                    <button 
                      onClick={() => setIsBookDetailsOpen(true)}
                      className="font-sans font-light text-base text-white/70 hover:text-white transition-colors text-left"
                    >
                      Book Specifications
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setIsRegistryHowToOpen(true)}
                      className="font-sans font-light text-base text-white/70 hover:text-white transition-colors text-left"
                    >
                      How to add to your registry
                    </button>
                  </li>
                  <li>
                    <Link 
                      href="/pricing" 
                      className="font-sans font-light text-base text-white/70 hover:text-white transition-colors"
                    >
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="type-eyebrow text-white/40 mb-4">
                  Company
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link 
                      href="/about" 
                      className="font-sans font-light text-base text-white/70 hover:text-white transition-colors"
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="font-sans font-light text-base text-white/70 hover:text-white transition-colors"
                    >
                      Contact
                    </Link>
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
              onClick={() => trackEvent('start_book_click', { cta_location: 'footer_card' })}
              className="inline-flex items-center justify-center rounded-full bg-brand-honey hover:bg-[#c49b4a] text-white px-6 py-3 text-base font-medium transition-colors"
            >
              Start the Book
            </Link>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Copyright */}
            <p className="font-sans font-light text-sm text-white/40">
              © {currentYear} Small Plates & Co. All rights reserved.
            </p>

            {/* Legal Links */}
            <div className="flex items-center gap-6">
              <Link 
                href="/privacy" 
                className="font-sans font-light text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Privacy
              </Link>
              <Link 
                href="/terms" 
                className="font-sans font-light text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Terms
              </Link>
            </div>

          </div>
        </div>
      </div>
      
      {/* Book Details Modal */}
      <BookDetailsModal 
        isOpen={isBookDetailsOpen} 
        onClose={() => setIsBookDetailsOpen(false)} 
      />

      {/* Registry How-To Modal */}
      <RegistryHowToModal
        isOpen={isRegistryHowToOpen}
        onClose={() => setIsRegistryHowToOpen(false)}
      />
    </footer>
  );
}