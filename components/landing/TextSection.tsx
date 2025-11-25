import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function TextSection() {
  return (
    <section className="bg-white pt-12 md:pt-16 pb-16 md:pb-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mx-auto max-w-5xl text-center">
          {/* Main headline */}
          <h1 className="font-serif text-5xl md:text-6xl lg:text-6xl font-bold text-gray-900 leading-tight mb-12">
            We believe people<br />
            connect through Food
          </h1>
          
          {/* Subheading */}
          <div className="mb-8">
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-medium text-gray-900">
              In Small Plates, it&apos;s never about the<br />
              perfect recipe
            </h2>
          </div>
          
          {/* Decorative line */}
          <div className="mb-8">
            <div className="w-32 h-0.5 bg-gray-900 mx-auto"></div>
          </div>
          
          {/* Description paragraph */}
          <div className="max-w-2xl mx-auto">
            <p className="font-sans font-light text-lg md:text-xl lg:text-2xl text-gray-900 leading-relaxed">
              It&apos;s about the people behind it, <br />
              and the feeling it carries.<br />
            </p>
          </div>

          {/* More About Us Link */}
          <div className="text-center mt-12">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 text-lg font-light underline underline-offset-2 transition-colors"
            >
              More about us
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}