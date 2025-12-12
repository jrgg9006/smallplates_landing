"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Book } from "lucide-react";
import type { GroupWithMembers } from "@/lib/types/database";

interface BookPreviewPanelProps {
  group: GroupWithMembers | null;
  recipeCount: number;
  onPreviewClick?: () => void;
}

export function BookPreviewPanel({ group, recipeCount, onPreviewClick }: BookPreviewPanelProps) {
  if (!group) {
    return (
      <div className="book-preview">
        <div className="book-preview__cover">
          <div className="book-preview__title">Your Cookbook</div>
          <div className="book-preview__subtitle">Ready to get started</div>
        </div>
        <div className="book-preview__progress">
          <span className="book-preview__progress-count">0</span> recipes
        </div>
      </div>
    );
  }

  // Extract couple names from group name or use group name as-is
  const bookTitle = group.name || "Your Cookbook";
  const bookSubtitle = "A cookbook by everyone who loves you";

  return (
    <div className="book-preview">
      {/* Book Cover */}
      <div className="book-preview__cover">
        <div className="book-preview__title">
          {bookTitle}
        </div>
        <div className="h-4" /> {/* Spacer */}
        <div className="book-preview__subtitle text-center">
          {bookSubtitle}
        </div>
      </div>

      {/* Recipe Count & Progress */}
      <div className="book-preview__progress">
        <span className="book-preview__progress-count">{recipeCount}</span> 
        {recipeCount === 1 ? " recipe" : " recipes"}
      </div>

      {/* Progress Bar (optional) */}
      {recipeCount > 0 && (
        <div className="mt-4 w-full bg-[hsl(var(--brand-sand))] rounded-full h-2">
          <div 
            className="bg-[hsl(var(--brand-honey))] h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((recipeCount / 20) * 100, 100)}%` }}
          />
        </div>
      )}

      {/* Preview Book Button */}
      <Button
        onClick={onPreviewClick}
        variant="ghost" 
        className="mt-6 text-[hsl(var(--brand-honey))] hover:text-[hsl(var(--brand-honey-dark))] hover:bg-transparent p-0 h-auto font-medium"
      >
        <Book className="w-4 h-4 mr-2" />
        Preview Book
      </Button>
    </div>
  );
}