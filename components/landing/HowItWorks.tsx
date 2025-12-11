import Image from "next/image";
import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "You invite.",
      description: "Share a link with your guests. We'll remind them—you don't have to chase anyone.",
      image: "/images/HowitWorks_images/how_step1.png",
      imageAlt: "Invitation being shared via phone"
    },
    {
      number: "02",
      title: "They send recipes.",
      description: "Their favorites. Their stories. Takes 5 minutes.",
      image: "/images/HowitWorks_images/how_step2.png",
      imageAlt: "Person submitting a recipe with a photo"
    },
    {
      number: "03",
      title: "We make the book.",
      description: "Designed. Printed. Hardcover. Delivered.",
      image: "/images/HowitWorks_images/how_step1.png",
      imageAlt: "Finished hardcover cookbook"
    }
  ];

  return (
    <section 
      id="how-it-works" 
      className="bg-white py-16 md:py-24"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2
            id="how-it-works-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#2D2D2D]"
          >
            Here&apos;s how it happens.
          </h2>
          <p className="mt-4 font-sans text-lg md:text-xl text-[#2D2D2D]/60 font-light">
            Simpler than you think.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
            >
              {/* Step Number - positioned above image */}
              <div className="flex justify-center mb-6">
                <span className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A854]/20 to-[#D4A854]/30 text-[#D4A854] font-serif font-medium flex items-center justify-center text-lg border border-[#D4A854]/30 shadow-sm">
                  {step.number}
                </span>
              </div>

              {/* Image */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-6">
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              {/* Title */}
              <h3 className="font-serif text-2xl md:text-3xl font-medium text-[#2D2D2D] mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="font-sans font-light text-base md:text-lg text-[#2D2D2D]/70 max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}