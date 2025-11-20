"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import LoginModal from "@/components/auth/LoginModal";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Menu, X } from "lucide-react";

export default function Banner() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        role="banner"
        aria-label="Top banner"
        className="w-full bg-white border-b border-gray-100"
      >
        <div className="mx-auto max-w-7xl px-6 md:px-8 h-16 flex items-center justify-between">
          {/* Mobile Layout */}
          <div className="md:hidden flex items-center justify-between w-full">
            {/* Placeholder for centering logo */}
            <div className="w-10"></div>
            
            {/* Centered Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/images/SmallPlates_logo_horizontal.png"
                alt="Small Plates & Company"
                width={160}
                height={32}
                priority
              />
            </div>

            {/* Burger Menu Button */}
            <button
              onClick={handleMobileMenuToggle}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between w-full">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/images/SmallPlates_logo_horizontal.png"
                alt="Small Plates & Company"
                width={200}
                height={40}
                priority
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4">
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
                    Create your Cookbook
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-6 py-4 space-y-3">
              {user ? (
                <Link
                  href="/profile/groups"
                  onClick={closeMobileMenu}
                  className="block w-full text-center py-3 px-5 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
                >
                  Go to Profile
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsLoginModalOpen(true);
                      closeMobileMenu();
                    }}
                    className="block w-full text-center py-3 px-5 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Login
                  </button>
                  <Link
                    href="/onboarding"
                    onClick={closeMobileMenu}
                    className="block w-full text-center py-3 px-5 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Create your Cookbook
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
