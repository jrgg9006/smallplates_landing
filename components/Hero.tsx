"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import CTAButton from "./CTAButton";

export default function Hero() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/onboarding");
  };

  return (
    <section
      aria-labelledby="hero-title"
      className="relative min-h-[600px] md:min-h-[700px] flex items-center"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/landing_preview.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          aria-hidden="true"
        />
        {/* Optional overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-6 md:px-12 lg:px-16 py-16 md:py-24">
        <div className="max-w-2xl">
          <h1 id="hero-title" className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight text-white drop-shadow-lg">
            The&nbsp;People&nbsp;behind<br />
            every&nbsp;Recipe
          </h1>
          <p className="font-sans mt-4 text-xl sm:text-2xl md:text-3xl font-medium text-white/90 max-w-prose drop-shadow">
            A cookbook experience designed to connect through food.
          </p>
          <div className="mt-8">
            <CTAButton data-cta="hero-primary" onClick={handleGetStarted} />
          </div>
        </div>
      </div>
    </section>
  );
}
