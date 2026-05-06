"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import FromTheBookHeader from "@/components/from-the-book/FromTheBookHeader";
import FromTheBookHero from "@/components/from-the-book/FromTheBookHero";
import FromTheBookCTASection from "@/components/from-the-book/FromTheBookCTASection";
import HowItWorks from "@/components/landing/HowItWorks";
import Footer from "@/components/landing/Footer";
import WhatsAppFAB from "@/components/landing/WhatsAppFAB";

export default function FromTheBookClient() {
  const searchParams = useSearchParams();
  const bookId = searchParams.get("b") ?? undefined;

  useEffect(() => {
    trackEvent("from_book_view", { book_id: bookId });
  }, [bookId]);

  return (
    <>
      <FromTheBookHeader />
      <main className="min-h-screen bg-white">
        <FromTheBookHero bookId={bookId} />
        <HowItWorks />
        <FromTheBookCTASection bookId={bookId} />
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
