"use client";

import React from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AccountSettings } from "@/components/profile/account/AccountSettings";
import ProfileDropdown from "@/components/profile/ProfileDropdown";
import { Bell, ArrowLeft } from "lucide-react";

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-gray-700">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
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
          
          {/* Desktop: Notification Bell + Profile */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Notification Bell */}
            <button
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {/* Notification Badge */}
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">1</span>
              </span>
            </button>
            
            <ProfileDropdown />
          </div>

          {/* Mobile: Back button */}
          <div className="lg:hidden">
            <Link
              href="/profile"
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Back to profile"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Navigation - Hidden on mobile */}
        <div className="mb-6 hidden md:block">
          <button
            onClick={() => router.push('/profile')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Profile
          </button>
        </div>

        {/* Account Settings */}
        <AccountSettings />
      </div>
    </div>
  );
}