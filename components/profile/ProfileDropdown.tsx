"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, Package } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const router = useRouter();

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label="Profile menu"
      >
        <span className="text-gray-700 font-medium text-sm">
          {user?.email?.[0]?.toUpperCase() || "U"}
        </span>
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
          <button
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => {
              router.push('/profile/orders');
              setIsOpen(false);
            }}
          >
            <Package className="h-4 w-4" />
            Orders
          </button>
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