"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import type { GroupWithMembers } from "@/lib/types/database";
import { CaptainsDropdown } from "@/components/profile/groups/CaptainsDropdown";
import { MIN_RECIPES_TO_PRINT } from "@/lib/stripe/pricing";

interface DashboardChecklistProps {
  group: GroupWithMembers | null;
  recipeCount: number;
  hasCaptains: boolean;
  hasEventInvite: boolean;
  onCreateEventInvite: () => void;
  onInviteCaptain: () => void;
  onAddRecipe: () => void;
  onPrintBook: () => void;
}

export function DashboardChecklist({
  group,
  recipeCount,
  hasCaptains,
  hasEventInvite,
  onCreateEventInvite,
  onInviteCaptain,
  onAddRecipe,
  onPrintBook,
}: DashboardChecklistProps) {
  const [showCaptainsList, setShowCaptainsList] = useState(false);

  if (!group) return null;

  const steps: Array<{
    done: boolean;
    content: React.ReactNode;
    // Reason: trailing renders OUTSIDE the strikethrough wrapper so the
    // "(view)" link stays underlined-without-strike when the step is done.
    trailing?: React.ReactNode;
  }> = [
    {
      done: hasEventInvite,
      content: (
        <>Create your <LinkText onClick={onCreateEventInvite}>event invite</LinkText></>
      ),
    },
    {
      done: hasCaptains,
      content: (
        <>Invite your <LinkText onClick={onInviteCaptain}>captains</LinkText></>
      ),
      trailing: hasCaptains ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCaptainsList((v) => !v)}
            className="text-sm text-[hsl(var(--brand-honey))] hover:text-[hsl(var(--brand-honey-dark))] hover:underline transition-colors"
          >
            (view)
          </button>
          {showCaptainsList && (
            <CaptainsDropdown
              isOpen={showCaptainsList}
              selectedGroup={group}
              onClose={() => setShowCaptainsList(false)}
              onInviteCaptain={() => {
                setShowCaptainsList(false);
                onInviteCaptain();
              }}
              align="left"
            />
          )}
        </div>
      ) : undefined,
    },
    {
      done: recipeCount >= 1,
      content: (
        <>Get your <LinkText onClick={onAddRecipe}>first recipe</LinkText></>
      ),
    },
    {
      done: recipeCount >= MIN_RECIPES_TO_PRINT,
      content: <>Reach +{MIN_RECIPES_TO_PRINT} recipes</>,
    },
    {
      done: !!group.book_closed_by_user,
      content: (
        <><LinkText onClick={onPrintBook}>Print</LinkText> your book — $169</>
      ),
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <div className="mt-6 max-w-[580px] bg-white rounded-2xl border border-[hsl(var(--brand-border))] p-4 sm:p-5 shadow-sm">
      <div className="space-y-1">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-3 sm:gap-3.5 px-2 sm:px-4 py-1.5 rounded-xl"
          >
            {step.done ? (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(var(--brand-honey))] flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </span>
            ) : (
              <span className="w-6 h-6 rounded-full border-2 border-[hsl(var(--brand-border-button))] flex-shrink-0" />
            )}
            <span
              className={`font-serif text-[18px] font-light ${
                step.done
                  ? "text-[hsl(var(--brand-warm-gray))] line-through"
                  : "text-[hsl(var(--brand-charcoal))]"
              }`}
            >
              {step.content}
            </span>
            {step.trailing}
          </div>
        ))}
      </div>

    </div>
  );
}

function LinkText({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="underline underline-offset-2 decoration-[hsl(var(--brand-honey))] hover:text-[hsl(var(--brand-honey))] transition-colors"
    >
      {children}
    </button>
  );
}
