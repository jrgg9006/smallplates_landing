import Image from "next/image";
import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "You invite.",
      description: "Add or import guests and share a link.",
      image: "/images/HowitWorks_images/how_step1.png",
      imageAlt: "Invitation being shared via phone"
    },
    {
      number: "02",
      title: "They send recipes.",
      description: "Their favorites. Their stories. We send the reminders.",
      image: "/images/HowitWorks_images/how_step2.png",
      imageAlt: "Person submitting a recipe with a photo"
    },
    {
      number: "03",
      title: "We make the book.",
      description: "Designed. Printed. Hardcover. Delivered.",
      image: "/images/HowitWorks_images/how_step3.png",
      imageAlt: "Finished hardcover cookbook",
      imagePosition: "object-bottom" as const
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
            className="type-heading"
          >
            Here&apos;s how it happens.
          </h2>
          <p className="mt-4 type-body text-brand-charcoal/60">
            Three steps. Easier than you think.
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
                <span className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F5F5F0] text-[hsl(var(--brand-warm-gray-light))] font-serif font-medium flex items-center justify-center text-lg">
                  {step.number}
                </span>
              </div>

              {/* Image */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-6 bg-white">
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  className={`object-contain ${"imagePosition" in step ? step.imagePosition : ""}`}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              {/* Title */}
              <h3 className="type-subheading mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="type-body-small max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}