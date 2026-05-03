"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";
import { useAuth } from "@/lib/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";

export default function Banner() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-50">
        {/* Shipping announcement strip */}
        <div className="py-2.5 text-center border-b border-white/20">
          <span className="sm:hidden font-sans text-[11px] font-medium tracking-[0.15em] uppercase text-white">
            Ships to US, MX &amp; EU
          </span>
          <span className="hidden sm:inline font-sans text-[11px] font-medium tracking-[0.15em] uppercase text-white">
            Ships free to United States, Mexico, and European Union.
          </span>
        </div>

        <header role="banner" aria-label="Top banner">
          <div className="mx-auto max-w-7xl px-6 md:px-8 h-16 flex items-center justify-between">
            {/* Mobile: empty div for centering logo */}
            <div className="lg:hidden w-10"></div>

            {/* Logo */}
            <div className="flex-shrink-0 lg:flex-none">
              <Link href="/" className="inline-block">
                <Image
                  src="/images/SmallPlates_logo_horizontal.png"
                  alt="Small Plates & Company"
                  width={200}
                  height={40}
                  priority
                  className="brightness-0 invert"
                />
              </Link>
            </div>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <Link
                  href="/profile/groups"
                  className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-white/60 text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                >
                  Go to Profile
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="font-medium text-white/80 hover:text-white transition-colors"
                  >
                    Login
                  </button>
                  <Link
                    href="/onboarding"
                    onClick={() => trackEvent("start_book_click", { cta_location: "header_nav_desktop" })}
                    className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-white/60 text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                  >
                    Start the Book
                  </Link>
                </>
              )}
            </div>

            {/* Mobile burger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-white hover:text-white/80 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile dropdown */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              isMobileMenuOpen ? "max-h-64" : "max-h-0"
            }`}
          >
            <div className="px-6 py-5 flex flex-col gap-3">
              {user ? (
                <Link
                  href="/profile/groups"
                  className="block w-full text-center py-3 px-4 rounded-full border border-white/60 text-white font-semibold hover:bg-white/10 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Go to Profile
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsLoginModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-center py-3 px-4 rounded-full border border-white/60 bg-black/70 text-white font-semibold hover:bg-black/90 transition-colors"
                  >
                    Login
                  </button>
                  <Link
                    href="/onboarding"
                    className="block w-full text-center py-3 px-4 rounded-full border border-white/60 bg-black/70 text-white font-semibold hover:bg-black/90 transition-colors"
                    onClick={() => {
                      trackEvent("start_book_click", { cta_location: "header_nav_mobile" });
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Start the Book
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
