"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReviewRecipeCard } from "./ReviewRecipeCard";
import { ReviewRecipeSidebar } from "./ReviewRecipeSidebar";
import BrandLoader from "@/components/ui/BrandLoader";
import type { RecipeForReview } from "@/lib/types/database";

interface ReviewRecipesStepProps {
  recipes: RecipeForReview[];
  loading: boolean;
  error: string | null;
  onSaveRecipe: (
    recipeId: string,
    data: { recipe_name: string; ingredients: string; instructions: string; note: string }
  ) => Promise<void>;
  onContinue: () => void;
  // Reason: the next step (Quantity) is locked until the book has enough recipes.
  // When locked, the in-step Continue is disabled and the container shows the
  // "keep adding recipes" banner above the stepper.
  continueDisabled?: boolean;
}

// Reason: Step 2 of the book-review flow. The recipe fetch + save live in the
// container (BookReviewFlow); this component only renders the navigation and
// cards. currentIndex stays local UI state. The old full-screen header, the
// confirm modal, the mobile bottom bar and the print-details slide-over are gone
// — the shared stepper chrome replaces them.
export function ReviewRecipesStep({
  recipes,
  loading,
  error,
  onSaveRecipe,
  onContinue,
  continueDisabled = false,
}: ReviewRecipesStepProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, recipes.length - 1));
  }, [recipes.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Reason: Keyboard navigation for convenience. Guard against arrow keys while
  // editing a recipe's text fields.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const recipe = recipes[currentIndex];
  const isLast = currentIndex === recipes.length - 1;

  return (
    <div className="flex flex-col">
      {/* Short intro — same style as step 1. The big step title lives in the
          container H1 above. */}
      <p className="type-body-small mb-6 max-w-4xl text-pretty">
        Review that everyone is here. We&apos;ll format every recipe and{" "}
        <span className="font-medium text-brand-charcoal">create an image for each one</span>.
      </p>

      {/* Control row — nav + continue */}
      <div className="mb-4 flex items-center gap-3">
        {!loading && recipes.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous recipe"
            >
              <ChevronLeft className="h-5 w-5 text-brand-charcoal" />
            </button>
            <span className="min-w-[50px] text-center text-sm font-medium tabular-nums text-gray-600">
              {currentIndex + 1} / {recipes.length}
            </span>
            <button
              onClick={goNext}
              disabled={isLast}
              className="rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next recipe"
            >
              <ChevronRight className="h-5 w-5 text-brand-charcoal" />
            </button>
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={onContinue}
          disabled={loading || recipes.length === 0 || continueDisabled}
          className="btn btn-sm btn-dark"
        >
          Continue
        </button>
      </div>

      {/* Loading / error / empty — short container centered near the top of the
          viewport so the loader is visible. The tall book-page layout below is
          only used once there's an actual recipe to render. */}
      {loading ? (
        <div className="flex justify-center pt-12">
          <BrandLoader inline message="Loading recipes…" />
        </div>
      ) : error ? (
        <div className="flex justify-center pt-12">
          <p className="text-red-500">{error}</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex justify-center pt-12">
          <p className="font-serif text-gray-400">No recipes to review.</p>
        </div>
      ) : (
        /* Content — sidebar + page. Tall near-viewport height; the card holds an
           8x10 page proportion (centered) and scrolls internally. This is the main
           review surface, so it should read like a real book page. */
        <div className="flex h-[calc(100vh-2rem)] gap-6 md:min-h-[960px]">
          <ReviewRecipeSidebar
            recipes={recipes}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
          />

          <div className="flex min-h-0 flex-1 flex-col">
            {recipe && (
              <ReviewRecipeCard
                key={recipe.id}
                recipe={recipe}
                index={currentIndex}
                total={recipes.length}
                onSave={onSaveRecipe}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
