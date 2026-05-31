"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";

interface PrintDetailsStepProps {
  groupId: string;
  name: string;
  imageUrl: string | null;
  onNameChange: (name: string) => void;
  onImageChange: (url: string | null) => void;
  onContinue: () => void;
}

// Reason: Step 1 of the book-review flow. Merges the old two-screen wizard (name,
// then photo) into a single screen. Name + photo are confirmed together, then we
// PATCH print-details and advance. All three API calls are unchanged from the
// retired PrintDetailsWizard.
export function PrintDetailsStep({
  groupId,
  name,
  imageUrl,
  onNameChange,
  onImageChange,
  onContinue,
}: PrintDetailsStepProps) {
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
      const res = await fetch(`/api/v1/groups/${groupId}/couple-image`, {
        method: "DELETE",
      });
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
        body: JSON.stringify({ print_couple_name: name.trim() }),
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
      {/* Short intro — the big step title lives in the container H1 above. */}
      <p className="type-body mb-10 max-w-4xl">
        This is how the couple shows up in the book. Double-check the spelling. The
        photo is optional, but it makes it real.
      </p>

      <div className="grid max-w-4xl gap-x-16 gap-y-10 sm:grid-cols-2 sm:items-start">
        {/* Names */}
        <div className="flex flex-col">
          <p className="type-eyebrow mb-3">The names</p>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-center font-serif text-2xl text-brand-charcoal transition-colors focus:border-brand-honey focus:outline-none focus:ring-1 focus:ring-brand-honey/30"
            placeholder="e.g. Rocío & Víctor"
            autoFocus
          />
          <p className="mt-3 text-sm text-[hsl(var(--brand-warm-gray))]/80">
            Tip: use &ldquo;&amp;&rdquo;. It looks best in print.
          </p>
        </div>

        {/* Photo */}
        <div className="flex flex-col">
          <p className="type-eyebrow mb-3">Photo of the couple</p>
          {imageUrl ? (
            <div className="flex flex-col items-start">
              <div className="relative aspect-square w-full max-w-[240px] overflow-hidden rounded-2xl border-4 border-white shadow-lg">
                <Image
                  src={imageUrl}
                  alt="Couple photo"
                  fill
                  className="object-cover"
                  sizes="240px"
                />
              </div>
              <div className="mt-4 flex gap-4">
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
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square w-full max-w-[240px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 transition-colors hover:border-brand-honey"
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
        className="btn btn-md btn-dark mt-10 ml-auto block w-full max-w-xs"
      >
        {saving ? "Saving…" : "Looks good, continue"}
      </button>
    </div>
  );
}
