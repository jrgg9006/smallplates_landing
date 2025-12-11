"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function Banner() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <>
      <header
        role="banner"
        aria-label="Top banner"
        className="w-full bg-white border-b border-gray-100 relative"
      >
        <div className="mx-auto max-w-7xl px-6 md:px-8 h-16 flex items-center justify-between lg:justify-between">
          {/* Mobile: Empty space for centering logo */}
          <div className="lg:hidden w-10"></div>
          
          {/* Logo - Centered on mobile, left on desktop */}
          <div className="flex-shrink-0 lg:flex-none">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Company"
              width={200}
              height={40}
              priority
            />
          </div>

          {/* Desktop Navigation Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <Link
                href="/profile/groups"
                className="inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-2 text-sm font-semibold hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
              >
                Go to Profile
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Login
                </button>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-2 text-sm font-semibold hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
                >
                  Start your Book
                </Link>
              </>
            )}
          </div>

          {/* Mobile Burger Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
        </div>

        {/* Mobile Menu with Push Down Effect */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-64 border-b border-gray-100' : 'max-h-0'
          }`}
        >
          <div className="bg-white px-6 py-4 space-y-4">
            {user ? (
              <Link
                href="/profile/groups"
                className="block w-full text-center py-3 px-4 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
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
                  className="block w-full text-center py-3 px-4 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Login
                </button>
                <Link
                  href="/onboarding"
                  className="block w-full text-center py-3 px-4 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Start your Book
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
