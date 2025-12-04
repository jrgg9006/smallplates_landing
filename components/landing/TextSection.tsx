"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";

export default function TextSection() {
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const logo = logoRef.current;
    if (!logo) return;

    // Respect user's motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let t = 0;
    let animationId: number;

    // Organic, breathing animation inspired by handcrafted warmth
    function animateLogo() {
      if (!logo) return;
      
      t += 0.05; // Very slow progression for calm, editorial feel

      // Gentle vertical breathing (like a resting heartbeat)
      const breatheY = Math.sin(t * 0.8) * 4;

      // Subtle horizontal sway (like gentle wind)
      const swayX = Math.sin(t * 0.6) * 2;

      // Micro-rotation for organic imperfection
      const rotate = Math.sin(t * 0.4) * 1;

      // Breathing scale (almost imperceptible)
      const breatheScale = 1 + Math.sin(t * 0.7) * 0.1;

      // Apply transform with smooth interpolation
      logo.style.transform = `translate(${swayX}px, ${breatheY}px) rotate(${rotate}deg) scale(${breatheScale})`;

      animationId = requestAnimationFrame(animateLogo);
    }

    // Start animation with slight delay for natural feel
    const startTimeout = setTimeout(() => {
      animateLogo();
    }, 500);

    // Cleanup
    return () => {
      clearTimeout(startTimeout);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <section className="bg-white py-16 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mx-auto max-w-5xl text-center">
          {/* SmallPlates Logo with Organic Animation */}
          <div className="mb-16">
            <Image
              ref={logoRef}
              src="/images/logo_svg/SmallPlates_vertical_ungrouped.svg"
              alt="Small Plates & Co."
              width={400}
              height={360}
              className="logo-organic mx-auto"
              style={{
                willChange: 'transform',
                transformOrigin: 'center center',
              }}
              priority
            />
          </div>
          
          {/* Tagline */}
          <div className="w-full mx-auto px-4">
            <p className="font-serif text-4xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-6xl text-gray-900 leading-tight text-center md:whitespace-nowrap">
              Food is just the excuse.{' '}
              <span className="block md:inline">
                <em className="font-serif italic">People are the Point.</em>
              </span>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .logo-organic {
          transition: transform 0.08s ease-out;
          filter: contrast(1.02) saturate(1.01);
        }
        
        /* Performance optimization */
        @media (prefers-reduced-motion: reduce) {
          .logo-organic {
            transform: none !important;
          }
        }
        
        /* Subtle enhancement on hover */
        .logo-organic:hover {
          filter: contrast(1.03) saturate(1.02);
        }
      `}</style>
    </section>
  );
}