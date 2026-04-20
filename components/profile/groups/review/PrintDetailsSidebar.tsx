"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Pencil, Upload, X } from "lucide-react";

interface PrintDetailsSidebarProps {
  groupId: string;
  printCoupleName: string;
  coupleImageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: { printCoupleName?: string; coupleImageUrl?: string | null }) => void;
}

export function PrintDetailsSidebar({
  groupId,
  printCoupleName,
  coupleImageUrl,
  isOpen,
  onClose,
  onUpdate,
}: PrintDetailsSidebarProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(printCoupleName);
  const [savingName, setSavingName] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === printCoupleName) {
      setEditingName(false);
      setNameValue(printCoupleName);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/print-details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ print_couple_name: nameValue.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onUpdate({ printCoupleName: nameValue.trim() });
      setEditingName(false);
    } catch {
      setNameValue(printCoupleName);
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/v1/groups/${groupId}/couple-image`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onUpdate({ coupleImageUrl: json.url });
    } catch {
      // Reason: Silent fail — user can retry by clicking again
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/couple-image`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove");
      onUpdate({ coupleImageUrl: null });
    } catch {
      // Reason: Silent fail — non-critical action
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[300px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="py-6 px-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-serif">
              Book details
            </p>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close panel"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

        {/* Couple name — prominent */}
        <div className="mb-6">
          {editingName ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="w-full text-lg font-serif text-brand-charcoal bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4A854]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") { setEditingName(false); setNameValue(printCoupleName); }
                }}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setEditingName(false); setNameValue(printCoupleName); }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveName}
                  disabled={savingName || !nameValue.trim()}
                  className="text-xs text-[#D4A854] hover:text-[#c49a4a] font-medium transition-colors"
                >
                  {savingName ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="group">
              <p className="text-xl font-serif text-brand-charcoal leading-snug">
                {printCoupleName}
              </p>
              <button
                onClick={() => setEditingName(true)}
                className="mt-1 text-xs text-gray-300 group-hover:text-[#D4A854] transition-colors flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" /> Edit name
              </button>
            </div>
          )}
        </div>

        {/* Couple image */}
        <div className="flex flex-col items-center">
          {coupleImageUrl ? (
            <>
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-gray-100">
                <Image
                  src={coupleImageUrl}
                  alt="Couple photo"
                  fill
                  className="object-cover"
                  sizes="260px"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="text-xs text-[#D4A854] hover:text-[#c49a4a] transition-colors"
                >
                  Change
                </button>
                <button
                  onClick={handleRemoveImage}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-[#D4A854] flex flex-col items-center justify-center gap-1 transition-colors"
            >
              {uploadingImage ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#D4A854]" />
              ) : (
                <>
                  <Upload className="h-4 w-4 text-gray-400" />
                  <span className="text-[10px] text-gray-400">Add photo</span>
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
        </div>
      </div>
      </div>
    </>
  );
}
