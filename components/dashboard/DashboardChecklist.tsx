"use client";

import React from "react";
import { Check } from "lucide-react";
import type { GroupWithMembers } from "@/lib/types/database";

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
  if (!group) return null;

  const steps = [
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
    },
    {
      done: recipeCount >= 1,
      content: (
        <>Get your <LinkText onClick={onAddRecipe}>first recipe</LinkText></>
      ),
    },
    {
      done: recipeCount >= 25,
      content: <>Reach +25 recipes</>,
    },
    {
      done: !!group.book_closed_by_user,
      content: (
        <><LinkText onClick={onPrintBook}>Print</LinkText> your book</>
      ),
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <div className="mt-6 max-w-[580px] bg-white rounded-2xl border border-[hsl(var(--brand-border))] p-5 shadow-sm">
      <div className="space-y-1">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 px-4 py-1.5 rounded-xl"
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
