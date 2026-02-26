import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { LegalMarkdown } from '@/components/ui/LegalMarkdown';

export const metadata: Metadata = {
  title: 'Terms of Service — Small Plates & Co.',
  description: 'Terms of Service for Small Plates & Co.',
};

export default function TermsPage() {
  const filePath = path.join(process.cwd(), 'docs/termsandservices/termsofservice.md');
  const content = fs.readFileSync(filePath, 'utf-8');

  return (
    <div className="min-h-screen bg-white">
      <header className="w-full bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 md:px-8 h-20 flex items-center justify-center">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Company"
              width={180}
              height={36}
              priority
              className="hover:opacity-70 transition-opacity duration-300"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-6 md:px-8 py-16 md:py-24">
        <LegalMarkdown content={content} />
      </main>
    </div>
  );
}
