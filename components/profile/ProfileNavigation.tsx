"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Users2, ChefHat, Users } from "lucide-react";

interface ProfileNavigationProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

export default function ProfileNavigation({ 
  variant = "desktop",
  onNavigate 
}: ProfileNavigationProps) {
  const pathname = usePathname();

  // Determine active states
  const isCookbookActive = pathname === "/profile/cookbook" || pathname.startsWith("/profile/cookbook/");
  const isGroupsActive = pathname === "/profile/groups" || pathname.startsWith("/profile/groups/");
  const isRecipesActive = pathname === "/profile/recipes" || pathname.startsWith("/profile/recipes/");
  const isGuestsActive = pathname === "/profile" && !pathname.startsWith("/profile/") || 
                         (pathname !== "/profile/account" && pathname !== "/profile/orders" && 
                          pathname !== "/profile/groups" && pathname !== "/profile/recipes" && 
                          pathname.startsWith("/profile/"));

  const navItems = [
    // {
    //   label: "Cookbook",
    //   href: "/profile/cookbook",
    //   icon: BookOpen,
    //   isActive: isCookbookActive
    // },
    {
      label: "My Books",
      href: "/profile/groups",
      icon: Users2,
      isActive: isGroupsActive
    },
  ];

  if (variant === "mobile") {
    return (
      <div className="space-y-1 pb-3 mb-3 border-b border-gray-200">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                item.isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-current={item.isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  }

  // Desktop variant
  return (
    <nav className="flex items-center gap-8" aria-label="Main navigation">
      {navItems.map((item) => {
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-2 px-4 py-2 text-base transition-colors ${
              item.isActive
                ? "text-gray-900 font-medium border-b-2 border-gray-900"
                : "text-gray-700 font-normal hover:text-gray-900"
            }`}
            aria-current={item.isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}