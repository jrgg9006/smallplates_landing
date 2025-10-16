"use client";

import { useState } from "react";
import Image from "next/image";
import RecipeModal from "./RecipeModal";

export default function BooksPrinted() {
  const [selectedRecipe, setSelectedRecipe] = useState<typeof books[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Book data for the gallery
  const books = [
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
      title: "Stories from Grandpa",
      author: "by Eugene Castillo",
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
  ];

  const handleBookClick = (book: typeof books[0]) => {
    setSelectedRecipe(book);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

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

        {/* Books Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {books.map((book) => (
            <div
              key={book.id}
              className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
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
          ))}
        </div>
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