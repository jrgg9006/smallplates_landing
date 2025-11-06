"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import BookDetailsModal from "./BookDetailsModal";

export default function WhatsIncluded() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGetStarted = () => {
    router.push("/onboarding");
  };

  // Features organized in two columns
  const leftFeatures = [
    "1 Hardcover Cookbook Credit",
    "30-day money back guarantee",
    "Smart tools to collect recipes",
  ];

  const rightFeatures = [
    "Up to 120 recipes",
    "Professional photo layout",
    "Free shipping in the US",
  ];

  return (
    <section className="bg-smallplates_green py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          
          {/* Left Content Section */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="font-serif text-4xl sm:text-5xl md:text-4xl lg:text-5xl font-medium text-white mb-4 leading-tight">
              What&apos;s included in your Small Plates & Co. experience?
            </h2>
            <p className="text-lg md:text-xl text-emerald-100 mb-10 leading-relaxed">
              
            </p>
            
            {/* CTA Button */}
            <motion.button
              type="button"
              onClick={handleGetStarted}
              className="inline-flex items-center justify-center rounded-2xl bg-smallplates_red text-white px-8 py-4 text-lg font-semibold shadow-lg hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-600 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              CREATE YOURS FOR $120
            </motion.button>
            
            {/* Learn more text */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-emerald-100 text-base underline underline-offset-2 hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              Learn more about the printed-book details
            </button>
          </motion.div>

          {/* Right Features Grid - Colorful Badges */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              
              {/* Left Features Column */}
              <div className="space-y-4">
                {leftFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.3 + (index * 0.1), 
                      ease: "easeOut"
                    }}
                    whileHover={{ 
                      x: 5,
                      transition: { duration: 0.15 }
                    }}
                    className="group"
                  >
                    <div className="
                      inline-flex items-center gap-3 px-5 py-3 
                      rounded-2xl w-full
                      bg-white/10 backdrop-blur-sm
                      text-white border border-white/20
                      font-medium text-base md:text-lg
                      transition-all duration-200 cursor-default
                      hover:bg-white/15 hover:border-white/30
                    ">
                      <div className="w-2 h-2 rounded-full bg-emerald-300/60 group-hover:bg-emerald-300/80 transition-colors"></div>
                      <span className="font-sans">
                        {feature}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Right Features Column */}
              <div className="space-y-4">
                {rightFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.6 + (index * 0.1), 
                      ease: "easeOut"
                    }}
                    whileHover={{ 
                      x: 5,
                      transition: { duration: 0.15 }
                    }}
                    className="group"
                  >
                    <div className="
                      inline-flex items-center gap-3 px-5 py-3 
                      rounded-2xl w-full
                      bg-white/10 backdrop-blur-sm
                      text-white border border-white/20
                      font-medium text-base md:text-lg
                      transition-all duration-200 cursor-default
                      hover:bg-white/15 hover:border-white/30
                    ">
                      <div className="w-2 h-2 rounded-full bg-emerald-300/60 group-hover:bg-emerald-300/80 transition-colors"></div>
                      <span className="font-sans">
                        {feature}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Book Details Modal */}
      <BookDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}