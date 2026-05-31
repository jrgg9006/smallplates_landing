"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { StepBar, type StepNumber } from "./StepBar";
import { PrintDetailsStep } from "./PrintDetailsStep";
import { ReviewRecipesStep } from "./ReviewRecipesStep";
import { QuantityStep } from "./QuantityStep";
import { OrderSummaryStep } from "./OrderSummaryStep";
import { MIN_RECIPES_TO_PRINT } from "@/lib/stripe/pricing";
import type { GroupWithMembers, RecipeForReview } from "@/lib/types/database";

interface BookReviewFlowProps {
  group: GroupWithMembers;
  isOwner: boolean;
  recipeCount: number;
  onExit: () => void;
}

// Reason: Single container for the Storyworth-style "Review your book" flow. Owns
// the step state, the shared draft (couple name/photo, quantity), and the recipe
// fetch. Steps 3 & 4 are gated until the book has MIN_RECIPES_TO_PRINT recipes.
// The recipe fetch lives here (not in step 2) so it runs once and the gate can
// read the live recipeCount prop, not the async recipes.length.
export function BookReviewFlow({ group, isOwner, recipeCount, onExit }: BookReviewFlowProps) {
  const groupId = group.id;

  // Reason: returning owners who already confirmed print details land on step 2.
  const [step, setStep] = useState<StepNumber>(group.print_details_confirmed_at ? 2 : 1);
  const [printCoupleName, setPrintCoupleName] = useState(
    group.print_couple_name || group.couple_display_name || group.name
  );
  const [coupleImageUrl, setCoupleImageUrl] = useState(group.couple_image_url);
  const [qty, setQty] = useState(1);

  const [recipes, setRecipes] = useState<RecipeForReview[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [recipesError, setRecipesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      setRecipesLoading(true);
      try {
        const res = await fetch(`/api/v1/groups/${groupId}/review-recipes`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load recipes");
        setRecipes(json.recipes || []);
      } catch (err) {
        setRecipesError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setRecipesLoading(false);
      }
    };
    fetchRecipes();
  }, [groupId]);

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
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipeId ? { ...r, print_ready: json.print_ready } : r))
    );
  };

  const canPrint = recipeCount >= MIN_RECIPES_TO_PRINT;
  const unlockedMax: StepNumber = canPrint ? 4 : 2;

  const goToStep = (n: StepNumber) => {
    if (n <= unlockedMax) setStep(n);
  };

  // Reason: title is contextual to the active step. Steps 3 & 4 keep their own
  // big title inside QuantityStep / OrderSummaryStep, so here we only title 1 & 2.
  const STEP_TITLES: Record<StepNumber, string> = {
    1: "Add the couple's name and photo",
    2: "Review your cookbook",
    3: "How many copies?",
    4: "Review your order",
  };

  return (
    <>
      {/* Under-minimum banner — full-width strip pinned right under the header,
          text aligned to the content gutter (Storyworth style). Only shown on the
          Recipes step, where "add more recipes" is the relevant action. */}
      {!canPrint && step === 2 && (
        <div className="border-b border-[#F0DCC8] bg-[#FBEFE6]">
          <div className="mx-auto flex w-full max-w-[1100px] items-center gap-2.5 px-4 py-3 sm:px-8">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#8A5A2B]" />
            <p className="text-[13px] leading-relaxed text-[#8A5A2B]">
              We can only print books with more than {MIN_RECIPES_TO_PRINT} recipes. Keep
              adding more!
            </p>
          </div>
        </div>
      )}

      <section className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-8 sm:py-8">
        {/* Title + back on one row — back aligned right to save vertical space */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="font-serif text-[40px] leading-tight text-brand-charcoal">
            {STEP_TITLES[step]}
          </h1>
          <button
            onClick={onExit}
            className="inline-flex flex-shrink-0 items-center gap-1.5 text-sm text-[hsl(var(--brand-warm-gray))] transition-colors hover:text-brand-charcoal"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to your book
          </button>
        </div>

        <div className="mb-8">
          <StepBar current={step} unlockedMax={unlockedMax} onStepClick={goToStep} />
        </div>

        {/* Active step */}
      {step === 1 && (
        <PrintDetailsStep
          groupId={groupId}
          name={printCoupleName}
          imageUrl={coupleImageUrl}
          onNameChange={setPrintCoupleName}
          onImageChange={setCoupleImageUrl}
          onContinue={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <ReviewRecipesStep
          recipes={recipes}
          loading={recipesLoading}
          error={recipesError}
          onSaveRecipe={handleSaveRecipe}
          onContinue={() => goToStep(3)}
          continueDisabled={!canPrint}
        />
      )}

      {step === 3 && (
        <QuantityStep qty={qty} onQtyChange={setQty} onContinue={() => goToStep(4)} />
      )}

        {step === 4 && <OrderSummaryStep groupId={groupId} qty={qty} isOwner={isOwner} />}
      </section>
    </>
  );
}
