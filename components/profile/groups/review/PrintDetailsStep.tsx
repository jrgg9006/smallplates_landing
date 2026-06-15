"use client";

import React, { useState, useRef } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { LiveCoverImage } from "./cover/LiveCoverImage";
import { InteriorSpread } from "./cover/InteriorSpread";
import { CoverFieldInput } from "./cover/CoverFieldInput";
import { SubStepIndicator, type CoverSubStep } from "./cover/SubStepIndicator";
import { COVER_LINE_MAX, COVER_NAME_MAX, DEFAULT_COVER_LINE } from "@/lib/cover/layout";

interface PrintDetailsStepProps {
  groupId: string;
  name: string;
  coverLine: string;
  imageUrl: string | null;
  // Reason: couple occasions keep "the couple" copy; everything else stays neutral.
  isCoupleOccasion: boolean;
  onNameChange: (name: string) => void;
  onCoverLineChange: (line: string) => void;
  onImageChange: (url: string | null) => void;
  onContinue: () => void;
}

// Reason: Step 1 of the book-review flow is a two-screen micro-flow — "Cover"
// then "Inside" — mirroring the physical book (outside, then open it). Print
// details (name + cover line) are saved on BOTH "Next" and the final continue so
// edits propagate everywhere (dashboard cover, etc.) as soon as you move on.
export function PrintDetailsStep({
  groupId,
  name,
  coverLine,
  imageUrl,
  isCoupleOccasion,
  onNameChange,
  onCoverLineChange,
  onImageChange,
  onContinue,
}: PrintDetailsStepProps) {
  const [subStep, setSubStep] = useState<CoverSubStep>("cover");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/v1/groups/${groupId}/couple-image`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onImageChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/couple-image`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to remove image");
      }
      onImageChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  // Reason: persist name + cover line. Called on "Next" and the final continue so
  // the printed cover stays in sync everywhere the moment the user moves forward.
  const savePrintDetails = async (): Promise<boolean> => {
    if (!name.trim()) return false;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/print-details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          print_couple_name: name.trim(),
          print_cover_line: coverLine.trim() || DEFAULT_COVER_LINE,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (await savePrintDetails()) setSubStep("inside");
  };

  const handleContinue = async () => {
    if (await savePrintDetails()) onContinue();
  };

  return (
    <div className="w-full">
      {/* Intro — left-aligned to the page gutter, matching the Recipes step, and
          sitting directly under the main step bar, above the sub-step indicator. */}
      <p className="type-body-small mb-6 max-w-4xl text-pretty">
        {subStep === "cover"
          ? "This is your real cover. Edit it and watch it change."
          : "Add a photo for the first page inside the book. Optional — it never goes on the cover."}
      </p>

      <div className="mb-10 flex justify-center sm:mb-12">
        <SubStepIndicator current={subStep} onSelect={setSubStep} />
      </div>

      {subStep === "cover" ? (
        /* ── Screen 1: the cover ── */
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-x-12 gap-y-8 sm:grid-cols-[1fr_320px] sm:items-center">
            <div className="flex w-full max-w-lg flex-col gap-7">
              <CoverFieldInput
                label="The line above"
                value={coverLine}
                max={COVER_LINE_MAX}
                placeholder={DEFAULT_COVER_LINE}
                uppercase
                onChange={onCoverLineChange}
              />
              <CoverFieldInput
                label="The name"
                value={name}
                max={COVER_NAME_MAX}
                placeholder={isCoupleOccasion ? "Rocío & Víctor" : "Richi"}
                tip={isCoupleOccasion ? <>Tip: use &ldquo;&amp;&rdquo;. It looks best in print.</> : null}
                onChange={onNameChange}
                autoFocus
              />
            </div>

            <div className="flex justify-center">
              <LiveCoverImage coverLine={coverLine} name={name} width={320} />
            </div>
          </div>

          {error && <p className="mt-6 text-center text-sm text-red-500">{error}</p>}

          <div className="mt-10 flex items-center justify-center gap-5 sm:justify-end">
            <span className="type-caption text-[hsl(var(--brand-warm-gray))]/70">Step 1 of 2</span>
            <button
              type="button"
              onClick={handleNext}
              disabled={!name.trim() || saving}
              className="btn btn-md btn-dark inline-flex items-center gap-2"
            >
              {saving ? "Saving…" : "Next: the first page"}
              {!saving && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : (
        /* ── Screen 2: the first page inside ── */
        <div className="mx-auto max-w-3xl">
          <InteriorSpread
            name={name}
            imageUrl={imageUrl}
            uploading={uploading}
            onUploadClick={() => fileInputRef.current?.click()}
          />

          {imageUrl && (
            <div className="mx-auto mt-4 flex justify-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-sm font-medium text-brand-honey transition-colors hover:text-brand-honey-dark"
              >
                Change photo
              </button>
              <button
                onClick={handleRemoveImage}
                disabled={uploading}
                className="text-sm text-gray-400 transition-colors hover:text-red-400"
              >
                Remove
              </button>
            </div>
          )}

          {error && <p className="mt-6 text-center text-sm text-red-500">{error}</p>}

          <div className="mt-10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSubStep("cover")}
              className="inline-flex items-center gap-2 rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium text-brand-charcoal transition-colors hover:border-brand-charcoal/40 hover:bg-black/[0.03]"
            >
              <ArrowLeft className="h-4 w-4" />
              Cover
            </button>
            <div className="flex items-center gap-5">
              <span className="type-caption text-[hsl(var(--brand-warm-gray))]/70">Step 2 of 2</span>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!name.trim() || saving}
                className="btn btn-md btn-dark"
              >
                {saving ? "Saving…" : "Looks good, continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
