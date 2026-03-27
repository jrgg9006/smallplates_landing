"use client";

import React from "react";
import type { RecipeForReview } from "@/lib/types/database";

interface ReviewRecipeSidebarProps {
  recipes: RecipeForReview[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export function ReviewRecipeSidebar({ recipes, currentIndex, onSelect }: ReviewRecipeSidebarProps) {
  return (
    <div className="hidden md:block w-[340px] flex-shrink-0 border-r border-gray-100 bg-white overflow-y-auto">
      <div className="py-6 px-5">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-serif mb-6">
          {recipes.length} recipes
        </p>
        <div className="flex flex-col">
          {recipes.map((recipe, i) => {
            const isActive = i === currentIndex;
            const name = recipe.print_ready?.recipe_name_clean || recipe.recipe_name || "Untitled";
            const guest = recipe.guests;
            const guestName = guest
              ? (guest.printed_name || `${guest.first_name} ${guest.last_name || ""}`.trim())
              : "";

            return (
              <button
                key={recipe.id}
                onClick={() => onSelect(i)}
                className={`w-full text-left py-4 px-4 transition-all rounded-lg ${
                  isActive
                    ? "bg-[#FAF7F2]"
                    : "hover:bg-gray-50/50"
                }`}
              >
                <p className={`font-serif text-[15px] leading-snug truncate ${
                  isActive ? "text-[#2D2D2D] font-medium" : "text-gray-500"
                }`}>
                  {name}
                </p>
                <p className={`text-xs mt-1 truncate ${
                  isActive ? "text-gray-500" : "text-gray-400"
                }`}>
                  {guestName}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
