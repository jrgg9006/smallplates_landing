import Image from "next/image";

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      stepNumber: "STEP 1",
      title: "Select Guests and Request Recipes in One Click",
      description: "We provide smart tools to collect recipes from your friends and family",
      image: "/images/HowItWorks_images/howitworks_1.svg",
    },
    {
      id: 2,
      stepNumber: "STEP 2",
      title: "Track in Dashboard",
      description: "We've simplified every part of managing your guest list. Leaving only the fun part for you to do",
      image: "/images/HowItWorks_images/howitworks_2.svg",
    },
    {
      id: 3,
      stepNumber: "STEP 3",
      title: "Print, Read, Cook",
      description: "We'll print and send you a beautiful, hardcover book, with professional images for each recipe.",
      image: "/images/HowItWorks_images/howitworks_3.jpg",
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Section Title */}
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-center font-medium text-gray-900 mb-16">
          How it works
        </h2>

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
      </div>
    </section>
  );
}