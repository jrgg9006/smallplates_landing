"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import RegalosRecipeModal from "./RegalosRecipeModal";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { trackEvent } from "@/lib/analytics";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "./whatsapp";

export default function RegalosBooksPrinted() {
  const [selectedRecipe, setSelectedRecipe] = useState<typeof books[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const books = [
    // First set (original)
    {
      id: 1,
      title: "Chili",
      author: "Por Karla Acosta",
      color: "bg-emerald-700",
      thumbnail: "/images/regalo-usa-landing/books_printed_US/recipe_thumb_1.png",
      fullSpread: "/images/regalo-usa-landing/books_printed_US/recipe_modal_1.png",
    },
    {
      id: 2,
      title: "Tostadas de Atún Pandémicas",
      author: "Por Jerry",
      color: "bg-stone-200",
      thumbnail: "/images/regalo-usa-landing/books_printed_US/recipe_thumb_2.png",
      fullSpread: "/images/regalo-usa-landing/books_printed_US/recipe_modal_2.png",
    },
    {
      id: 3,
      title: "Pastel de zanahoria de cumpleaños",
      author: "Por Gabriela Ramírez",
      color: "bg-slate-500",
      thumbnail: "/images/regalo-usa-landing/books_printed_US/recipe_thumb_3.png",
      fullSpread: "/images/regalo-usa-landing/books_printed_US/recipe_modal_3.png",
    },
    {
      id: 4,
      title: "Pavo fácil y delicioso",
      author: "Por Ale Velasco",
      color: "bg-red-800",
      thumbnail: "/images/regalo-usa-landing/books_printed_US/recipe_thumb_4.png",
      fullSpread: "/images/regalo-usa-landing/books_printed_US/recipe_modal_4.png",
    },
    // Second set
    {
      id: 5,
      title: "Pound cake de matcha",
      author: "Por Ber y Pat",
      color: "bg-amber-700",
      thumbnail: "/images/regalo-usa-landing/books_printed_US/recipe_thumb_5.png",
      fullSpread: "/images/regalo-usa-landing/books_printed_US/recipe_modal_5.png",
    },
    {
      id: 6,
      title: "Salmón con aceitunas",
      author: "Por Verónica Zorrilla",
      color: "bg-indigo-600",
      thumbnail: "/images/regalo-usa-landing/books_printed_US/recipe_thumb_6.png",
      fullSpread: "/images/regalo-usa-landing/books_printed_US/recipe_modal_6.png",
    },
    {
      id: 7,
      title: "Barritas de especias",
      author: "Por Stephanie Balcázar",
      color: "bg-rose-600",
      thumbnail: "/images/regalo-usa-landing/books_printed_US/recipe_thumb_7.png",
      fullSpread: "/images/regalo-usa-landing/books_printed_US/recipe_modal_7.png",
    },
    {
      id: 8,
      title: "Los mejores tacos de salmón",
      author: "Por Barbs y Albert",
      color: "bg-teal-700",
      thumbnail: "/images/regalo-usa-landing/books_printed_US/recipe_thumb_8.png",
      fullSpread: "/images/regalo-usa-landing/books_printed_US/recipe_modal_8.png",
    },
    // Third set
    {
      id: 9,
      title: "Pastel de tres leches",
      author: "Por Patricia García",
      color: "bg-purple-700",
      thumbnail: "/images/regalo-usa-landing/books_printed_US/recipe_thumb_9.png",
      fullSpread: "/images/regalo-usa-landing/books_printed_US/recipe_modal_9.png",
    },
    {
      id: 10,
      title: "La receta de mamá",
      author: "Por Rosy Carasín",
      color: "bg-orange-700",
      thumbnail: "/images/regalo-usa-landing/books_printed_US/recipe_thumb_10.png",
      fullSpread: "/images/regalo-usa-landing/books_printed_US/recipe_modal_10.png",
    },
    {
      id: 11,
      title: "Pan de plátano",
      author: "Por Isabel Balcázar",
      color: "bg-green-700",
      thumbnail: "/images/regalo-usa-landing/books_printed_US/recipe_thumb_11.png",
      fullSpread: "/images/regalo-usa-landing/books_printed_US/recipe_modal_11.png",
    },
    {
      id: 12,
      title: "Pescado al cilantro",
      author: "Por Pau Berber de Cabelo",
      color: "bg-blue-700",
      thumbnail: "/images/regalo-usa-landing/books_printed_US/recipe_thumb_12.png",
      fullSpread: "/images/regalo-usa-landing/books_printed_US/recipe_modal_12.png",
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
      delay: 2500,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
      stopOnFocusIn: false,
      stopOnLastSnap: false,
      playOnInit: true,
    })
  );

  return (
    <section className="bg-brand-warm-white-warm py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-12 md:mb-16">
          <motion.div
            className="mb-6 lg:mb-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="type-heading mb-4">
              Recetas reales. Gente real. Libros reales.
            </h2>
            <p className="type-body text-brand-charcoal/70 max-w-3xl">
              La gente manda la receta. Nosotros creamos una imagen para cada una.
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <a
              href={buildWhatsAppLink(WHATSAPP_MESSAGES.theBook)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent("start_book_click", { cta_location: "regalos_books_printed_proof" })
              }
              className="btn btn-lg btn-honey"
              data-cta="regalos-proof-primary"
            >
              Hablemos por WhatsApp
            </a>
          </motion.div>
        </div>

        {/* Books Carousel */}
        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          opts={{
            align: "start",
            loop: true,
            skipSnaps: false,
            dragFree: false,
          }}
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {books.map((book) => (
              <CarouselItem key={book.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/4">
                {isMobile ? (
                  <div
                    className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
                    onClick={() => handleBookClick(book)}
                  >
                    {/* Clean Image Display */}
                    <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-lg shadow-md">
                      <Image
                        src={book.thumbnail}
                        alt={book.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <span className="text-white font-semibold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Ver receta
                        </span>
                      </div>
                    </div>

                    {/* Book Info Below */}
                    <div className="text-center">
                      <h3 className="type-subheading text-lg md:text-xl mb-1">
                        {book.title}
                      </h3>
                      <p className="type-caption text-brand-charcoal/60">
                        {book.author}
                      </p>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
                    onClick={() => handleBookClick(book)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "50px" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    {/* Clean Image Display */}
                    <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-lg shadow-md">
                      <Image
                        src={book.thumbnail}
                        alt={book.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <span className="text-white font-semibold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Ver receta
                        </span>
                      </div>
                    </div>

                    {/* Book Info Below */}
                    <div className="text-center">
                      <h3 className="type-subheading text-lg md:text-xl mb-1">
                        {book.title}
                      </h3>
                      <p className="type-caption text-brand-charcoal/60">
                        {book.author}
                      </p>
                    </div>
                  </motion.div>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-4 md:-left-12" />
          <CarouselNext className="-right-4 md:-right-12" />
        </Carousel>
      </div>

      {/* Recipe Modal */}
      <RegalosRecipeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        recipe={selectedRecipe}
      />
    </section>
  );
}
