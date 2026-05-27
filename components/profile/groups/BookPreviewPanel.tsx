"use client";

import React from "react";
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

    </div>
  );
}