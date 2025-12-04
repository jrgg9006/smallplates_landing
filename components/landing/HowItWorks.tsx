import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      stepNumber: "STEP 1",
      title: "Pass the invitation",
      description: "Send a simple note asking for their favorite dish. Nothing formal, nothing complicated.",
      image: "/images/HowitWorks_images/how_step1.png",
    },
    {
      id: 2,
      stepNumber: "STEP 2",
      title: "What it comes together",
      description: "Recipes arrive as people share them. Some respond quickly, others take time. All of it becomes your book.",
      image: "/images/HowitWorks_images/how_step2.png",
    },
    {
      id: 3,
      stepNumber: "STEP 3",
      title: "Hold something real",
      description: "A beautiful book arrives at your door. Made from the dishes your people actually cook.",
      image: "/images/HowitWorks_images/how_step1.png",
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-5xl md:text-5xl lg:text-6xl xl:text-6xl font-medium text-gray-900 mb-3">
            How connection happens
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-900 font-light">
            Simpler than you think.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step) => (
            <div key={step.id} className="bg-gray-50 rounded-lg overflow-hidden shadow-sm">
              {/* Step Number */}
              <div className="px-6 pt-6">
                <p className="text-sm font-bold text-gray-600 tracking-wider mb-4">
                  {step.stepNumber}
                </p>
              </div>

              {/* Image Container - Make images larger */}
              <div className="px-6">
                <div className="relative aspect-[4/3] bg-gray-50 rounded-lg overflow-visible">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-serif text-xl md:text-2xl font-medium text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Learn More Link */}
        <div className="text-center mt-12">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 text-lg font-light underline underline-offset-2 transition-colors"
          >
            Learn more about how it works
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}