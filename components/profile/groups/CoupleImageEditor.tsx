"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Upload, X, Image as ImageIcon, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { compressImageForUpload } from "@/lib/image";

interface CoupleImageEditorProps {
  groupId: string;
  imageUrl: string | null;
  positionX?: number;
  positionY?: number;
  // Reason: called after a successful upload/delete/reposition so the parent can
  // reload the group — this is what refreshes the dashboard header and rebuilds
  // the share URL with a fresh OG version.
  onChange?: () => void;
  // Reason: let the parent decide where to surface the error (e.g. ShareCollectionModal
  // anchors it at the top of its scroll area). If omitted, we render an inline error.
  onError?: (message: string | null) => void;
  className?: string;
  // Reason: in Edit Cookbook the photo is secondary, so a full-bleed square is
  // overwhelming. Compact renders a small thumbnail + side buttons instead.
  compact?: boolean;
  // Reason: occasion-aware empty-state label. Weddings say "of the couple",
  // birthdays "of the birthday person", non-couple occasions just "Add a photo".
  // Defaults to the couple wording so existing call sites are unchanged.
  uploadLabel?: string;
}

/**
 * Couple photo editor — upload, reposition (focal point) and delete the image
 * that drives the dashboard header AND every shared preview (WhatsApp OG + email).
 * Extracted from ShareCollectionModal so it can be reused in Edit Profile.
 */
