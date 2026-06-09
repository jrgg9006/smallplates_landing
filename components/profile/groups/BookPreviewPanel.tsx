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
      </div>
    );
  }

  // Reason: bust the cover cache on the actual title that will render (matches the
  // priority in the preview-cover route), so editing the cookbook name refreshes
  // the image. Keying on name.length missed same-length edits.
  const coverTitle =
    (group.print_details_confirmed_at && group.print_couple_name) ||
    group.couple_display_name ||
    group.name ||
    "";
  const coverUrl = `/api/v1/admin/pdf-delivery/preview-cover?group_id=${group.id}&v=${encodeURIComponent(coverTitle)}`;

  return (
    <div className="flex items-start justify-center pt-2">
      <div className="relative">
        {/* Book shadow on surface — soft, sits under the flat cover */}
        <div
          className="absolute -bottom-3 left-1 right-3 h-5 rounded-[50%]"
          style={{
            background: "radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Book body — flat front, no 3D rotation, perfectly straight right edge */}
        <div className="relative">
          {/* Cover image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={group.name || "Book cover"}
            className="relative block w-full h-auto"
            style={{
              // Reason: Storyworth-style front shadow — falls down and to the left,
              // no spine/box look.
              boxShadow: "-8px 12px 24px rgba(0,0,0,0.12), -2px 4px 8px rgba(0,0,0,0.08)",
              maxWidth: "280px",
            }}
          />
        </div>
      </div>
    </div>
  );
}
