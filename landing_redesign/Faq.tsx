"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

/**
 * FAQ SECTION — Small Plates Wedding Landing Page
 * 
 * Voice: Margot Cole
 * Purpose: Resolve final doubts. Address objections with warmth and directness.
 * 
 * Copy rationale:
 * Each answer is written how Margot would respond to a friend asking:
 * 
 * - "Perfect." as an opener when someone says they don't cook.
 *   Margot doesn't let people disqualify themselves. She reframes.
 * 
 * - Direct timeframes (5 minutes, 4-6 weeks) — Margot respects your time.
 *   She gives you the info you need without padding.
 * 
 * - "We send up to 3 reminders... People want to be part of this."
 *   Acknowledges the concern, then reassures with confidence (not hope).
 * 
 * - "If they eat, it's for both of them."
 *   Classic Margot dry humor. True and funny.
 * 
 * Design rationale:
 * - Accordion style for scannability
 * - Subtle background (gray-50) to separate from content sections
 * - Clean, readable text
 */

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What if some guests don't cook?",
    answer: "Perfect. They can send the takeout order they'd die for. The sandwich they get every time. A frozen pizza they've perfected. It's not about being a chef—it's about being in the book."
  },
  {
    question: "How long does the whole process take?",
    answer: "Guests need about 5 minutes to submit their recipe. The whole process—from sending invites to receiving the printed book—takes 4-6 weeks, depending on how quickly you collect recipes."
  },
  {
    question: "What if people forget to send their recipes?",
    answer: "We send up to 3 friendly reminders per guest. Most books end up with 30-50+ recipes. People want to be part of this—sometimes they just need a nudge."
  },
  {
    question: "How much does it cost?",
    answer: "Books start at $120 for up to 60 recipes. Most groups split the cost among bridesmaids or family—meaning each person pays less than a typical wedding gift for something that actually matters."
  },
  {
    question: "Is this just for the bride?",
    answer: "It's for their kitchen. Their meals. Their life together. If they eat, it's for both of them."
  },
  {
    question: "What makes this different from a regular cookbook?",
    answer: "Every page has a name. Every recipe comes from someone who was there. It's not instructions—it's presence. Open it in ten years, and your people are still with you."
  }
];

function FAQItemComponent({ faq, isOpen, onClick }: { faq: FAQItem; isOpen: boolean; onClick: () => void }) {
  return (
    <motion.div
      className="border-b border-[#E8E0D5] last:border-b-0"
      initial={false}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A854] focus-visible:ring-offset-2 rounded-lg"
        aria-expanded={isOpen}
      >
        <h3 className="font-serif text-lg md:text-xl font-medium text-[#2D2D2D] pr-8">
          {faq.question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-[#9A9590]" />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-6 font-sans text-base md:text-lg text-[#2D2D2D]/70 leading-relaxed pr-12">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section 
      id="faq"
      className="bg-[#FAF7F2] py-16 md:py-24"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2
            id="faq-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#2D2D2D]"
          >
            Questions?
          </h2>
          <p className="mt-4 font-sans text-lg text-[#2D2D2D]/60">
            We've got answers.
          </p>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm p-6 md:p-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {faqs.map((faq, index) => (
            <FAQItemComponent
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onClick={() => handleClick(index)}
            />
          ))}
        </motion.div>

        {/* Additional Help */}
        <motion.p
          className="mt-8 text-center font-sans text-base text-[#9A9590]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Still have questions?{" "}
          <a 
            href="mailto:hello@smallplates.co" 
            className="text-[#D4A854] hover:text-[#c49b4a] underline underline-offset-2 transition-colors"
          >
            We're here.
          </a>
        </motion.p>

      </div>
    </section>
  );
}