"use client";

import { motion } from "framer-motion";

// Reason: these answer the objections people have at the moment they see the
// price. Copy constraints: no banned words, no em dashes, and never promise a
// preview of the finished book design or collection reminders.
const faqs = [
  {
    q: "When do I pay?",
    a: "Not now. Starting a book is free: invite people, collect recipes, take your time. You pay once, when you close the book and send it to print.",
  },
  {
    q: "Who pays, me or everyone?",
    a: "One card pays at checkout. The price is per person, so splitting is easy: everyone sends you their share, everyone gets their copy.",
  },
  {
    q: "What if we don't collect enough recipes?",
    a: "A book needs 25 recipes to go to print. Most groups pass that in the first week. 50 recipes are included; after that, each one adds $1 to your total.",
  },
  {
    q: "Can I see the recipes before it prints?",
    a: "The text, yes. You see every recipe as it comes in, including the cleaned-up version. The photos are made after you order, by hand, so those arrive with the book.",
  },
  {
    q: "How long does it take?",
    a: "Most books are at your door 3 to 4 weeks after you close the collection.",
  },
  {
    q: "Can we order more copies later?",
    a: "Yes, anytime. Later orders work exactly like the first one: one copy is $169 and the price per copy drops the more you print together, down to $89 each from 6. Separate orders don't combine, so the cheapest copies are the ones the group orders together.",
  },
  {
    q: "Is any of this public?",
    a: "No. Only people with your invite link can see or add anything. The book exists in exactly as many copies as you print.",
  },
];

export default function PricingFaq() {
  return (
    <section className="pb-24 md:pb-32">
      <div className="mx-auto max-w-2xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-serif text-xl text-brand-charcoal mb-8">
            A few questions, answered
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={faq.q}>
                {index > 0 && <div className="mb-6 h-px bg-brand-sand" />}
                <p className="font-sans text-[15px] font-medium text-brand-charcoal mb-2">
                  {faq.q}
                </p>
                <p className="type-body-small text-[15px]">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
