"use client";

import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";

const features = [
  {
    id: 1,
    title: "Collect recipes effortlessly",
    description: "Invite your people. We handle the rest.",
    imageSrc: "/images/feature-grid/1.collect-recipes.png",
    imageAlt: "Collect recipes effortlessly",
  },
  {
    id: 2,
    title: "Add recipes in seconds",
    description: "Text, photo, or voice — add any recipe effortlessly.",
    imageSrc: "/images/feature-grid/2.add-recipes.png",
    imageAlt: "Add recipes in seconds",
  },
  {
    id: 3,
    title: "A photo for every dish",
    description: "Professional images created for every recipe.",
    imageSrc: "/images/feature-grid/3.photo-per-dish.png",
    imageAlt: "A photo for every dish",
  },
  {
    id: 4,
    title: "Designed like a real cookbook",
    description: "Modern layouts, timeless type, bookstore quality.",
    imageSrc: "/images/feature-grid/4.designed-cookbook.png",
    imageAlt: "Designed like a real cookbook",
  },
  {
    id: 5,
    title: "Make it yourself or together",
    description: "A project for yourself — or for everyone you love.",
    imageSrc: "/images/feature-grid/5.social.png",
    imageAlt: "Make it yourself or together",
  },
  {
    id: 6,
    title: "Printed & delivered to your door",
    description: "Premium printing, fast shipping, made to last.",
    imageSrc: "/images/feature-grid/6.delivery.png",
    imageAlt: "Printed & delivered to your door",
  },
];

export default function FeatureGrid() {
  return (
    <section className="bg-white pt-6 md:pt-8 pb-2 md:pb-4">
      <div className="mx-auto max-w-[1400px] px-6 md:px-8">
        {/* Grid: 4 columns × 2 rows with visible borders */}
        {/* Mobile: 1 column (auto rows), Desktop: 4 columns × 2 rows with proportions 0.85:1.15:1.15:1.15 */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-[0.85fr_1.15fr_1.15fr_1.15fr] md:grid-rows-2 border border-gray-200 divide-y md:divide-y-0 md:divide-x divide-gray-200 relative"
          initial={{ opacity: 0.7, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Horizontal line for columns 2, 3, 4 only */}
          <div 
            className="hidden md:block absolute top-1/2 h-px bg-gray-200 -translate-y-1/2 z-10"
            style={{ 
              left: '19.77%', // Start after column 1: 0.85 / (0.85 + 1.15 + 1.15 + 1.15) = 0.85 / 4.3 = 19.77%
              right: '0'
            }}
          ></div>
          
          {/* Column 1 - Title/Subtitle (spans 2 rows on desktop, no horizontal divide, vertically centered) */}
          <div className="col-span-1 md:col-span-1 md:row-span-2 border-b md:border-b-0 md:border-r border-gray-200 p-6 md:p-8 text-center md:text-left flex flex-col justify-center relative z-20">
            <h2 className="font-serif font-bold text-[26px] md:text-[26px] leading-[115%] tracking-tighter text-gray-900">
              Everything you need
              <br />
              to create a your own
              <br />
              food sharing experience
            </h2>
            <p className="font-sans font-normal text-sm md:text-base leading-[150%] text-[#5C5C5C] mt-3 md:mt-4">
              For the stories, the memories, and
              <br />
              the food you share.
            </p>
          </div>

          {/* Column 2 - Row 1 (Top) */}
          <div className="col-span-1 md:row-span-1 border-b md:border-b border-gray-200 md:border-r p-6 md:p-8 flex flex-col justify-between">
            <FeatureCard
              title={features[0].title}
              description={features[0].description}
              imageSrc={features[0].imageSrc}
              imageAlt={features[0].imageAlt}
            />
          </div>

          {/* Column 3 - Row 1 (Top) */}
          <div className="col-span-1 md:row-span-1 border-b md:border-b border-gray-200 md:border-r p-6 md:p-8 flex flex-col justify-between">
            <FeatureCard
              title={features[1].title}
              description={features[1].description}
              imageSrc={features[1].imageSrc}
              imageAlt={features[1].imageAlt}
            />
          </div>

          {/* Column 4 - Row 1 (Top) */}
          <div className="col-span-1 md:row-span-1 border-b md:border-b border-gray-200 p-6 md:p-8 flex flex-col justify-between">
            <FeatureCard
              title={features[2].title}
              description={features[2].description}
              imageSrc={features[2].imageSrc}
              imageAlt={features[2].imageAlt}
            />
          </div>

          {/* Column 2 - Row 2 (Bottom) */}
          <div className="col-span-1 md:row-span-1 md:border-r border-gray-200 p-6 md:p-8 flex flex-col justify-between">
            <FeatureCard
              title={features[3].title}
              description={features[3].description}
              imageSrc={features[3].imageSrc}
              imageAlt={features[3].imageAlt}
            />
          </div>

          {/* Column 3 - Row 2 (Bottom) */}
          <div className="col-span-1 md:row-span-1 md:border-r border-gray-200 p-6 md:p-8 flex flex-col justify-between">
            <FeatureCard
              title={features[4].title}
              description={features[4].description}
              imageSrc={features[4].imageSrc}
              imageAlt={features[4].imageAlt}
            />
          </div>

          {/* Column 4 - Row 2 (Bottom) */}
          <div className="col-span-1 md:row-span-1 p-6 md:p-8 flex flex-col justify-between">
            <FeatureCard
              title={features[5].title}
              description={features[5].description}
              imageSrc={features[5].imageSrc}
              imageAlt={features[5].imageAlt}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
