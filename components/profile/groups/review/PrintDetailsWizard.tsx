"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, Upload } from "lucide-react";

interface PrintDetailsWizardProps {
  groupId: string;
  initialName: string;
  initialImageUrl: string | null;
  onConfirmed: (data: { printCoupleName: string; coupleImageUrl: string | null }) => void;
  onBack: () => void;
}

export function PrintDetailsWizard({
  groupId,
  initialName,
  initialImageUrl,
  onConfirmed,
  onBack,
}: PrintDetailsWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [coupleName, setCoupleName] = useState(initialName);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContinueToImage = () => {
    if (!coupleName.trim()) return;
    setStep(2);
  };

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
      setImageUrl(json.url);
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
      setImageUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/print-details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ print_couple_name: coupleName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      onConfirmed({ printCoupleName: coupleName.trim(), coupleImageUrl: imageUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="flex items-center px-4 py-3 flex-shrink-0">
        <button
          onClick={step === 1 ? onBack : () => setStep(1)}
          className="p-2 rounded-full hover:bg-white/60 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-[#2D2D2D]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {step === 1 ? (
            <div className="flex flex-col items-center">
              <h1 className="text-2xl md:text-3xl font-serif text-[#2D2D2D] text-center mb-3 leading-snug">
                Confirm how the names will appear in the book.
              </h1>
              <p className="text-sm text-gray-500 text-center mb-8">
                This is exactly how it will be printed. Double-check spelling.
                <br />
                <span className="text-gray-400">Tip: use "&" — it looks best in print.</span>
              </p>

              <input
                type="text"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                className="w-full text-center text-2xl font-serif text-[#2D2D2D] bg-white border border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:border-[#D4A854] focus:ring-1 focus:ring-[#D4A854]/30 transition-colors"
                placeholder="e.g. Rocío & Víctor"
                autoFocus
              />

              {error && (
                <p className="text-sm text-red-500 mt-3">{error}</p>
              )}

              <button
                onClick={handleContinueToImage}
                disabled={!coupleName.trim()}
                className="mt-8 w-full bg-[#2D2D2D] text-white rounded-full py-4 text-base font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Looks good, continue
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h1 className="text-2xl md:text-3xl font-serif text-[#2D2D2D] text-center mb-3 leading-snug">
                Confirm the photo of the couple
              </h1>
              <p className="text-sm text-gray-500 text-center mb-8">
                This goes on the book. Optional, but it makes it real.
              </p>

              {imageUrl ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                    <Image
                      src={imageUrl}
                      alt="Couple photo"
                      fill
                      className="object-cover"
                      sizes="192px"
                    />
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-sm text-[#D4A854] hover:text-[#c49a4a] font-medium transition-colors"
                    >
                      Change photo
                    </button>
                    <button
                      onClick={handleRemoveImage}
                      disabled={uploading}
                      className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-48 h-48 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#D4A854] flex flex-col items-center justify-center gap-2 transition-colors bg-white/50"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D4A854]" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-sm text-gray-500">Upload a photo</span>
                    </>
                  )}
                </button>
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

              {error && (
                <p className="text-sm text-red-500 mt-3">{error}</p>
              )}

              <button
                onClick={handleFinish}
                disabled={saving}
                className="mt-8 w-full bg-[#2D2D2D] text-white rounded-full py-4 text-base font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                {saving ? "Saving..." : "Continue"}
              </button>

              {!imageUrl && (
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Skip for now
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
