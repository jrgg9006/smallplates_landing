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
      author: "Shared by Irene and Pepe",
      color: "bg-emerald-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_1.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_1.png",
    },
    {
      id: 2,
      title: "Spaguetti a la bolonaise",
      author: "Shared by Cris and Ric",
      color: "bg-stone-200",
      thumbnail: "/images/BooksPrinted/recipe_thumb_2.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_2.png",
    },
    {
      id: 3,
      title: "Foil-Baked Salmon",
      author: "Shared by Cristina Rojas",
      color: "bg-slate-500",
      thumbnail: "/images/BooksPrinted/recipe_thumb_3.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_3.png",
    },
    {
      id: 4,
      title: "Pasta Cacio y Pepe",
      author: "Shared by Henry and Patita",
      color: "bg-red-800",
      thumbnail: "/images/BooksPrinted/recipe_thumb_4.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_4.png",
    },
    // Second set
    {
      id: 5,
      title: "Honey Soy Garlic Salmon",
      author: "Shared by Mo Abdelhamid",
      color: "bg-amber-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_5.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_5.png",
    },
    {
      id: 6,
      title: "Sopa Azteca",
      author: "Shared by Alma Orozco",
      color: "bg-indigo-600",
      thumbnail: "/images/BooksPrinted/recipe_thumb_6.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_6.png",
    },
    {
      id: 7,
      title: "Tapas to Get You Out of Trouble",
      author: "Shared by Frida",
      color: "bg-rose-600",
      thumbnail: "/images/BooksPrinted/recipe_thumb_7.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_7.png",
    },
    {
      id: 8,
      title: "Double Chocolate Cookies with Sea Salt",
      author: "Shared by Barbs and Albert",
      color: "bg-teal-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_8.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_8.png",
    },
    // Third set
    {
      id: 9,
      title: "Blue Cheese Salad (Perfect for Summer)",
      author: "Shared by Nikki and Jorge",
      color: "bg-purple-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_9.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_9.png",
    },
    {
      id: 10,
      title: "Cheesecake",
      author: "Shared by Laura and Dany",
      color: "bg-orange-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_10.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_10.png",
    },
    {
      id: 11,
      title: "Waffle Sandwiches",
      author: "Shared by Chochos",
      color: "bg-green-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_11.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_11.png",
    },
    {
      id: 12,
      title: "Pork Ramen",
      author: "Shared by Fany",
      color: "bg-blue-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_12.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_12.png",
    },
    // Fourth set
    {
      id: 13,
      title: "Rigatoni a la Carbonara",
      author: "Shared by Juanpis",
      color: "bg-yellow-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_13.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_13.png",
    },
    {
      id: 14,
      title: "Lentil Soup",
      author: "Shared by Cris and Ric",
      color: "bg-lime-700",
      thumbnail: "/images/BooksPrinted/recipe_thumb_14.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_14.png",
    },
    {
      id: 15,
      title: "Yellow Rice",
      author: "Shared by Jorge Llaca",
      color: "bg-pink-600",
      thumbnail: "/images/BooksPrinted/recipe_thumb_15.jpg",
      fullSpread: "/images/BooksPrinted/recipe_spread_15.png",
    },
    {
      id: 16,
      title: "Leftovers: Lobster Risotto Cakes with Fried Egg",
      author: "Shared by Santi Creixell",
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
      stopOnInteraction: false,
      stopOnMouseEnter: false,
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
              className="inline-flex items-center justify-center rounded-2xl bg-smallplates_red text-white px-8 py-4 text-lg font-semibold shadow-sm hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-600 transition-colors"
            >
              CREATE YOURS FOR $120
            </button>
          </div>
        </div>

        {/* Books Carousel */}
        <Carousel
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
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