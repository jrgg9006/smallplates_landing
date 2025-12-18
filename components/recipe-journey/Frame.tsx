"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface FrameProps {
  title?: string;
  children: React.ReactNode;
  bottomNav?: React.ReactNode;
  showHeaderLogo?: boolean;
  leftImageSrc?: string; // desktop-only image pane
}

export default function Frame({ title, children, bottomNav, showHeaderLogo = true, leftImageSrc }: FrameProps) {
  return (
    <div className="h-screen bg-[#FAF7F2] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
        {/* Left image pane - desktop only */}
        <div className="hidden lg:block lg:col-span-2 border-r border-gray-200 relative lg:sticky lg:top-0 h-screen bg-[#E8E0D5]">
          <div className="relative h-screen p-2">
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
              {leftImageSrc && (
                <Image 
                  src={leftImageSrc} 
                  alt="Recipe journey" 
                  fill 
                  sizes="40vw" 
                  className={leftImageSrc.includes('supabase.co') ? "object-cover" : "object-contain"} 
                  priority 
                />
              )}
            </div>
          </div>
        </div>

        {/* Right content pane */}
        <div className="flex flex-col lg:col-span-3 h-screen overflow-y-auto">
          {/* Sticky Header centered within text pane */}
          <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-[#FAF7F2]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FAF7F2]/80">
            <div className="mx-auto w-full max-w-3xl px-6 h-14 flex items-center justify-center">
              {showHeaderLogo && (
                <Link href="/" aria-label="Go to home">
                  <Image src="/images/SmallPlates_logo_horizontal.png" alt="Small Plates & Co" width={180} height={28} priority />
                </Link>
              )}
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1">
            <div
              className="mx-auto w-full max-w-3xl px-4 py-6 pb-24 lg:pb-6"
            >
              {children}
            </div>
          </main>

          {/* Sticky Bottom Nav */}
          {bottomNav && (
            <footer className="lg:sticky lg:bottom-0 fixed bottom-0 inset-x-0 lg:inset-x-auto z-40 lg:z-30 w-full border-t border-[#D4A854]/20 bg-[#FAF7F2]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FAF7F2]/80">
              <div
                className="mx-auto w-full max-w-3xl px-4 py-4 lg:py-4"
                style={{
                  paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
                  paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 16px)',
                  paddingRight: 'calc(env(safe-area-inset-right, 0px) + 16px)'
                }}
              >
                {bottomNav}
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}

