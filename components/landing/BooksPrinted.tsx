"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import RecipeModal from "./RecipeModal";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function BooksPrinted() {
  const [selectedRecipe, setSelectedRecipe] = useState<typeof books[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Book data for the gallery - expanded to 16 items for carousel
  const books = [
    // First set (original)
    {
      id: 1,
      title: "Banana Bread",
      author: "by Irene and Pepe",
      color: "bg-emerald-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_1.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_1.png",
    },
    {
      id: 2,
      title: "Spaguetti a la bolonaise",
      author: "by Cris and Ric",
      color: "bg-stone-200",
      thumbnail: "/images/BooksPrinted/recipe_thumb_2.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_2.png",
    },
    {
      id: 3,
      title: "My Life Stories",
      author: "by Richard Sullivan",
      color: "bg-slate-500",
      thumbnail: "/images/BooksPrinted/recipe_thumb_3.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_3.png",
    },
    {
      id: 4,
      title: "Time Well Spent",
      author: "by William Bell",
      color: "bg-red-800",
      thumbnail: "/images/BooksPrinted/recipe_thumb_4.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_4.png",
    },
    // Second set
    {
      id: 5,
      title: "Sunday Roast",
      author: "by Maria Garcia",
      color: "bg-amber-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_5.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_5.png",
    },
    {
      id: 6,
      title: "Family Secrets",
      author: "by James Mitchell",
      color: "bg-indigo-600",
      thumbnail: "/images/BooksPrinted/recipe_thumb_6.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_6.png",
    },
    {
      id: 7,
      title: "Comfort Foods",
      author: "by Sarah Chen",
      color: "bg-rose-600",
      thumbnail: "/images/BooksPrinted/recipe_thumb_7.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_7.png",
    },
    {
      id: 8,
      title: "Kitchen Tales",
      author: "by Robert Wilson",
      color: "bg-teal-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_8.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_8.png",
    },
    // Third set
    {
      id: 9,
      title: "Holiday Favorites",
      author: "by Emily Thompson",
      color: "bg-purple-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_9.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_9.png",
    },
    {
      id: 10,
      title: "Sweet Memories",
      author: "by David Martinez",
      color: "bg-orange-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_10.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_10.png",
    },
    {
      id: 11,
      title: "Garden to Table",
      author: "by Lisa Anderson",
      color: "bg-green-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_11.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_11.png",
    },
    {
      id: 12,
      title: "Coastal Cuisine",
      author: "by Michael Brown",
      color: "bg-blue-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_12.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_12.png",
    },
    // Fourth set
    {
      id: 13,
      title: "Spice Journey",
      author: "by Priya Patel",
      color: "bg-yellow-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_13.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_13.png",
    },
    {
      id: 14,
      title: "Farm Fresh",
      author: "by Thomas Green",
      color: "bg-lime-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_14.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_14.png",
    },
    {
      id: 15,
      title: "Baking Love",
      author: "by Jennifer White",
      color: "bg-pink-600",
      thumbnail: "/images/BooksPrinted/recipe_thumb_15.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_15.png",
    },
    {
      id: 16,
      title: "Soul Kitchen",
      author: "by Marcus Johnson",
      color: "bg-gray-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_16.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_16.png",
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
      delay: 5000, 
      stopOnInteraction: true,
      stopOnMouseEnter: true,
      stopOnFocusIn: false
    })
  );

  return (
    <section className="bg-stone-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-12 md:mb-16">
          <div className="mb-6 lg:mb-0">
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-gray-900 mb-4">
              <span className="font">With</span> <span className="italic">hundreds</span> of cookbooks printed
            </h2>
            <p className="text-lg md:text-xl text-gray-900 max-w-2xl">
            More than recipes — we help people capture the stories and moments that bring them together.
            </p>
          </div>
          
          {/* CTA Button */}
          <div className="flex-shrink-0">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-orange-600 text-white px-8 py-4 text-lg font-semibold shadow-sm hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-600 transition-colors"
            >
              CREATE YOURS FOR $120
            </button>
          </div>
        </div>

        {/* Books Carousel */}
        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {books.map((book) => (
              <CarouselItem key={book.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/4">
                <div
                  className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer h-full"
                  onClick={() => handleBookClick(book)}
                >
                  {/* Clean Image Display */}
                  <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-lg shadow-md">
                    {/* Recipe thumbnail image */}
                    <Image
                      src={book.thumbnail}
                      alt={`${book.title} recipe preview`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        View Recipe
                      </span>
                    </div>
                  </div>
                  
                  {/* Book Info Below */}
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {book.author}
                    </p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-4 md:-left-12" />
          <CarouselNext className="-right-4 md:-right-12" />
        </Carousel>
      </div>

      {/* Recipe Modal */}
      <RecipeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        recipe={selectedRecipe}
      />
    </section>
  );
}