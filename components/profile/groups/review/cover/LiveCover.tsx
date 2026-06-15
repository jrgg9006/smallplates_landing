"use client";

import React from "react";
import { COVER_W, COVER_H, DEFAULT_COVER_LINE, splitCoupleName } from "@/lib/cover/layout";

interface LiveCoverProps {
  coverLine: string;
  name: string;
  focusedField: "eyebrow" | "name" | null;
  /** Rendered width in px; the 900×1125 artwork is scaled to fit. */
  width?: number;
}

const PAELLA = "/images/email-pdf/paella_transparent_sm.png";
const AMP = "/images/email-pdf/ampestrand_gold_transparent.png";
const LOGO = "/images/SmallPlates_logo_horizontal.png";

// Reason: the artwork is authored in the canonical 900×1125 coordinate space (the
// same numbers as the Satori render) and CSS-scaled to the requested width, so the
// live preview is pixel-faithful to the printed cover without duplicating geometry.
export function LiveCover({ coverLine, name, focusedField, width = 360 }: LiveCoverProps) {
  const scale = width / COVER_W;
  const { hasAmp, part1, part2, fontSize } = splitCoupleName(name || "");
  const eyebrow = (coverLine || DEFAULT_COVER_LINE).toUpperCase();
  const ampSize = Math.round(fontSize * 1.05);
  const glow = "0 0 0 2px rgba(212,168,84,0.45)";

  return (
    <div style={{ width, height: COVER_H * scale }}>
      <div
        style={{
          width: COVER_W,
          height: COVER_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#f0ece3",
          fontFamily: "'MinionPro-Display', serif",
          boxShadow: "-8px 12px 24px rgba(0,0,0,0.12), -2px 4px 8px rgba(0,0,0,0.08)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PAELLA}
          alt=""
          width={1170}
          height={1170}
          // Reason: explicit px size + maxWidth:none so Tailwind's preflight
          // (`img { max-width: 100%; height: auto }`) can't clamp the 1170px
          // paella down to the 900px parent — that shrinkage is what made the
          // live preview diverge from the Satori/print cover.
          style={{
            position: "absolute",
            top: 110,
            left: (COVER_W - 1170) / 2,
            width: 1170,
            height: 1170,
            maxWidth: "none",
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            position: "absolute",
            top: 152,
            left: 0,
            width: COVER_W,
            textAlign: "center",
            fontSize: 22,
            letterSpacing: "0.24em",
            color: "#8a8c8e",
            padding: "8px 0",
            boxShadow: focusedField === "eyebrow" ? glow : "none",
            borderRadius: 6,
            transition: "box-shadow 0.2s",
          }}
        >
          {eyebrow}
        </div>

        {/* Name */}
        <div
          style={{
            position: "absolute",
            // Reason: 239 + 6px padding-top = 245, matching the Satori name top.
            top: 239,
            left: 6,
            width: COVER_W - 12,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            color: "#4b4b4a",
            lineHeight: 1,
            padding: "6px 0",
            boxShadow: focusedField === "name" ? glow : "none",
            borderRadius: 6,
            transition: "box-shadow 0.2s",
          }}
        >
          <span style={{ fontSize }}>{part1}</span>
          {hasAmp && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={AMP}
                alt="&"
                width={ampSize}
                height={ampSize}
                style={{ width: ampSize, height: ampSize, maxWidth: "none", margin: "0 6px" }}
              />
              <span style={{ fontSize }}>{part2}</span>
            </>
          )}
        </div>

        {/* Logo footer */}
        <div
          style={{
            position: "absolute",
            bottom: 42,
            width: COVER_W,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO}
            alt="Small Plates & Co."
            width={168}
            height={95}
            style={{ width: 168, height: 95, maxWidth: "none", opacity: 0.6 }}
          />
        </div>
      </div>
    </div>
  );
}
