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

  const coverUrl = `/api/v1/admin/pdf-delivery/preview-cover?group_id=${group.id}&v=${group.name?.length || 0}`;

  return (
    <div className="flex items-start justify-center pt-2">
      <div
        className="relative"
        style={{
          perspective: "1200px",
        }}
      >
        {/* Book shadow on surface */}
        <div
          className="absolute -bottom-3 left-2 right-2 h-6 rounded-[50%]"
          style={{
            background: "radial-gradient(ellipse, rgba(0,0,0,0.2) 0%, transparent 70%)",
          }}
        />

        {/* Book body */}
        <div
          className="relative"
          style={{
            transform: "rotateY(-4deg)",
            transformOrigin: "left center",
          }}
        >
          {/* Page edges (right side) */}
          <div
            className="absolute top-[3px] -right-[3px] w-[3px] h-[calc(100%-6px)]"
            style={{
              background: "repeating-linear-gradient(to bottom, #f5f0e8, #ebe6dd 1px, #f5f0e8 2px)",
              boxShadow: "1px 0 3px rgba(0,0,0,0.08)",
            }}
          />

          {/* Cover image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={group.name || "Book cover"}
            className="relative block w-full h-auto rounded-r-sm"
            style={{
              boxShadow: "4px 4px 16px rgba(0,0,0,0.15), 1px 1px 4px rgba(0,0,0,0.1)",
              maxWidth: "280px",
            }}
          />
        </div>
      </div>
    </div>
  );
}
