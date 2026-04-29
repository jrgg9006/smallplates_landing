import { Metadata } from "next";
import { Suspense } from "react";
import Banner from "@/components/landing/Banner";
import Footer from "@/components/landing/Footer";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact — Small Plates & Co.",
  description: "Something off? Tell us what's happening. We read everything.",
};

export default function ContactPage() {
  return (
    <>
      <Banner />
      <main className="min-h-screen bg-brand-warm-white-warm">
        <section className="pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="mx-auto max-w-xl px-6 md:px-8">
            <div className="text-center mb-12">
              <h1 className="type-heading mb-6">
                Something off?
              </h1>
              <div className="w-12 h-px bg-brand-honey mx-auto mb-6"></div>
              <p className="type-body-small">
                Tell us what&rsquo;s happening. We read everything.
              </p>
            </div>

            <Suspense fallback={null}>
              <ContactForm />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
