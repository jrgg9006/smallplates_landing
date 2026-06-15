"use client";

import React, { useState, useRef } from "react";
import { LiveCover } from "./cover/LiveCover";
import { InteriorSpread } from "./cover/InteriorSpread";
import { CoverFieldInput } from "./cover/CoverFieldInput";
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

// Reason: Step 1 of the book-review flow, redesigned into a WYSIWYG cover editor.
// Left = editable fields; right = the real cover rendered live (sticky). Below,
// clearly separated, the interior spread showing the photo lands INSIDE the book.
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
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<"eyebrow" | "name" | null>(null);
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

  const handleContinue = async () => {
    if (!name.trim()) return;
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
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <p className="type-body-small mb-8 max-w-2xl text-pretty">
        This is your real cover. Edit it and watch it change.
      </p>

      {/* HERO: fields (left) + live cover (right, sticky on desktop) */}
      <div className="grid gap-x-12 gap-y-8 sm:grid-cols-[1fr_360px] sm:items-start">
        <div className="flex flex-col gap-7">
          <CoverFieldInput
            label="The line above"
            value={coverLine}
            max={COVER_LINE_MAX}
            placeholder={DEFAULT_COVER_LINE}
            uppercase
            onChange={onCoverLineChange}
            onFocus={() => setFocused("eyebrow")}
            onBlur={() => setFocused(null)}
          />
          <CoverFieldInput
            label="The name"
            value={name}
            max={COVER_NAME_MAX}
            placeholder={isCoupleOccasion ? "Rocío & Víctor" : "Richi"}
            tip={
              isCoupleOccasion ? (
                <>Tip: use &ldquo;&amp;&rdquo;. It looks best in print.</>
              ) : null
            }
            onChange={onNameChange}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
            autoFocus
          />
        </div>

        <div className="flex justify-center sm:sticky sm:top-6">
          <LiveCover coverLine={coverLine} name={name} focusedField={focused} width={360} />
        </div>
      </div>

      {/* Divider */}
      <div className="my-12 border-t border-black/10" />

      {/* INTERIOR PHOTO */}
      <div className="flex flex-col">
        <p className="type-eyebrow mb-2">A photo for inside the book</p>
        <p className="type-body-small mb-6 max-w-xl text-pretty">
          This photo goes inside the book — on the first page, not the cover.
        </p>

        <InteriorSpread
          name={name}
          imageUrl={imageUrl}
          uploading={uploading}
          onUploadClick={() => fileInputRef.current?.click()}
        />

        {imageUrl && (
          <div className="mx-auto mt-4 flex gap-4">
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
      </div>

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

      {error && <p className="mt-6 text-center text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleContinue}
        disabled={!name.trim() || saving}
        className="btn btn-md btn-dark mt-10 mx-auto sm:ml-auto sm:mr-0 block w-full max-w-xs"
      >
        {saving ? "Saving…" : "Looks good, continue"}
      </button>
    </div>
  );
}
