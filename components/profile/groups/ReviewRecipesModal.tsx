"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { getGroupRecipes } from "@/lib/supabase/groupRecipes";
import type { RecipeWithGuest } from "@/lib/types/database";

interface ReviewRecipesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkReviewed: () => void;
  groupId: string;
}

export function ReviewRecipesModal({
  isOpen,
  onClose,
  onMarkReviewed,
  groupId,
}: ReviewRecipesModalProps) {
  const [recipes, setRecipes] = useState<RecipeWithGuest[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingRecipes, setLoadingRecipes] = useState(true);

  useEffect(() => {
    if (!isOpen || !groupId) return;
    setCurrentIndex(0);
    setLoadingRecipes(true);

    const load = async () => {
      const { data } = await getGroupRecipes(groupId);
      setRecipes(data || []);
      setLoadingRecipes(false);
    };
    load();
  }, [isOpen, groupId]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, recipes.length - 1));
  }, [recipes.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Reason: Keyboard navigation for convenience
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, goNext, goPrev]);

  const recipe = recipes[currentIndex];
  const isLast = currentIndex === recipes.length - 1;

  const guest = recipe?.guests;
  const guestName = guest
    ? (guest.printed_name || `${guest.first_name} ${guest.last_name || ""}`.trim())
    : "Unknown Guest";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 bg-white">
        <DialogTitle className="sr-only">Review Recipes</DialogTitle>
        {/* Header */}
        <div className="px-8 pt-6 pb-2 flex-shrink-0">
          <h2 className="type-modal-title text-[hsl(var(--brand-charcoal))]">
            Review Recipes
          </h2>
        </div>

        {/* Recipe Content */}
        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-6">
          {loadingRecipes ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--brand-honey))]" />
            </div>
          ) : recipes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[hsl(var(--brand-warm-gray))]">No recipes to review.</p>
            </div>
          ) : recipe ? (
            <div className="flex flex-col min-w-0">
              {/* Guest name */}
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400 font-serif mb-1">
                {guestName}
              </p>

              {/* Recipe title */}
              <h3 className="font-serif text-3xl lg:text-4xl font-semibold text-brand-charcoal leading-tight mb-4">
                {recipe.recipe_name || "Untitled Recipe"}
              </h3>

              {/* Personal note */}
              {recipe.comments && recipe.comments.trim() && (
                <p className="text-base italic text-gray-500 font-serif mb-6">
                  &ldquo;{recipe.comments}&rdquo;
                </p>
              )}

              {/* Recipe Image */}
              {recipe.document_urls && recipe.document_urls.length > 0 && (
                <div className="flex-shrink-0 mb-6">
                  <div className="rounded-xl overflow-hidden shadow-lg bg-gray-100">
                    <div className="relative aspect-video w-full">
                      <Image
                        src={recipe.document_urls[0]}
                        alt={recipe.recipe_name || "Recipe image"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1280px) 65vw, 50vw"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 my-6" />

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                {/* Ingredients */}
                <div>
                  <h4 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">
                    Ingredients
                  </h4>
                  {recipe.ingredients && recipe.ingredients.trim() ? (
                    <pre className="whitespace-pre-wrap break-words font-serif text-base text-gray-700 leading-relaxed m-0">
                      {recipe.ingredients}
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No ingredients provided</p>
                  )}
                </div>

                {/* Instructions */}
                <div>
                  <h4 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">
                    Instructions
                  </h4>
                  {recipe.instructions && recipe.instructions.trim() ? (
                    <pre className="whitespace-pre-wrap break-words font-serif text-base text-gray-700 leading-[1.6] m-0">
                      {recipe.instructions}
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No instructions provided</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer — navigation centered, button right */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
          {/* Spacer to balance the button on the right */}
          <div className="w-[140px]" />

          {/* Navigation: prev / counter / next — centered */}
          <div className="flex items-center gap-4">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0 || loadingRecipes}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous recipe"
            >
              <ChevronLeft className="h-5 w-5 text-[hsl(var(--brand-charcoal))]" />
            </button>
            {recipes.length > 0 && (
              <span className="text-sm text-[hsl(var(--brand-warm-gray))] tabular-nums min-w-[60px] text-center">
                {currentIndex + 1} of {recipes.length}
              </span>
            )}
            <button
              onClick={goNext}
              disabled={isLast || loadingRecipes}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next recipe"
            >
              <ChevronRight className="h-5 w-5 text-[hsl(var(--brand-charcoal))]" />
            </button>
          </div>

          {/* Mark as Reviewed — right aligned */}
          <Button
            onClick={onMarkReviewed}
            className="bg-black text-white hover:bg-gray-800 rounded-full"
          >
            Mark as Book Reviewed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
