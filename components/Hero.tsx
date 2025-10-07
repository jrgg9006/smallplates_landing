import Image from "next/image";
import CTAButton from "./CTAButton";

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="bg-white"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-12 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Left copy */}
        <div>
          <h1 id="hero-title" className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-gray-900">
            The people behind every recipe.
          </h1>
          <p className="font-sans mt-4 text-lg text-gray-700 max-w-prose">
            A cookbook experience made with your loved ones&rsquo; recipes.
          </p>
          <div className="mt-8">
            <CTAButton data-cta="hero-primary" />
          </div>
        </div>

        {/* Right image slot */}
        <div className="relative w-full aspect-[4/3] md:aspect-[5/4] rounded-2xl overflow-hidden bg-gray-100">
          <Image
            src="/images/landing_preview.jpg"
            alt=""
            fill
            className="object-cover"
            priority
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
