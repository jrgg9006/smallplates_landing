"use client";

import React from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { splitCoupleName } from "@/lib/cover/layout";

interface InteriorSpreadProps {
  name: string;
  imageUrl: string | null;
  uploading: boolean;
  onUploadClick: () => void;
}

// Reason: a live HTML replica of the printed interior first spread (pages 3–4).
// Because it is a visibly OPEN book (two pages), the uploaded photo can't be
// mistaken for the front cover. Geometry mirrors the printed dedication page:
// the photo sits in a centered portrait frame with page margins (NOT full-bleed),
// the name is set in Minion Regular and the line below in Minion Italic.
export function InteriorSpread({ name, imageUrl, uploading, onUploadClick }: InteriorSpreadProps) {
  const { hasAmp, part1, part2 } = splitCoupleName(name || "");

  // Portrait photo frame: ~52% of page width, ~0.72 aspect → centering it yields
  // the ~22% top/bottom and ~24% side margins of the printed page.
  const frameStyle = { width: "52%", aspectRatio: "52 / 72" } as const;

  return (
    <div
      className="mx-auto grid w-full max-w-2xl grid-cols-2 overflow-hidden rounded-lg shadow-lg"
      style={{ aspectRatio: "2 / 1.31" }}
    >
      {/* Left page — photo in a centered portrait frame with white margins */}
      <div className="flex items-center justify-center border-r border-black/5 bg-white">
        {imageUrl ? (
          <div className="relative" style={frameStyle}>
            <Image
              src={imageUrl}
              alt="Inside the book"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 30vw, 180px"
            />
          </div>
        ) : (
          <button
            onClick={onUploadClick}
            disabled={uploading}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-brand-honey"
            style={frameStyle}
          >
            {uploading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-brand-honey" />
            ) : (
              <>
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-xs text-gray-500">Upload a photo</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Right page — name (Minion Regular) + subtitle (Minion Italic), centered */}
      <div className="flex flex-col items-center justify-center bg-[#FAF7F2] px-6 text-center">
        <div
          className="flex items-center gap-1.5 text-xl text-brand-charcoal sm:text-2xl"
          style={{ fontFamily: "'MinionPro-Regular', serif" }}
        >
          <span>{part1}</span>
          {hasAmp && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/email-pdf/ampestrand_gold_transparent.png"
                alt="&"
                className="inline-block h-[0.9em] w-auto self-center"
              />
              <span>{part2}</span>
            </>
          )}
        </div>
        <p
          className="mt-2.5 text-xs text-[hsl(var(--brand-warm-gray))] sm:text-sm"
          style={{ fontFamily: "'MinionPro-Italic', serif" }}
        >
          A Small Plates Cookbook
        </p>
      </div>
    </div>
  );
}
