"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { StepBar, type StepNumber } from "./StepBar";
import { PrintDetailsStep } from "./PrintDetailsStep";
import { ReviewRecipesStep } from "./ReviewRecipesStep";
import { QuantityStep } from "./QuantityStep";
import { ApprovalModal } from "./ApprovalModal";
import { MIN_RECIPES_TO_PRINT } from "@/lib/stripe/pricing";
import type { GroupWithMembers, RecipeForReview } from "@/lib/types/database";

// Reason: only steps 1-3 render a screen. Step 4 (Checkout) IS the Stripe page —
// clicking "Continue to payment" redirects there directly, and the bar lights up
// step 4 during the redirect.
type ScreenStep = 1 | 2 | 3;

interface BookReviewFlowProps {
  group: GroupWithMembers;
  isOwner: boolean;
  recipeCount: number;
  onExit: () => void;
}

// Reason: Single container for the Storyworth-style "Review your book" flow. Owns
// the step state, the shared draft (couple name/photo, quantity), and the recipe
// fetch. Step 3 (Checkout) is gated until the book has MIN_RECIPES_TO_PRINT
// recipes. The recipe fetch lives here (not in step 2) so it runs once and the
// gate can read the live recipeCount prop, not the async recipes.length.
export function BookReviewFlow({ group, isOwner, recipeCount, onExit }: BookReviewFlowProps) {
  const groupId = group.id;

  // Reason: returning owners who already confirmed print details land on step 2.
  const [step, setStep] = useState<ScreenStep>(group.print_details_confirmed_at ? 2 : 1);
  const [printCoupleName, setPrintCoupleName] = useState(
    group.print_couple_name || group.couple_display_name || group.name
  );
  const [coupleImageUrl, setCoupleImageUrl] = useState(group.couple_image_url);
  const [qty, setQty] = useState(1);
  const [redirecting, setRedirecting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [showApproval, setShowApproval] = useState(false);
  const [ownerApprovedAt, setOwnerApprovedAt] = useState(group.owner_approved_at);
  // Reason: captains approve in-UI only (not persisted). Track their approval for
  // this session so the gate logic can treat owner + captain uniformly.
  const [captainApproved, setCaptainApproved] = useState(false);

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
  // Reason: the print approval is a hard gate. Steps 3 (Quantity) & 4 (Checkout)
  // stay locked until the user passes the approval modal — owners can't reach
  // payment without confirming, and the bar can't be used to skip it.
  const approved = isOwner ? !!ownerApprovedAt : captainApproved;
  const unlockedMax: StepNumber = canPrint && approved ? 4 : 2;

  // Reason: "Continue to payment" (and clicking step 4 in the bar) go straight to
  // Stripe — there is no step 4 screen of ours. Address + promo code are entered
  // in Stripe; the webhook records the order and closes the book on payment.
  const handlePay = async () => {
    setRedirecting(true);
    setPayError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout-book-close-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, qty }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setPayError(data.error || "Something went wrong. Please try again.");
        setRedirecting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setPayError("Something went wrong. Please try again.");
      setRedirecting(false);
    }
  };

  const goToStep = (n: StepNumber) => {
    if (n === 4) {
      if (canPrint && isOwner) handlePay();
      return;
    }
    if (n <= unlockedMax) setStep(n);
  };

  // Reason: leaving the Recipes step requires an explicit print approval. The
  // modal shows for everyone, but only the OWNER's approval is persisted (captains
  // continue in-UI). Owner approval gates nothing extra here — payment is already
  // owner-only — but it gives operations a defensible "owner signed off" record.
  const handleApprovalConfirm = async () => {
    if (isOwner) {
      try {
        const res = await fetch(`/api/v1/groups/${groupId}/owner-approval`, {
          method: "PATCH",
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.owner_approved_at) {
          setOwnerApprovedAt(data.owner_approved_at);
        }
      } catch {
        // Reason: don't block the user on a logging failure. The real gate is
        // the server-side owner + recipe checks at checkout.
      }
    } else {
      setCaptainApproved(true);
    }
    setShowApproval(false);
    // Reason: approval just unlocked step 3, so this advances past the gate.
    setStep(3);
  };

  // Reason: title is contextual to the active screen (steps 1-3).
  const STEP_TITLES: Record<ScreenStep, string> = {
    1: "Add the couple's name and photo",
    2: "Review your cookbook",
    3: "How many copies?",
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

      {/* Captain notice on the Quantity step — only the owner can close & pay. */}
      {!isOwner && step === 3 && (
        <div className="border-b border-[#F0DCC8] bg-[#FBEFE6]">
          <div className="mx-auto flex w-full max-w-[1100px] items-center gap-2.5 px-4 py-3 sm:px-8">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#8A5A2B]" />
            <p className="text-[13px] leading-relaxed text-[#8A5A2B]">
              Only the owner can close and print this book. Please contact them.
            </p>
          </div>
        </div>
      )}

      <section className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-8 sm:py-8">
        {/* Title + back on one row — back aligned right to save vertical space */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="font-serif text-[28px] leading-tight text-brand-charcoal sm:text-[40px]">
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
          {/* Reason: while redirecting to Stripe, light up step 4 (Checkout). */}
          <StepBar
            current={redirecting ? 4 : step}
            unlockedMax={unlockedMax}
            onStepClick={goToStep}
          />
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
          onContinue={() => setShowApproval(true)}
          continueDisabled={!canPrint}
        />
      )}

      {step === 3 && (
        <QuantityStep
          qty={qty}
          onQtyChange={setQty}
          onPay={handlePay}
          isOwner={isOwner}
          redirecting={redirecting}
          error={payError}
          group={group}
          recipeCount={recipeCount}
        />
      )}
      </section>

      <ApprovalModal
        isOpen={showApproval}
        onClose={() => setShowApproval(false)}
        onConfirm={handleApprovalConfirm}
        alreadyApproved={isOwner && !!ownerApprovedAt}
      />
    </>
  );
}
