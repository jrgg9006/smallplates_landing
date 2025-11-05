import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-smallplates_darkblue">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 lg:py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 items-start">
          {/* Logo and Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4 -mt-4">
              <Image
                src="/images/SmallPlates_logo_horizontal.png"
                alt="Small Plates & Company"
                width={280}
                height={56}
                className="brightness-0 invert -my-4"
                style={{ maxWidth: '280px', height: 'auto' }}
              />
            </Link>
            <p className="text-base text-gray-300 max-w-md">
              Create a unique cookbook with your loved ones&apos; recipes. We make it easy to turn memories and stories into professionally printed hardcover books.
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="pt-4 lg:pt-0">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-base text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-base text-gray-300 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-base text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="text-base text-gray-300 hover:text-white transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Connect */}
          <div className="pt-4 lg:pt-0">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Ask us anything!
            </h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:team@smallplatesandcompany.com" 
                  className="text-base text-gray-300 hover:text-white transition-colors"
                >
                  team@smallplatesandcompany.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="bg-black/20">
        <div className="mx-auto max-w-7xl px-6 py-4 md:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-400">
              © {currentYear} Small Plates & Company. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}