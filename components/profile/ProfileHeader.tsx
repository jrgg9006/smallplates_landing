"use client";

import React from "react";
import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProfileDropdown from "@/components/profile/ProfileDropdown";
import ProfileNavigation from "@/components/profile/ProfileNavigation";

export function ProfileHeader() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await signOut();
  };

  const handleAccount = () => {
    setIsMobileMenuOpen(false);
    router.push('/profile/account');
  };

  const handleOrders = () => {
    setIsMobileMenuOpen(false);
    router.push('/profile/orders');
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo - Aligned with content */}
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Co."
              width={200}
              height={40}
              className="cursor-pointer"
              priority
            />
          </Link>
          
          {/* Desktop: Navigation + Profile */}
          <div className="hidden lg:flex items-center gap-6">
            <ProfileNavigation variant="desktop" />
            <ProfileDropdown />
          </div>

          {/* Mobile: Burger Menu */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <svg 
                className="h-6 w-6 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-gray-50">
          <div className="px-6 py-4">
            {/* Navigation Links */}
            <ProfileNavigation 
              variant="mobile" 
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Account Actions */}
            <div className="space-y-3">
              <button
                onClick={handleAccount}
                className="block w-full text-center py-3 px-5 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Account Settings
              </button>
              <button
                onClick={handleOrders}
                className="block w-full text-center py-3 px-5 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Orders & Shipping
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-center py-3 px-5 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}