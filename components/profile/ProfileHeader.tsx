"use client";

import React from "react";
import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProfileDropdown from "@/components/profile/ProfileDropdown";
import ProfileNavigation from "@/components/profile/ProfileNavigation";
import { GroupNavigationSheet } from "@/components/profile/groups/GroupNavigationSheet";
import type { GroupWithMembers } from "@/lib/types/database";

interface ProfileHeaderProps {
  onGroupSelect?: (group: GroupWithMembers) => void;
  currentGroupId?: string;
}

export function ProfileHeader({ onGroupSelect, currentGroupId }: ProfileHeaderProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGroupSheetOpen, setIsGroupSheetOpen] = useState(false);

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

  const handleCookbooks = () => {
    setIsMobileMenuOpen(false);
    setIsGroupSheetOpen(true);
  };

  // Determine active states for mobile menu
  const isCookbooksActive = pathname === '/profile/groups' || pathname.startsWith('/profile/groups/');
  const isAccountActive = pathname === '/profile/account' || pathname.startsWith('/profile/account/');

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
            <ProfileNavigation 
              variant="desktop" 
              onGroupSelect={onGroupSelect}
              currentGroupId={currentGroupId}
            />
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
            <div className="space-y-3">
              <button
                onClick={handleCookbooks}
                className={`block w-full text-center py-3 px-5 rounded-full border font-semibold transition-colors ${
                  isCookbooksActive
                    ? "bg-gray-100 border-gray-400 text-gray-900"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                My Books
              </button>
              <button
                onClick={handleAccount}
                className={`block w-full text-center py-3 px-5 rounded-full border font-semibold transition-colors ${
                  isAccountActive
                    ? "bg-gray-100 border-gray-400 text-gray-900"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Account
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

      {/* Group Navigation Sheet */}
      <GroupNavigationSheet 
        isOpen={isGroupSheetOpen}
        onClose={() => setIsGroupSheetOpen(false)}
        onGroupSelect={onGroupSelect}
        currentGroupId={currentGroupId}
      />
    </>
  );
}