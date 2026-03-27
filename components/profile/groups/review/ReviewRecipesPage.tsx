"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { ReviewRecipeCard } from "./ReviewRecipeCard";
import { ReviewRecipeSidebar } from "./ReviewRecipeSidebar";
import type { RecipeForReview } from "@/lib/types/database";

interface ReviewRecipesPageProps {
  groupId: string;
  onBack: () => void;
  onMarkReviewed: () => void;
}

export function ReviewRecipesPage({ groupId, onBack, onMarkReviewed }: ReviewRecipesPageProps) {
  const [recipes, setRecipes] = useState<RecipeForReview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/groups/${groupId}/review-recipes`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load recipes");
        setRecipes(json.recipes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, [groupId]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, recipes.length - 1));
  }, [recipes.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Reason: Keyboard navigation for convenience
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const handleSaveRecipe = async (
    recipeId: string,
    data: { recipe_name: string; ingredients: string; instructions: string; note: string }
  ) => {
    const res = await fetch(`/api/v1/groups/${groupId}/review-recipes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId, ...data }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to save");

    // Reason: Update local state with the new print-ready data
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId ? { ...r, print_ready: json.print_ready } : r
      )
    );
  };

  const recipe = recipes[currentIndex];
  const isLast = currentIndex === recipes.length - 1;

  return (
    <div className="flex flex-col h-screen bg-[#F0EDE8]">
      {/* Compact header — back, nav, hint, approve all in one row */}
      <div className="flex items-center gap-3 px-3 md:px-6 py-2.5 bg-white border-b border-gray-200 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4 text-[#2D2D2D]" />
        </button>

        <p className="text-xs text-gray-400 hidden md:block flex-shrink-0">
          This is how your book will be printed.
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Navigation — centered area */}
        {!loading && recipes.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous recipe"
            >
              <ChevronLeft className="h-4 w-4 text-[#2D2D2D]" />
            </button>
            <span className="text-xs text-gray-500 tabular-nums min-w-[50px] text-center">
              {currentIndex + 1} / {recipes.length}
            </span>
            <button
              onClick={goNext}
              disabled={isLast}
              className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next recipe"
            >
              <ChevronRight className="h-4 w-4 text-[#2D2D2D]" />
            </button>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Approve button */}
        <Button
          onClick={onMarkReviewed}
          className="bg-[#2D2D2D] text-white hover:bg-gray-800 rounded-full text-xs px-4 py-1.5 h-auto flex-shrink-0"
        >
          I&apos;ve reviewed everything
        </Button>
      </div>

      {/* Main content — maximized */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (desktop only) */}
        {!loading && recipes.length > 0 && (
          <ReviewRecipeSidebar
            recipes={recipes}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
          />
        )}

        {/* Recipe content — card fills this area */}
        <div className="flex-1 overflow-hidden px-4 md:px-8 py-4 flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A854]" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">{error}</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 font-serif">No recipes to review.</p>
            </div>
          ) : recipe ? (
            <ReviewRecipeCard
              key={recipe.id}
              recipe={recipe}
              index={currentIndex}
              total={recipes.length}
              onSave={handleSaveRecipe}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
