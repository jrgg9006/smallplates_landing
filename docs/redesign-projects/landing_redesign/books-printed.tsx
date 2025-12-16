"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
// import RecipeModal from "./RecipeModal"; // TODO: Fix import path
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

/**
 * PROOF SECTION (BooksPrinted) — Small Plates Wedding Landing Page
 * 
 * Voice: Margot Cole
 * Purpose: Show that this is REAL. Real recipes from real people.
 * 
 * Copy rationale:
 * - "Real recipes. Real people. Real books."
 *   Three facts. No adjectives. Margot lets the work speak.
 * 
 * - "Every page has a name. Every name has a story."
 *   This is the differentiation. It's not a generic cookbook.
 *   Each recipe is attached to a person who matters.
 * 
 * - The carousel shows actual recipes with author names.
 *   The "Shared by [Name]" format emphasizes the human element.
 * 
 * Design rationale:
 * - Warm background (stone-50) — different from white sections
 * - Carousel for exploration — shows volume and variety
 * - Click to expand — for those who want to see more
 */

export default function BooksPrinted() {
  const router = useRouter();
  const [selectedRecipe, setSelectedRecipe] = useState<typeof books[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Recipe data for the gallery
  const books = [
    {
      id: 1,
      title: "Banana Bread",
      author: "Shared by Irene and Pepe",
      thumbnail: "/images/BooksPrinted/recipe_thumb_1.jpg",
      fullSpread: "/images/BooksPrinted/recipe_modal_1.png",
    },
    {
      id: 2,
      title: "Spaghetti Bolognese",
      author: "Shared by Cris and Ric",
      thumbnail: "/images/BooksPrinted/recipe_thumb_2.jpg",
      fullSpread: "/images/BooksPrinted/recipe_modal_2.png",
    },
    {
      id: 3,
      title: "Foil-Baked Salmon",
      author: "Shared by Cristina Rojas",
      thumbnail: "/images/BooksPrinted/recipe_thumb_3.jpg",
      fullSpread: "/images/BooksPrinted/recipe_modal_3.png",
    },
    {
      id: 4,
      title: "Pasta Cacio e Pepe",
      author: "Shared by Henry and Patita",
      thumbnail: "/images/BooksPrinted/recipe_thumb_4.jpg",
      fullSpread: "/images/BooksPrinted/recipe_modal_4.png",
    },
    {
      id: 5,
      title: "Honey Soy Garlic Salmon",
      author: "Shared by Mo Abdelhamid",
      thumbnail: "/images/BooksPrinted/recipe_thumb_5.jpg",
      fullSpread: "/images/BooksPrinted/recipe_modal_5.png",
    },
    {
      id: 6,
      title: "Sopa Azteca",
      author: "Shared by Alma Orozco",
      thumbnail: "/images/BooksPrinted/recipe_thumb_6.jpg",
      fullSpread: "/images/BooksPrinted/recipe_modal_6.png",
    },
    {
      id: 7,
      title: "Tapas to Get You Out of Trouble",
      author: "Shared by Frida",
      thumbnail: "/images/BooksPrinted/recipe_thumb_7.jpg",
      fullSpread: "/images/BooksPrinted/recipe_modal_7.png",
    },
    {
      id: 8,
      title: "Double Chocolate Cookies",
      author: "Shared by Barbs and Albert",
      thumbnail: "/images/BooksPrinted/recipe_thumb_8.jpg",
      fullSpread: "/images/BooksPrinted/recipe_modal_8.png",
    },
    {
      id: 9,
      title: "Blue Cheese Salad",
      author: "Shared by Nikki and Jorge",
      thumbnail: "/images/BooksPrinted/recipe_thumb_9.jpg",
      fullSpread: "/images/BooksPrinted/recipe_modal_9.png",
    },
    {
      id: 10,
      title: "Cheesecake",
      author: "Shared by Laura and Dany",
      thumbnail: "/images/BooksPrinted/recipe_thumb_10.jpg",
      fullSpread: "/images/BooksPrinted/recipe_modal_10.png",
    },
    {
      id: 11,
      title: "Waffle Sandwiches",
      author: "Shared by Chochos",
      thumbnail: "/images/BooksPrinted/recipe_thumb_11.jpg",
      fullSpread: "/images/BooksPrinted/recipe_modal_11.png",
    },
    {
      id: 12,
      title: "Pork Ramen",
      author: "Shared by Fany",
      thumbnail: "/images/BooksPrinted/recipe_thumb_12.jpg",
      fullSpread: "/images/BooksPrinted/recipe_modal_12.png",
    },
  ];

  const handleBookClick = (book: typeof books[0]) => {
    setSelectedRecipe(book);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  // Autoplay plugin for carousel
  const plugin = useRef(
    Autoplay({ 
      delay: 3000, 
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  return (
    <section 
      className="bg-[#FAF7F2] py-16 md:py-24"
      aria-labelledby="proof-heading"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        
        {/* Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2
            id="proof-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#2D2D2D]"
          >
            Real recipes. Real people. Real books.
          </h2>
          <p className="mt-4 font-sans text-lg md:text-xl text-[#2D2D2D]/60">
            Every page has a name. Every name has a story.
          </p>
        </motion.div>

        {/* Recipe Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Carousel
            plugins={[plugin.current]}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {books.map((book) => (
                <CarouselItem 
                  key={book.id} 
                  className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <button
                    type="button"
                    onClick={() => handleBookClick(book)}
                    className="group w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A854] focus-visible:ring-offset-2 rounded-xl"
                  >
                    {/* Recipe Image */}
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white shadow-sm group-hover:shadow-md transition-shadow duration-300">
                      <Image
                        src={book.thumbnail}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                    
                    {/* Recipe Info */}
                    <div className="mt-4">
                      <h3 className="font-serif text-lg font-medium text-[#2D2D2D] group-hover:text-[#D4A854] transition-colors">
                        {book.title}
                      </h3>
                      <p className="mt-1 font-sans text-sm text-[#9A9590]">
                        {book.author}
                      </p>
                    </div>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation */}
            <div className="hidden md:block">
              <CarouselPrevious className="left-0 -translate-x-1/2 bg-white hover:bg-[#FAF7F2] border-[#E8E0D5]" />
              <CarouselNext className="right-0 translate-x-1/2 bg-white hover:bg-[#FAF7F2] border-[#E8E0D5]" />
            </div>
          </Carousel>
        </motion.div>

        {/* Preview Full Book Link */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <button
            type="button"
            onClick={() => {/* Open book preview modal */}}
            className="font-sans text-[#D4A854] hover:text-[#c49b4a] text-base underline underline-offset-4 transition-colors"
          >
            Preview a full book →
          </button>
        </motion.div>

      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div>
          {/* <RecipeModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            recipe={selectedRecipe}
          /> */}
        </div>
      )}
    </section>
  );
}