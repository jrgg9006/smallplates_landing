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

// Reason: a live HTML replica of the interior first spread (pages 3–4). Because it
// is a visibly OPEN book (two pages), the uploaded photo can't be mistaken for the
// front cover — which is the whole point of the redesign.
export function InteriorSpread({ name, imageUrl, uploading, onUploadClick }: InteriorSpreadProps) {
  const { hasAmp, part1, part2 } = splitCoupleName(name || "");

  return (
    <div
      className="mx-auto grid w-full max-w-2xl grid-cols-2 overflow-hidden rounded-lg shadow-lg"
      style={{ aspectRatio: "2 / 1.28" }}
    >
      {/* Left page — photo */}
      <div className="relative flex items-center justify-center border-r border-black/5 bg-white p-5">
        {imageUrl ? (
          <div className="relative h-full w-full">
            <Image
              src={imageUrl}
              alt="Inside the book"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 320px"
            />
          </div>
        ) : (
          <button
            onClick={onUploadClick}
            disabled={uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-brand-honey"
          >
            {uploading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-brand-honey" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-gray-400" />
                <span className="text-sm text-gray-500">Upload a photo</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Right page — name + subtitle */}
      <div
        className="flex flex-col items-center justify-center bg-[#FAF7F2] p-5 text-center"
        style={{ fontFamily: "'MinionPro-Display', serif" }}
      >
        <div className="flex items-center gap-1.5 text-xl text-brand-charcoal sm:text-2xl">
          <span>{part1}</span>
          {hasAmp && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/email-pdf/ampestrand_gold_transparent.png" alt="&" className="inline-block h-[0.9em] w-auto self-center" />
              <span>{part2}</span>
            </>
          )}
        </div>
        <p className="mt-2 text-xs italic text-[hsl(var(--brand-warm-gray))] sm:text-sm">
          A Small Plates Cookbook
        </p>
      </div>
    </div>
  );
}
