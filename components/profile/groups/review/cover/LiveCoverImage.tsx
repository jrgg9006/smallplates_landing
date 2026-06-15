"use client";

import React, { useEffect, useState } from "react";

interface LiveCoverImageProps {
  name: string;
  coverLine: string;
  /** Rendered width in px. The Satori cover is 900×1125 (4:5). */
  width?: number;
}

// Reason: render the live cover with the SAME Satori route that produces the
// printed-style cover, so the preview is pixel-identical to the real render
// (font included) — an HTML/CSS replica can never match resvg's text rendering.
// Inputs are debounced and the next image is preloaded before swapping, so typing
// updates the cover ~350ms after you stop, with no blank flash.
export function LiveCoverImage({ name, coverLine, width = 360 }: LiveCoverImageProps) {
  const url = useDebouncedCoverUrl(name, coverLine);
  const shownUrl = usePreloadedSwap(url);

  return (
    <div style={{ width }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shownUrl}
        alt="Your book cover"
        width={900}
        height={1125}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          // Storyworth-style front shadow (matches BookPreviewPanel).
          boxShadow: "-8px 12px 24px rgba(0,0,0,0.12), -2px 4px 8px rgba(0,0,0,0.08)",
        }}
      />
    </div>
  );
}

function buildUrl(name: string, coverLine: string): string {
  const params = new URLSearchParams({ name: name || "", cover_line: coverLine || "" });
  return `/api/v1/admin/pdf-delivery/preview-cover?${params.toString()}`;
}

// Debounce the (name, coverLine) inputs into a single URL ~350ms after the last edit.
function useDebouncedCoverUrl(name: string, coverLine: string): string {
  const [url, setUrl] = useState(() => buildUrl(name, coverLine));
  useEffect(() => {
    const t = setTimeout(() => setUrl(buildUrl(name, coverLine)), 350);
    return () => clearTimeout(t);
  }, [name, coverLine]);
  return url;
}

// Preload the next URL in memory and only swap the visible src once it has decoded,
// so the cover never flashes blank between edits.
function usePreloadedSwap(url: string): string {
  const [shownUrl, setShownUrl] = useState(url);
  useEffect(() => {
    if (url === shownUrl) return;
    const img = new window.Image();
    img.onload = () => setShownUrl(url);
    img.src = url;
    return () => {
      img.onload = null;
    };
  }, [url, shownUrl]);
  return shownUrl;
}
