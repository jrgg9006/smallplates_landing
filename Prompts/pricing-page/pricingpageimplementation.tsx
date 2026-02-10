"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

/**
 * PRICING PAGE — Small Plates & Co.
 * 
 * Voice: Margot Cole (direct, factual, warm)
 * Purpose: Clear information about pricing tiers. No fluff.
 * 
 * Design rationale:
 * - Clean cards on Warm White background
 * - Tier 2 subtly highlighted with Honey border + "Most popular" tag
 * - Serif for names/prices (editorial feel)
 * - Sans for features (clarity)
 * - Generous whitespace throughout
 * - No bullets — cleaner, more editorial
 * 
 * Copy rationale:
 * - Header uses Option B: "Three ways to give it."
 * - Each tier has a functional description + emotional tagline
 * - The tagline is what makes it Margot — she doesn't just list features,
 *   she tells you what it's FOR
 */

const tiers = [
  {
    id: "the-book",
    name: "The Book",
    price: 149,
    popular: false,
    features: [
      "1 Premium Hardcover (8×10)",
      "Lay-flat binding",
      "Up to 72 recipes",
      "Professional design",
      "Full color throughout",
    ],
    tagline: "The gift. For the couple.",
  },
  {
    id: "family-collection",
    name: "The Family Collection",
    price: 279,
    popular: true,
    features: [
      "1 Premium Hardcover (8×10)",
      "2 Classic Hardcovers (6×9)",
      "Same recipes, same design",
      "Three books total",
    ],
    tagline: "One for them. One for each family.",
  },
  {
    id: "kitchen-table",
    name: "The Kitchen Table",
    price: 449,
    popular: false,
    features: [
      "1 Premium Hardcover (8×10)",
      "5 Classic Hardcovers (6×9)",
      "Same recipes, same design",
      "Six books total",
    ],
    tagline: "For the friends who made it happen.",
  },
];

export default function PricingPage() {
  const router = useRouter();

  const handleStartBook = () => {
    router.push("/onboarding");
  };

  const handleContact = () => {
    router.push("/contact");
  };

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      {/* Header Section */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.h1
            className="font-serif text-4xl md:text-5xl text-[#2D2D2D] mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Three ways to give it.
          </motion.h1>
          <motion.p
            className="text-lg text-[#8A8780] max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Same book. Same recipes. Different configurations.
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                className={`
                  relative bg-white rounded-lg p-8 md:p-10
                  transition-shadow duration-200 ease-out
                  hover:shadow-[0_4px_20px_rgba(45,45,45,0.08)]
                  ${tier.popular 
                    ? "border-2 border-[#D4A854]" 
                    : "border border-[#F0EDE8]"
                  }
                `}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                {/* Popular Tag */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-block bg-[#FBF6EC] text-[#D4A854] text-xs font-medium tracking-wide uppercase px-4 py-1.5 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}

                {/* Tier Name */}
                <h2 className="font-serif text-2xl text-[#2D2D2D] mb-2">
                  {tier.name}
                </h2>

                {/* Price */}
                <div className="mb-6">
                  <span className="font-serif text-4xl text-[#2D2D2D]">
                    ${tier.price}
                  </span>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-[#F0EDE8] mb-6" />

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <li 
                      key={i} 
                      className="text-[#2D2D2D] text-[15px] leading-relaxed"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Divider */}
                <div className="w-full h-px bg-[#F0EDE8] mb-6" />

                {/* Tagline */}
                <p className="font-serif italic text-[#8A8780] text-base mb-8">
                  {tier.tagline}
                </p>

                {/* CTA Button */}
                <button
                  onClick={handleStartBook}
                  className="
                    w-full py-4 px-6 
                    bg-[#D4A854] hover:bg-[#C49A4A] 
                    text-[#2D2D2D] font-medium text-sm
                    rounded-lg
                    transition-colors duration-200
                  "
                >
                  Start the book →
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Option */}
      <section className="pb-12 md:pb-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <p className="text-[#8A8780] text-lg mb-2">
              Need something different?
            </p>
            <button
              onClick={handleContact}
              className="
                text-[#2D2D2D] font-medium
                underline underline-offset-4 decoration-[#D4A854]
                hover:text-[#D4A854]
                transition-colors duration-200
              "
            >
              Let's figure it out →
            </button>
          </motion.div>
        </div>
      </section>

      {/* Fine Print */}
      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            className="bg-[#F5F3EF] rounded-lg p-8 md:p-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <h3 className="font-serif text-xl text-[#2D2D2D] mb-6">
              A few things to know
            </h3>
            
            <div className="space-y-4 text-[15px] text-[#6B6966] leading-relaxed">
              <p>
                <span className="font-medium text-[#2D2D2D]">Shipping</span> is 
                calculated at checkout and paid separately.
              </p>
              <p>
                <span className="font-medium text-[#2D2D2D]">Timeline:</span> Most 
                books are ready 4–6 weeks after recipe collection closes.
              </p>
              <p>
                <span className="font-medium text-[#2D2D2D]">What's included:</span> Professional 
                design, recipe images, quality printing, and a book that actually 
                lies flat when you're cooking.
              </p>
              <p>
                <span className="font-medium text-[#2D2D2D]">What's not included:</span> Stress. 
                We handle the reminders, the design, the production. You just invite people.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}