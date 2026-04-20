"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen } from "lucide-react";
import { ReviewRecipeCard } from "./ReviewRecipeCard";
import { ReviewRecipeSidebar } from "./ReviewRecipeSidebar";
import { PrintDetailsWizard } from "./PrintDetailsWizard";
import { PrintDetailsSidebar } from "./PrintDetailsSidebar";
import { CloseBookModal } from "../CloseBookModal";
import { closeBook } from "@/lib/supabase/groups";
import type { RecipeForReview, GroupWithMembers } from "@/lib/types/database";

interface ReviewRecipesPageProps {
  group: GroupWithMembers;
  onBack: () => void;
  onMarkReviewed: () => void;
  onStartCloseFlow: () => void;
}

export function ReviewRecipesPage({ group, onBack, onMarkReviewed, onStartCloseFlow }: ReviewRecipesPageProps) {
  const groupId = group.id;
  const [showWizard, setShowWizard] = useState(!group.print_details_confirmed_at);
  const [printCoupleName, setPrintCoupleName] = useState(
    group.print_couple_name || group.couple_display_name || group.name
  );
  const [coupleImageUrl, setCoupleImageUrl] = useState(group.couple_image_url);
  const [recipes, setRecipes] = useState<RecipeForReview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showBookDetails, setShowBookDetails] = useState(false);

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

  if (showWizard) {
    return (
      <PrintDetailsWizard
        groupId={groupId}
        initialName={printCoupleName}
        initialImageUrl={coupleImageUrl}
        onBack={onBack}
        onConfirmed={(data) => {
          setPrintCoupleName(data.printCoupleName);
          setCoupleImageUrl(data.coupleImageUrl);
          setShowWizard(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F0EDE8]">
      {/* Compact header — back, nav, hint, approve all in one row */}
      <div className="flex items-center gap-3 px-3 md:px-6 py-2.5 bg-white border-b border-gray-200 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4 text-brand-charcoal" />
        </button>

        <p className="text-xs text-gray-400 hidden md:block flex-shrink-0">
          This is how your book will be printed.
        </p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Navigation — centered area */}
        {!loading && recipes.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous recipe"
            >
              <ChevronLeft className="h-5 w-5 text-brand-charcoal" />
            </button>
            <span className="text-sm text-gray-600 tabular-nums min-w-[50px] text-center font-medium">
              {currentIndex + 1} / {recipes.length}
            </span>
            <button
              onClick={goNext}
              disabled={isLast}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next recipe"
            >
              <ChevronRight className="h-5 w-5 text-brand-charcoal" />
            </button>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Book details toggle + Approve button */}
        <button
          onClick={() => setShowBookDetails(true)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-charcoal transition-colors flex-shrink-0"
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Book Details</span>
        </button>

        <Button
          onClick={() => setShowConfirmModal(true)}
          className="bg-brand-charcoal text-white hover:bg-gray-800 rounded-full text-xs px-4 py-1.5 h-auto flex-shrink-0"
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

      {/* Book details slide-over panel */}
      <PrintDetailsSidebar
        groupId={groupId}
        printCoupleName={printCoupleName}
        coupleImageUrl={coupleImageUrl}
        isOpen={showBookDetails}
        onClose={() => setShowBookDetails(false)}
        onUpdate={(data) => {
          if (data.printCoupleName !== undefined) setPrintCoupleName(data.printCoupleName);
          if (data.coupleImageUrl !== undefined) setCoupleImageUrl(data.coupleImageUrl);
        }}
      />

      {/* Confirmation modal — appears over the review page */}
      <CloseBookModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onReview={() => setShowConfirmModal(false)}
        onStartCloseFlow={async () => {
          setIsClosing(true);
          const { error: closeError } = await closeBook(groupId);
          if (closeError) {
            console.error("Failed to close book:", closeError);
            setIsClosing(false);
            return;
          }
          setShowConfirmModal(false);
          onStartCloseFlow();
        }}
        reviewed={true}
        recipeCount={recipes.length}
        uniqueContributors={0}
      />
    </div>
  );
}
