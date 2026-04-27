"use client";

import { useState } from "react";

type ButtonSpec = {
  name: string;
  description: string;
  base: {
    bg: string;
    color: string;
    border?: string;
    padding: string;
    fontSize: string;
    fontWeight: string;
  };
  hover: {
    bg: string;
    color?: string;
    border?: string;
  };
  radius: string;
  label: string;
  width: "full" | "auto";
};

const BUTTON_SPECS: ButtonSpec[] = [
  {
    name: "btn-cta-honey",
    description:
      "Landing page CTAs. Large, warm, inviting. Replaces 4 inline-duplicated landing primaries.",
    base: {
      bg: "#D4A854",
      color: "#FFFFFF",
      padding: "px-8 py-4",
      fontSize: "text-lg",
      fontWeight: "font-medium",
    },
    hover: {
      bg: "#C49B4A",
    },
    radius: "9999px",
    label: "Start a book",
    width: "auto",
  },
  {
    name: "btn-primary",
    description:
      "Primary action inside flows (profile, onboarding, checkout). Replaces 8 copy-pasted charcoal pills.",
    base: {
      bg: "#2D2D2D",
      color: "#FFFFFF",
      padding: "px-8 py-4",
      fontSize: "text-base",
      fontWeight: "font-medium",
    },
    hover: {
      bg: "#1A1A1A",
    },
    radius: "9999px",
    label: "Continue",
    width: "full",
  },
  {
    name: "btn-secondary",
    description:
      "Companion to btn-primary. Back, Skip, Cancel at flow-level. New category — does not exist consolidated today.",
    base: {
      bg: "#FFFFFF",
      color: "#2D2D2D",
      border: "1px solid #E8E0D5",
      padding: "px-8 py-4",
      fontSize: "text-base",
      fontWeight: "font-medium",
    },
    hover: {
      bg: "#F5F1EA",
    },
    radius: "9999px",
    label: "Back",
    width: "full",
  },
  {
    name: "btn-modal-primary",
    description:
      "Primary action inside any modal. Lighter than btn-primary (py-3, text-sm). Consolidates ~15 variants.",
    base: {
      bg: "#2D2D2D",
      color: "#FFFFFF",
      padding: "px-6 py-3",
      fontSize: "text-sm",
      fontWeight: "font-medium",
    },
    hover: {
      bg: "#1A1A1A",
    },
    radius: "9999px",
    label: "Save changes",
    width: "auto",
  },
  {
    name: "btn-modal-secondary",
    description: "Cancel / Close inside a modal. Companion to btn-modal-primary.",
    base: {
      bg: "#FFFFFF",
      color: "#5A5550",
      border: "1px solid #E8E0D5",
      padding: "px-6 py-3",
      fontSize: "text-sm",
      fontWeight: "font-medium",
    },
    hover: {
      bg: "#F5F1EA",
    },
    radius: "9999px",
    label: "Cancel",
    width: "auto",
  },
];

function StagingButton({ spec }: { spec: ButtonSpec }) {
  const [isHovering, setIsHovering] = useState(false);

  const state = isHovering ? spec.hover : spec.base;

  const style = {
    backgroundColor: state.bg ?? spec.base.bg,
    color: state.color ?? spec.base.color,
    border: state.border ?? spec.base.border ?? "none",
    borderRadius: spec.radius,
    transition: "background-color 200ms ease, color 200ms ease, border-color 200ms ease",
  };

  const widthClass = spec.width === "full" ? "w-full" : "";

  return (
    <button
      type="button"
      style={style}
      className={`${spec.base.padding} ${spec.base.fontSize} ${spec.base.fontWeight} ${widthClass}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {spec.label}
    </button>
  );
}

function ButtonRow({ spec }: { spec: ButtonSpec }) {
  return (
    <div className="border border-[#E8E0D5] rounded-xl p-6 space-y-4 bg-[#FAF9F7]">
      <div>
        <p className="text-sm font-semibold text-[#2D2D2D]">{spec.name}</p>
        <p className="text-sm text-[#5A5550] mt-1">{spec.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* On warm-white (default app bg) */}
        <div className="p-4 bg-[#FAF9F7] border border-[#E8E0D5] rounded-lg">
          <StagingButton spec={spec} />
        </div>

        {/* On warm-white-accent (landing sections) */}
        <div className="p-4 bg-[#FAF7F2] border border-[#E8E0D5] rounded-lg">
          <StagingButton spec={spec} />
        </div>

        {/* On white (modals / cards) */}
        <div className="p-4 bg-[#FFFFFF] border border-[#E8E0D5] rounded-lg">
          <StagingButton spec={spec} />
        </div>
      </div>

      <div className="text-xs text-[#8A8780] flex flex-wrap gap-x-4 gap-y-1">
        <span>bg app (#FAF9F7)</span>
        <span>bg landing (#FAF7F2)</span>
        <span>bg modal (#FFFFFF)</span>
      </div>
    </div>
  );
}

function PairingDemo() {
  const primary = BUTTON_SPECS.find((s) => s.name === "btn-primary");
  const secondary = BUTTON_SPECS.find((s) => s.name === "btn-secondary");
  const modalPrimary = BUTTON_SPECS.find((s) => s.name === "btn-modal-primary");
  const modalSecondary = BUTTON_SPECS.find((s) => s.name === "btn-modal-secondary");

  if (!primary || !secondary || !modalPrimary || !modalSecondary) return null;

  return (
    <div className="space-y-6 border border-[#E8E0D5] rounded-xl p-6 bg-[#FAF9F7]">
      <div>
        <p className="text-sm font-semibold text-[#2D2D2D]">
          Pairing - btn-primary + btn-secondary (typical flow)
        </p>
        <div className="mt-3 space-y-3">
          <StagingButton spec={primary} />
          <StagingButton spec={secondary} />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-[#2D2D2D]">
          Pairing - btn-modal-primary + btn-modal-secondary (typical modal footer)
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <StagingButton spec={modalPrimary} />
          <StagingButton spec={modalSecondary} />
        </div>
      </div>
    </div>
  );
}

export default function Phase2ButtonsPreviewPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F7] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-[#2D2D2D]">
            Phase 2 - Button system preview
          </h1>
          <p className="text-sm text-[#5A5550] mt-2 max-w-3xl">
            Five canonical button classes shown on three background contexts.
            Hover each button to see its active state. Not production - this
            route is staging only.
          </p>
        </div>

        <div className="space-y-6">
          {BUTTON_SPECS.map((spec) => (
            <ButtonRow key={spec.name} spec={spec} />
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#2D2D2D] mb-3">
            Pairings in context
          </h2>
          <PairingDemo />
        </div>

        <p className="text-sm text-[#8A8780]">
          Preserved outside this system (not migrated): ProfileHeader buttons,
          ghost buttons in dropdowns/tables, icon-round buttons, structural
          unstyled buttons in containers.
        </p>
      </div>
    </main>
  );
}
