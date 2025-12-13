"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, Package, BookOpen, Users, ChefHat, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import type { Profile } from "@/lib/types/database";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Fetch profile data when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const { data } = await getCurrentProfile();
        setProfile(data);
      } else {
        setProfile(null);
      }
    };

    fetchProfile();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get the display letter (first letter of name, fallback to email)
  const getDisplayLetter = () => {
    if (profile?.full_name && profile.full_name.trim()) {
      return profile.full_name.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0)?.toUpperCase() || 'U';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-charcoal))]/90 transition-colors text-[hsl(var(--brand-white))] text-sm font-medium"
        aria-label="Profile menu"
      >
        {getDisplayLetter()}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
        >
          <button
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => {
              router.push('/profile/account');
              setIsOpen(false);
            }}
          >
            <User className="h-4 w-4" />
            Account
          </button>
          {/* <button
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => {
              router.push('/profile/orders');
              setIsOpen(false);
            }}
          >
            <Package className="h-4 w-4" />
            Orders
          </button> */}
          {/* <button
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => {
              router.push('/profile/cookbook');
              setIsOpen(false);
            }}
          >
            <BookOpen className="h-4 w-4" />
            My Cookbook
          </button> */}
          {/* <button
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => {
              router.push('/profile');
              setIsOpen(false);
            }}
          >
            <Users className="h-4 w-4" />
            Guests
          </button> */}
          {/* <button
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => {
              router.push('/profile/recipes');
              setIsOpen(false);
            }}
          >
            <ChefHat className="h-4 w-4" />
            My Small Plates
          </button> */}
          {/* <button
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => {
              router.push('/how-it-works');
              setIsOpen(false);
            }}
          >
            <HelpCircle className="h-4 w-4" />
            How It Works
          </button> */}
          <hr className="my-1 border-gray-200" />
          <button
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => {
              signOut();
              setIsOpen(false);
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}