export function CoupleImageEditor({
  groupId,
  imageUrl,
  positionX = 50,
  positionY = 50,
  onChange,
  onError,
  className,
  compact = false,
  uploadLabel = "Add a photo of the couple",
}: CoupleImageEditorProps) {
  const [coupleImage, setCoupleImage] = useState<string | null>(imageUrl);
  const [coupleImagePositionY, setCoupleImagePositionY] = useState(positionY ?? 50);
  const [coupleImagePositionX, setCoupleImagePositionX] = useState(positionX ?? 50);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  // Focal point picker state
  const [isRepositioningCoupleImage, setIsRepositioningCoupleImage] = useState(false);
  const [tempCouplePositionX, setTempCouplePositionX] = useState(50);
  const [tempCouplePositionY, setTempCouplePositionY] = useState(50);
  const [isSavingCouplePosition, setIsSavingCouplePosition] = useState(false);
  const coupleRepositionRef = useRef<HTMLDivElement>(null);
  const isFocalDraggingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reason: route errors to the parent when it wants to own the display,
  // otherwise keep them inline.
  const reportError = (message: string | null) => {
    if (onError) onError(message);
    else setInternalError(message);
  };

  // Sync internal state when the parent passes a fresh image/position (e.g. after
  // a reload). Keyed on the actual values so we don't clobber an in-progress edit.
  useEffect(() => {
    setCoupleImage(imageUrl);
    setCoupleImagePositionY(positionY ?? 50);
    setCoupleImagePositionX(positionX ?? 50);
  }, [imageUrl, positionX, positionY]);

  // Reason: we compress every image client-side via Canvas before upload, so we
  // can accept a broad range of inputs (5-8MB iPhone PNGs, HEIC where the browser
  // can decode it). Validation here is just a sanity check; the canvas pipeline
  // normalizes everything to a 2000px-max JPEG under the server's limit.
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImageByType = file.type.startsWith('image/');
    const isImageByExt = /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(file.name);
    if (!isImageByType && !isImageByExt) {
      reportError("That doesn't look like an image. Try a JPEG or PNG.");
      setTimeout(() => reportError(null), 6000);
      event.target.value = '';
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      reportError('That image is too big (max 30MB). Try a smaller one.');
      setTimeout(() => reportError(null), 6000);
      event.target.value = '';
      return;
    }

    reportError(null);

    try {
      const compressed = await compressImageForUpload(file);
      setSelectedFile(compressed);
      handleUploadImage(compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
      reportError("Couldn't read that image. iPhone HEIC photos aren't supported on all browsers — try saving it as a JPEG first, or use a different image.");
      setTimeout(() => reportError(null), 8000);
      event.target.value = '';
    }
  };

  const handleImageClick = () => {
    const input = fileInputRef.current;
    if (input) {
      // Reset value before clicking so onChange always fires (even re-selecting the same file)
      input.value = '';
      input.click();
    }
  };

  const handleUploadImage = async (file?: File) => {
    const fileToUpload = file || selectedFile;
    if (!fileToUpload || !groupId) {
      reportError('No file selected or group not found');
      return;
    }

    setIsUploadingImage(true);
    reportError(null);

    try {
      const formData = new FormData();
      formData.append('image', fileToUpload);

      const response = await fetch(`/api/v1/groups/${groupId}/couple-image`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        reportError(result.error || 'Failed to upload image');
        return;
      }

      setCoupleImage(result.url);
      setCoupleImagePositionY(50);
      setCoupleImagePositionX(50);
      setSelectedFile(null);

      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reason: tell parent to refresh so collectionUrl gets rebuilt with the
      // fresh &v=<og_ts> from the just-generated OG.
      onChange?.();
    } catch (err) {
      reportError('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!groupId) {
      reportError('Group not found');
      return;
    }

    setIsUploadingImage(true);
    reportError(null);

    try {
      const response = await fetch(`/api/v1/groups/${groupId}/couple-image`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        reportError(result.error || 'Failed to delete image');
        return;
      }

      setCoupleImage(null);
      setCoupleImagePositionY(50);
      setCoupleImagePositionX(50);
      setSelectedFile(null);

      if (fileInputRef.current) fileInputRef.current.value = '';

      onChange?.();
    } catch (err) {
      reportError('Failed to delete image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Focal point picker handlers
  const handleStartCoupleReposition = () => {
    setTempCouplePositionX(coupleImagePositionX);
    setTempCouplePositionY(coupleImagePositionY);
    setIsRepositioningCoupleImage(true);
  };

  const updateFocalPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const container = coupleRepositionRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setTempCouplePositionX(Math.max(0, Math.min(100, x)));
    setTempCouplePositionY(Math.max(0, Math.min(100, y)));
  };

  const handleFocalMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isFocalDraggingRef.current = true;
    updateFocalPoint(e);
  };

  const handleFocalMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isFocalDraggingRef.current) return;
    updateFocalPoint(e);
  };

  const handleFocalMouseUp = () => {
    isFocalDraggingRef.current = false;
  };

  const handleSaveCoupleReposition = async () => {
    if (!groupId) return;
    setIsSavingCouplePosition(true);
    try {
      const response = await fetch(`/api/v1/groups/${groupId}/couple-image`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position_y: Math.round(tempCouplePositionY),
          position_x: Math.round(tempCouplePositionX),
        }),
      });
      if (response.ok) {
        setCoupleImagePositionY(Math.round(tempCouplePositionY));
        setCoupleImagePositionX(Math.round(tempCouplePositionX));
        setIsRepositioningCoupleImage(false);
        // Reason: PATCH regenerated the OG (new &v=<ts>); refresh parent so
        // the next "Copy Link" produces a URL WhatsApp will treat as fresh.
        onChange?.();
      } else {
        const result = await response.json();
        reportError(result.error || 'Failed to save position');
      }
    } catch {
      reportError('Failed to save position');
    } finally {
      setIsSavingCouplePosition(false);
    }
  };

  const handleCancelCoupleReposition = () => {
    setIsRepositioningCoupleImage(false);
  };

  // Reason: the Remove / Reposition / Change actions are identical across the
  // full-bleed and compact layouts — define once, lay out differently below.
  const actionButtons = (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDeleteImage();
        }}
        disabled={isUploadingImage}
        className="min-h-[44px] rounded-lg text-sm text-red-600 border-red-200 hover:bg-red-50"
      >
        <X className="w-4 h-4 mr-1" />
        Remove
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleStartCoupleReposition();
        }}
        disabled={isUploadingImage}
        className="min-h-[44px] rounded-lg text-sm"
      >
        <Move className="w-4 h-4 mr-1" />
        Reposition
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleImageClick();
        }}
        disabled={isUploadingImage}
        className="min-h-[44px] rounded-lg text-sm"
      >
        <Upload className="w-4 h-4 mr-1" />
        Change
      </Button>
    </>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current Image Display */}
      {coupleImage ? (
        <div className="space-y-3">
          {isRepositioningCoupleImage ? (
            /* Focal point picker — full uncropped image */
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Tap on the most important part of your photo.</p>
              <div
                ref={coupleRepositionRef}
                className="relative rounded-xl overflow-hidden cursor-crosshair select-none w-fit mx-auto"
                onMouseDown={handleFocalMouseDown}
                onMouseMove={handleFocalMouseMove}
                onMouseUp={handleFocalMouseUp}
                onMouseLeave={handleFocalMouseUp}
                onTouchStart={handleFocalMouseDown}
                onTouchMove={handleFocalMouseMove}
                onTouchEnd={handleFocalMouseUp}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coupleImage}
                  alt="Couple"
                  className="max-w-full max-h-96 block select-none pointer-events-none"
                  draggable={false}
                />
                {/* Vignette centered on focal point */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(circle 70px at ${tempCouplePositionX}% ${tempCouplePositionY}%, transparent 0%, transparent 50%, rgba(0,0,0,0.55) 100%)` }}
                />
                {/* Crosshair at focal point */}
                <div
                  className="absolute pointer-events-none select-none"
                  style={{ left: `${tempCouplePositionX}%`, top: `${tempCouplePositionY}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="opacity-70">
                    <line x1="20" y1="4" x2="20" y2="36" stroke="white" strokeWidth="1.5" />
                    <line x1="4" y1="20" x2="36" y2="20" stroke="white" strokeWidth="1.5" />
                    <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="1.5" fill="none" />
                  </svg>
                </div>
              </div>
              {/* Controls outside the image */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCancelCoupleReposition}
                  className="min-h-[44px] rounded-lg text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveCoupleReposition}
                  disabled={isSavingCouplePosition}
                  className="min-h-[44px] rounded-lg text-sm bg-brand-charcoal text-white hover:bg-gray-800"
                >
                  {isSavingCouplePosition ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : compact ? (
            /* Compact: small thumbnail + stacked actions (photo is secondary here) */
            <div className="flex items-center gap-4">
              <div className="relative bg-gray-100 rounded-xl overflow-hidden w-24 h-24 flex-shrink-0">
                <Image
                  key={coupleImage}
                  src={coupleImage}
                  alt="Couple"
                  fill
                  className="object-cover select-none"
                  draggable={false}
                  style={{ objectPosition: `${coupleImagePositionX}% ${coupleImagePositionY}%` }}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 [&_button]:w-full [&_button]:justify-start">
                {actionButtons}
              </div>
            </div>
          ) : (
            /* Full-bleed cropped preview + actions below */
            <>
              <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-square w-full">
                <Image
                  key={coupleImage}
                  src={coupleImage}
                  alt="Couple"
                  fill
                  className="object-cover select-none"
                  draggable={false}
                  style={{ objectPosition: `${coupleImagePositionX}% ${coupleImagePositionY}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2 sm:justify-end">
                {actionButtons}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Upload UI when no image */
        <div className="space-y-3">
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 lg:p-8 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleImageClick();
            }}
          >
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-1 font-medium">
              {uploadLabel}
            </p>
            <p className="text-secondary-sm text-gray-500">
              Click to upload (JPEG, PNG, WebP • max 5MB)
            </p>
          </div>
        </div>
      )}

      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Status */}
      {isUploadingImage && (
        <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            Uploading...
          </div>
        </div>
      )}

      {/* Inline error (only when the parent isn't handling errors) */}
      {!onError && internalError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{internalError}</p>
        </div>
      )}
    </div>
  );
}
