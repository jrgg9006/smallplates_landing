import * as React from "react";
import CTAButton from "./cta-button";

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="bg-white"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Left copy */}
        <div>
          <h1 id="hero-title" className="text-4xl md:text-5xl font-semibold tracking-tight">
            The people behind every recipe.
          </h1>
          <p className="mt-4 text-lg text-gray-700 max-w-prose">
            A cookbook experience made with your loved ones’ recipes.
          </p>
          <div className="mt-8">
            <CTAButton data-cta="hero-primary" />
          </div>
        </div>

        {/* Right image slot (background cover) */}
        <div
          aria-hidden="true"
          className="w-full aspect-[4/3] md:aspect-[5/4] rounded-2xl overflow-hidden bg-gray-100"
          style={{
            backgroundImage: "url('/images/hero-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </div>
    </section>
  );
}
