"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function WellWhatIf() {
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Array of customer fears to cycle through
  const customerFears = [
    "I don't get enough plates",
    "people don't want to share",
    "my friends forget to send them",
    "it's too much work to organize",
    "it gets awkward"
  ];
  
  const [currentFearIndex, setCurrentFearIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    // Respect user's motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let animationId: number;
    let position = 0;

    function animateCarousel() {
      position -= 0.1; // Much slower movement
      
      // Reset position when the first copy has fully scrolled (50% since we have 2 copies)
      if (position <= -50) {
        position = 0;
      }
      
      if (carousel) {
        carousel.style.transform = `translateX(${position}%)`;
      }
      animationId = requestAnimationFrame(animateCarousel);
    }

    // Start animation
    animateCarousel();

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // Fear cycling effect
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentFearIndex((prev) => (prev + 1) % customerFears.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [isPaused, customerFears.length]);

  return (
    <section className="bg-white">
      {/* Full-width moving text banner */}
      <div className="w-full bg-gray-100 py-4 overflow-hidden">
        <div 
          ref={carouselRef}
          className="whitespace-nowrap will-change-transform flex"
        >
          <span className="font-serif font-light text-xl md:text-xl text-gray-900 inline-block pr-8">
            FOOD STILL BELONGS TO PEOPLE  • FOOD STILL BELONGS TO PEOPLE  • FOOD STILL BELONGS TO PEOPLE  • FOOD STILL BELONGS TO PEOPLE  • 
          </span>
          <span className="font-serif font-light text-xl md:text-xl text-gray-900 inline-block pr-8">
            FOOD STILL BELONGS TO PEOPLE  • FOOD STILL BELONGS TO PEOPLE  • FOOD STILL BELONGS TO PEOPLE  • FOOD STILL BELONGS TO PEOPLE  • 
          </span>
        </div>
      </div>

      {/* Main content section */}
      <div className="py-20 md:py-32 lg:py-40">
        <div className="mx-auto max-w-4xl px-6 md:px-8 text-center">
          {/* Main question - addressing customer fears */}
          <div 
            className="mb-16"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4">
              Well, what if...
            </h2>
            <div className="relative h-20 md:h-28 lg:h-32 overflow-hidden">
              <p 
                key={currentFearIndex}
                className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-700 italic absolute w-full transition-all duration-700 ease-in-out animate-slide-up"
              >
                "{customerFears[currentFearIndex]}"...
              </p>
            </div>
          </div>

          {/* Hand Passing Plate Illustration - Small */}
          <div className="flex justify-center mt-4 md:mt-6 lg:mt-8 mb-16 md:mb-20 lg:mb-24">
            <div className="relative w-28 md:w-36 lg:w-44">
              <Image
                src="/images/landing/hand_passing.png"
                alt="Hands passing a plate"
                width={180}
                height={180}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>

          {/* RELAX image - reassurance */}
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-2xl mb-6">
              <Image
                src="/images/landing/Relax_just_a_plate.png"
                alt="Relax... it's just a plate"
                width={600}
                height={400}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
            
            {/* Subtle scroll link */}
            <button
              onClick={() => {
                const howItWorksSection = document.getElementById('how-it-works');
                if (howItWorksSection) {
                  howItWorksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="text-sm md:text-lg lg:text-xl font-light text-gray-500 hover:text-gray-700 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 rounded px-2 py-1"
            >
              See how it works ↓
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Slide-up animation for fear text */
        @keyframes slide-up {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          10% {
            transform: translateY(0);
            opacity: 1;
          }
          90% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 5s ease-in-out;
        }
        
        /* Performance optimization */
        @media (prefers-reduced-motion: reduce) {
          .carousel-text {
            transform: none !important;
            animation: none !important;
          }
          .animate-slide-up {
            animation: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </section>
  );
}