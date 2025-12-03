"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContentItem {
  number: string;
  title: string;
  description: string;
  additionalText?: string;
  image: string;
  alt: string;
}

interface EditorialStickyScrollProps {
  content: ContentItem[];
  contentClassName?: string;
}

export function EditorialStickyScroll({
  content,
  contentClassName,
}: EditorialStickyScrollProps) {
  const [activeCard, setActiveCard] = useState(0);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      // Calculate which section is in view
      let newActiveCard = 0;
      
      contentRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          // Trigger when the top of the text content reaches 40% of viewport height
          // This gives users time to see the text before the image changes
          const triggerPoint = window.innerHeight * 0.4;
          
          if (rect.top < triggerPoint) {
            newActiveCard = index;
          }
        }
      });

      setActiveCard(newActiveCard);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", contentClassName)}>
      {/* Desktop Layout */}
      <div className="hidden lg:flex gap-8 xl:gap-12">
        {/* Left: Scrolling Text Content */}
        <div className="w-1/2">
          {content.map((item, index) => (
            <div
              key={item.title}
              ref={(el) => {
                contentRefs.current[index] = el;
              }}
              className={cn(
                "min-h-[40vh] flex flex-col justify-start pt-20",
                index === content.length - 1 && "mb-[20vh]" // Add extra space after last item
              )}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Number */}
                <span className="text-gray-300 text-5xl font-light font-serif mb-4 block">
                  {item.number}
                </span>

                {/* Title */}
                <h3 className="font-serif text-2xl md:text-3xl font-medium text-gray-900 mb-3">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-base md:text-lg text-gray-600 font-light leading-relaxed mb-3">
                  {item.description}
                </p>

                {/* Additional Text */}
                {item.additionalText && (
                  <p className="text-sm md:text-base text-gray-500 font-light leading-relaxed">
                    {item.additionalText}
                  </p>
                )}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Right: Sticky Image */}
        <div className="w-1/2 sticky top-20 h-[400px] flex items-center justify-center">
          <div className="relative w-[400px] h-[300px] rounded-xl overflow-hidden shadow-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCard}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={content[activeCard].image}
                  alt={content[activeCard].alt}
                  fill
                  className="object-cover"
                  sizes="60vw"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Layout - Stacked Cards */}
      <div className="lg:hidden space-y-12">
        {content.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ 
              duration: 0.6, 
              delay: index * 0.2, 
              ease: "easeOut" 
            }}
            className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={item.image}
                alt={item.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            
            {/* Content */}
            <div className="p-6 md:p-8">
              <span className="text-gray-300 text-4xl font-light font-serif mb-4 block">
                {item.number}
              </span>
              <h3 className="font-serif text-2xl md:text-3xl font-medium text-gray-900 mb-4">
                {item.title}
              </h3>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed font-light">
                {item.description}
              </p>
              {item.additionalText && (
                <p className="text-gray-500 text-sm md:text-base leading-relaxed font-light mt-3">
                  {item.additionalText}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}