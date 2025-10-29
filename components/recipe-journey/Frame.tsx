"use client";

import React from 'react';
import Image from 'next/image';

interface FrameProps {
  title?: string;
  children: React.ReactNode;
  bottomNav?: React.ReactNode;
  showHeaderLogo?: boolean;
  leftImageSrc?: string; // desktop-only image pane
}

export default function Frame({ title, children, bottomNav, showHeaderLogo = true, leftImageSrc }: FrameProps) {
  return (
    <div className="h-screen bg-white overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
        {/* Left image pane - desktop only */}
        <div className="hidden lg:block lg:col-span-2 border-r border-gray-200 relative lg:sticky lg:top-0 h-screen">
          <div className="relative h-screen p-2">
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white shadow-sm">
              {leftImageSrc && (
                <Image src={leftImageSrc} alt="Recipe journey" fill sizes="40vw" className="object-cover" priority />
              )}
            </div>
          </div>
        </div>

        {/* Right content pane */}
        <div className="flex flex-col lg:col-span-3 h-screen overflow-y-auto">
          {/* Sticky Header centered within text pane */}
          <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="mx-auto w-full max-w-3xl px-6 h-14 flex items-center justify-center">
              {showHeaderLogo && (
                <Image src="/images/SmallPlates_logo_horizontal.png" alt="Small Plates & Co" width={180} height={28} priority />
              )}
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1">
            <div
              className="mx-auto w-full max-w-3xl px-4 py-6"
              style={{
                // Ensure page content never hides behind the bottom nav
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)'
              }}
            >
              {children}
            </div>
          </main>

          {/* Sticky Bottom Nav */}
          {bottomNav && (
            <footer
              className="sticky bottom-0 z-40 w-full border-t border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
              style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div
                className="mx-auto w-full max-w-3xl px-4 py-4"
                style={{
                  // Ensure the footer sits above iOS Safari bottom bar
                  paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
                  paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 1rem)',
                  paddingRight: 'calc(env(safe-area-inset-right, 0px) + 1rem)'
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


