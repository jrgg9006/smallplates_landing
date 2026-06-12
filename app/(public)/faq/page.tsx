import { Metadata } from "next";
import Link from "next/link";
import Banner from "@/components/landing/Banner";
import Footer from "@/components/landing/Footer";
import WhatsAppFAB from "@/components/landing/WhatsAppFAB";
import JumpNav from "./_components/JumpNav";
import {
  FAQ_CATEGORIES,
  TOP_QUESTION_IDS,
  getFaqItem,
  type FaqItem,
} from "./_components/faq-data";

export const metadata: Metadata = {
  title: "FAQ — Small Plates & Co.",
  description:
    "Everything about how the book gets made: what's free, what it costs, how guests send recipes, and when it shows up at your door.",
};

function AnswerBody({ item, className = "" }: { item: FaqItem; className?: string }) {
  return (
    <div className={className}>
      {/* Reason: answers render as ONE paragraph regardless of how many
          strings the data has — Ricardo prefers no gaps inside an answer */}
      {item.answer.length > 0 && (
        <p className="type-body-small md:text-base">{item.answer.join(" ")}</p>
      )}
      {item.list && (
        <ol className="list-decimal space-y-2 pl-5">
          {item.list.map((entry) => (
            <li key={entry} className="type-body-small md:text-base">
              {entry}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function FaqPage() {
  const topQuestions = TOP_QUESTION_IDS
    .map(getFaqItem)
    .filter((item): item is FaqItem => item !== undefined);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_CATEGORIES.flatMap((category) => category.items).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: [...item.answer, ...(item.list ?? [])].join(" "),
      },
    })),
  };

  return (
    <>
      <Banner theme="light" showShippingStrip={false} />
      <main className="min-h-screen bg-brand-warm-white">
        <script
          type="application/ld+json"
          // Reason: escape "<" so answer text can never close the script tag early
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
          }}
        />

        {/* Hero */}
        <section className="px-6 pt-32 pb-10 text-center md:pt-44 md:pb-14">
          <h1 className="type-heading">Questions, answered.</h1>
          <p className="type-body mx-auto mt-4 max-w-2xl">
            Everything about how the book gets made, from the first invite to
            the hardcover in the kitchen.
          </p>
        </section>

        <div className="mx-auto max-w-6xl px-6 pb-16 md:px-8 md:pb-24 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-12">
          <JumpNav
            sections={FAQ_CATEGORIES.map(({ id, title }) => ({ id, title }))}
          />

          <div>
            {/* Most common questions */}
            <h2 className="type-subheading mb-6">Most common questions</h2>
            <div className="mb-12 rounded-2xl border border-brand-sand bg-white px-6 py-2 md:px-10">
              {topQuestions.map((item) => (
                <details
                  key={item.id}
                  className="group border-b border-brand-sand py-5 last:border-b-0"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                    <span className="type-question">{item.question}</span>
                    <span
                      aria-hidden
                      className="text-2xl font-light text-brand-charcoal transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <AnswerBody item={item} className="pt-4" />
                </details>
              ))}
            </div>

            {/* Complete FAQ */}
            <h2 className="type-subheading mb-6">The complete FAQ</h2>
            <div className="space-y-8">
              {FAQ_CATEGORIES.map((category) => (
                <section
                  key={category.id}
                  id={category.id}
                  className="scroll-mt-28 rounded-2xl border border-brand-sand bg-white p-6 md:p-10"
                >
                  <h3 className="type-subheading">{category.title}</h3>
                  <div className="mt-4 mb-8 border-b border-brand-sand" />
                  <div className="space-y-8">
                    {category.items.map((item) => (
                      <div key={item.id}>
                        <h4 className="type-question mb-3">{item.question}</h4>
                        <AnswerBody item={item} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Closing CTA */}
            <div className="mt-16 text-center">
              <p className="type-body">Still wondering about something?</p>
              <p className="type-body-small mt-2">
                Write to{" "}
                <a
                  className="underline underline-offset-4"
                  href="mailto:team@smallplatesandcompany.com"
                >
                  team@smallplatesandcompany.com
                </a>
                . A person answers.
              </p>
              <Link
                href="/onboarding/welcome"
                className="mt-8 inline-flex items-center justify-center rounded-full bg-brand-charcoal px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-charcoal/90"
              >
                Start your book. It&apos;s free.
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
