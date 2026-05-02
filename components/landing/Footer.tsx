"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BookDetailsModal from './BookDetailsModal';
import RegistryHowToModal from './RegistryHowToModal';
import { trackEvent } from '@/lib/analytics';

const WA_URL = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '526142256589'}?text=${encodeURIComponent('Hi, I have a question about Small Plates & Co.')}`;

function WhatsAppIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

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
                  <li>
                    <a
                      href={WA_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackEvent('whatsapp_click', { cta_location: 'footer' })}
                      className="inline-flex items-center gap-1.5 font-sans font-light text-base text-white/70 hover:text-white transition-colors"
                    >
                      <WhatsAppIcon />
                      Chat on WhatsApp
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
              onClick={() => trackEvent('start_book_click', { cta_location: 'footer_card' })}
              className="btn btn-sm btn-honey"
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