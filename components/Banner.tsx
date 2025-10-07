"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import LoginModal from "./LoginModal";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function Banner() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <>
      <header
        role="banner"
        aria-label="Top banner"
        className="w-full bg-white border-b border-gray-100"
      >
        <div className="mx-auto max-w-7xl px-6 md:px-8 h-16 flex items-center justify-between">
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
              <>
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Login
              </button>
            )}
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-2 text-sm font-semibold hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
            >
              Get Started
            </Link>
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
