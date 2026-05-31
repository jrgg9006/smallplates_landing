"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Upload, X, Image as ImageIcon, Move, MessageCircle, Mail, QrCode, ArrowLeft, Download } from "lucide-react";
import { getGroupShareMessage, updateGroupShareMessage, resetGroupShareMessage } from "@/lib/supabase/groups";
import { isIOSDevice } from "@/lib/utils/sharing";
import Image from "next/image";
import QRCode from "qrcode";

// Reason: iPhone screenshots and modern photos routinely exceed 5MB as PNG. We
// downscale and re-encode to JPEG in the browser before upload so the server
// never has to deal with raw 5-10MB files. Uses native Canvas API — no deps.
// Also normalizes the output type (always image/jpeg) which simplifies server
// validation. HEIC works only on browsers that can natively decode it (Safari).
async function compressImageForUpload(file: File): Promise<File> {
  const MAX_DIMENSION = 2000;
  const QUALITY = 0.85;

  const objectUrl = URL.createObjectURL(file);
  const img = new window.Image();

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not decode image'));
      img.src = objectUrl;
    });

    let { width, height } = img;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width > height) {
        height = Math.round((height / width) * MAX_DIMENSION);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width / height) * MAX_DIMENSION);
        height = MAX_DIMENSION;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', QUALITY);
    });

    if (!blob) throw new Error('Could not encode image');

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

interface ShareCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionUrl: string;
  userName: string | null;
  isOnboardingStep?: boolean;
  onStepComplete?: () => void;
  groupId?: string | null;
  coupleNames?: string | null;
  currentCoupleImage?: string | null;
  currentCoupleImagePositionY?: number;
  currentCoupleImagePositionX?: number;
  // Reason: signal back to parent that the user copied the link, used by the
  // SetupChecklist to mark the "Share in WhatsApp" step as done.
  onLinkCopied?: () => void;
  // Reason: signal back to parent whenever the couple image (or its position)
  // changes inside the modal. Parent re-loads selectedGroup so collectionUrl
  // is rebuilt with a fresh &v=<og_ts>, which is what makes WhatsApp re-crawl
  // the link instead of serving a stale cached preview.
  onImageChange?: () => void;
  // Reason: when opened from the Setup wizard, start in the expanded customization
  // state (photo + message editor visible) instead of the default collapsed state.
  openExpanded?: boolean;
}

export function ShareCollectionModal({ 
  isOpen, 
  onClose, 
  collectionUrl,
  userName,
  isOnboardingStep = false,
  onStepComplete,
  groupId = null,
  coupleNames = null,
  currentCoupleImage = null,
  currentCoupleImagePositionY = 50,
  currentCoupleImagePositionX = 50,
  onLinkCopied,
  onImageChange,
  openExpanded = false,
}: ShareCollectionModalProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showMessageCustomization, setShowMessageCustomization] = useState(false);

  // Reason: quick-share row sub-views (Email shows rich-HTML copy pane, QR shows QR + download).
  // Default keeps the existing modal layout untouched.
  const [shareView, setShareView] = useState<"default" | "email" | "qr">("default");
  const [emailCopied, setEmailCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  
  // Image upload state
  const [coupleImage, setCoupleImage] = useState<string | null>(currentCoupleImage);
  const [coupleImagePositionY, setCoupleImagePositionY] = useState(currentCoupleImagePositionY ?? 50);
  const [coupleImagePositionX, setCoupleImagePositionX] = useState(currentCoupleImagePositionX ?? 50);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Focal point picker state
  const [isRepositioningCoupleImage, setIsRepositioningCoupleImage] = useState(false);
  const [tempCouplePositionX, setTempCouplePositionX] = useState(50);
  const [tempCouplePositionY, setTempCouplePositionY] = useState(50);
  const [isSavingCouplePosition, setIsSavingCouplePosition] = useState(false);
  const coupleRepositionRef = useRef<HTMLDivElement>(null);
  const isFocalDraggingRef = useRef(false);

  // Load custom message when modal opens
  useEffect(() => {
    if (isOpen && !isEditingMessage) {
      loadCustomMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, groupId]);

  // Reason: when the Setup wizard opens this modal, jump straight to the expanded
  // customization view (photo + message editor visible) instead of the collapsed
  // default. Reset when the modal closes so a normal re-open is collapsed again.
  useEffect(() => {
    if (isOpen && openExpanded) {
      setShowMessageCustomization(true);
    }
    if (!isOpen) {
      setShowMessageCustomization(false);
    }
  }, [isOpen, openExpanded]);

  // Sync couple image state when modal opens or currentCoupleImage changes
  useEffect(() => {
    setCoupleImage(currentCoupleImage);
    setCoupleImagePositionY(currentCoupleImagePositionY ?? 50);
    setCoupleImagePositionX(currentCoupleImagePositionX ?? 50);
  }, [currentCoupleImage, currentCoupleImagePositionY, currentCoupleImagePositionX, isOpen]);

  // Load custom message from group_members only (no profile fallback)
  const loadCustomMessage = async () => {
    try {
      // If no groupId, we can't load custom message - use default
      if (!groupId) {
        setCustomMessage(null);
        return;
      }

      // Always try to load custom message from group_members when groupId exists
      const { data: groupData, error: groupError } = await getGroupShareMessage(groupId);
      
      if (!groupError && groupData?.custom_share_message) {
        setCustomMessage(groupData.custom_share_message);
      } else {
        // No custom message found or error occurred - use default
        setCustomMessage(null);
      }
    } catch (err) {
      console.error('Error loading custom message:', err);
      setCustomMessage(null);
    }
  };

  // Default message using brand voice
  const coupleDisplayName = coupleNames || 'your friends';
  const defaultMessage = `You're adding a recipe to ${coupleDisplayName}'s wedding cookbook. Doesn't have to be fancy—just something you actually make.`;
  
  const shareMessage = customMessage || defaultMessage;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(collectionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onLinkCopied?.();
    } catch (err) {
      setError("Failed to copy link");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `${shareMessage}\n\n${collectionUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    // Reason: signal the Setup checklist that the user shared, same as Copy does.
    onLinkCopied?.();
  };

  // Reason: HTML block users paste into Gmail/Outlook/Apple Mail. Inline styles
  // are required because email clients strip <style> tags and external CSS.
  // The image uses the pre-processed OG url when available (1200x630, <300KB)
  // so it renders fast in Gmail and survives WhatsApp/Outlook image proxies.
  // Reason: kept intentionally minimal — photo, names, single underlined link.
  // Matches the preview card the user sees in the Email sub-view. Inline styles
  // are required because email clients (Gmail/Outlook/Apple Mail) strip <style>
  // tags and external CSS.
  const buildEmailHtml = (): string => {
    const photoUrl = currentCoupleImage || "";
    const couple = coupleNames || "the couple";

    const imgBlock = photoUrl
      ? `<img src="${photoUrl}" width="320" alt="${couple}" style="display:block;width:320px;max-width:100%;height:320px;object-fit:cover;border-radius:12px;margin:0 auto 24px;" />`
      : "";

    // Reason: emulate Paperless Post's pattern — plain centered text + simple
    // underlined link. Email clients (Gmail compose, Outlook web, Apple Mail)
    // can strip buttons/backgrounds/border-radius, but they always respect:
    // basic <p>/<a>, font-family, font-size, color, text-align:center, and
    // letter-spacing. Caps are written into the source so they survive even
    // if text-transform gets stripped.
    return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#2D2D2D;line-height:1.6;text-align:center;">
  <p style="font-size:18px;color:#2D2D2D;margin:0 0 4px;">Share a recipe with</p>
  <p style="font-size:22px;line-height:1.2;margin:0 0 24px;color:#2D2D2D;"><b>${couple}</b></p>
  ${imgBlock}
  <p style="font-size:16px;color:#2D2D2D;margin:0 0 20px;line-height:1.5;">We're gifting them a hardcover cookbook. We want to include your recipe.</p>
  <p style="margin:0;">
    <a href="${collectionUrl}" style="color:#2D2D2D;font-size:16px;text-decoration:underline;"><b>Add your recipe</b></a>
  </p>
</div>
    `.trim();
  };

  const buildEmailPlainText = (): string => {
    const couple = coupleNames || "your friends";
    return `${couple} wants you to share a recipe for their wedding cookbook.\n\n${shareMessage}\n\nAdd your recipe: ${collectionUrl}`;
  };

  const handleCopyEmailBlock = async () => {
    const html = buildEmailHtml();
    const plain = buildEmailPlainText();

    try {
      // Reason: ClipboardItem with text/html lets Gmail/Outlook/Apple Mail
      // render the image + button as a real styled block when pasted. Plain
      // text is the fallback for editors that don't render HTML.
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        const item = new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        });
        await navigator.clipboard.write([item]);
      } else {
        // Older browsers / iOS Safari without ClipboardItem — copy plain only
        await navigator.clipboard.writeText(plain);
        if (isIOSDevice()) {
          setError("Copied as text — for the styled block with photo, try this on desktop.");
          setTimeout(() => setError(null), 6000);
        }
      }
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2500);
      onLinkCopied?.();
    } catch (err) {
      // Reason: some browsers throw if HTML clipboard is blocked. Fall back
      // to plain text without surfacing a hard error.
      try {
        await navigator.clipboard.writeText(plain);
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2500);
        if (isIOSDevice()) {
          setError("Copied as text — for the styled block with photo, try this on desktop.");
          setTimeout(() => setError(null), 6000);
        }
      } catch {
        setError("Couldn't copy. Try selecting the preview manually.");
        setTimeout(() => setError(null), 4000);
      }
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "small-plates-recipe-qr.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Reason: regenerate the QR whenever the user opens the QR view OR the
  // collectionUrl bumps (e.g., after a couple-photo change updates &v=).
  useEffect(() => {
    if (shareView !== "qr") return;
    let cancelled = false;
    QRCode.toDataURL(collectionUrl, {
      width: 600,
      margin: 2,
      color: { dark: "#2D2D2D", light: "#FFFFFF" },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    }).catch(() => {
      if (!cancelled) {
        setError("Couldn't generate the QR code. Try closing and reopening this.");
        setTimeout(() => setError(null), 4000);
      }
    });
    return () => { cancelled = true; };
  }, [shareView, collectionUrl]);

  // Reason: reset to default share view when modal closes, so the next open
  // doesn't land mid-sub-view.
  useEffect(() => {
    if (!isOpen) {
      setShareView("default");
      setEmailCopied(false);
    }
  }, [isOpen]);


  const handleShowMessageCustomization = () => {
    setShowMessageCustomization(true);
    // Automatically start editing when customization is shown
    setEditingMessage(shareMessage);
    setIsEditingMessage(true);
    setError(null);
    
    // If this is an onboarding step, complete it when user clicks customize
    if (isOnboardingStep && onStepComplete) {
      onStepComplete();
    }
  };


  const handleSaveMessage = async () => {
    if (editingMessage.trim().length === 0) {
      setError('Message cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const signature = userName || '';
      
      // Only save to group_members (requires groupId)
      if (!groupId) {
        setError('Something went wrong. Try closing and reopening this.');
        setIsSaving(false);
        return;
      }
      
      const result = await updateGroupShareMessage(groupId, editingMessage.trim(), signature);
      
      if (result.error) {
        setError(result.error);
      } else {
        setCustomMessage(editingMessage.trim());
        setIsEditingMessage(false);
        setShowMessageCustomization(false);
      }
    } catch (err) {
      setError('Failed to save message');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingMessage(false);
    setEditingMessage('');
    setShowMessageCustomization(false);
    setError(null);
  };

  const handleResetMessage = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Only reset from group_members (requires groupId)
      if (!groupId) {
        setError('Something went wrong. Try closing and reopening this.');
        setIsSaving(false);
        return;
      }
      
      const result = await resetGroupShareMessage(groupId);
      
      if (result.error) {
        setError(result.error);
      } else {
        setCustomMessage(null);
        setIsEditingMessage(false);
        setEditingMessage('');
        setShowMessageCustomization(false);
      }
    } catch (err) {
      setError('Failed to reset message');
    } finally {
      setIsSaving(false);
    }
  };

  // Image upload functions
  // Reason: we now compress every image client-side via Canvas before upload,
  // so we can accept a much broader range of inputs (modern iPhone PNGs that
  // are 5-8MB, HEIC where the browser can decode it, etc.). Validation here
  // is just a sanity check; the canvas pipeline normalizes everything to a
  // 2000px-max JPEG that comfortably fits the server's limit.
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Permissive image check: trust MIME, fall back to extension for iOS
    // quirks where file.type sometimes comes back empty.
    const isImageByType = file.type.startsWith('image/');
    const isImageByExt = /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(file.name);
    if (!isImageByType && !isImageByExt) {
      setError("That doesn't look like an image. Try a JPEG or PNG.");
      setTimeout(() => setError(null), 6000);
      event.target.value = '';
      return;
    }

    // Hard cap on raw input so the browser doesn't choke on huge files.
    if (file.size > 30 * 1024 * 1024) {
      setError('That image is too big (max 30MB). Try a smaller one.');
      setTimeout(() => setError(null), 6000);
      event.target.value = '';
      return;
    }

    setError(null);

    try {
      const compressed = await compressImageForUpload(file);
      setSelectedFile(compressed);
      handleUploadImage(compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
      setError("Couldn't read that image. iPhone HEIC photos aren't supported on all browsers — try saving it as a JPEG first, or use a different image.");
      setTimeout(() => setError(null), 8000);
      event.target.value = '';
    }
  };

  const handleImageClick = () => {
    const input = document.getElementById('coupleImageInput') as HTMLInputElement;
    if (input) {
      // Reset input value before clicking to ensure onChange always fires
      input.value = '';
      // Use click() method directly
      input.click();
    } else {
      console.error('coupleImageInput not found');
    }
  };

  const handleUploadImage = async (file?: File) => {
    const fileToUpload = file || selectedFile;
    if (!fileToUpload || !groupId) {
      setError('No file selected or group not found');
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', fileToUpload);

      const response = await fetch(`/api/v1/groups/${groupId}/couple-image`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to upload image');
        return;
      }

      setCoupleImage(result.url);
      setCoupleImagePositionY(50);
      setCoupleImagePositionX(50);
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById('coupleImageInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reason: tell parent to refresh selectedGroup so collectionUrl
      // gets rebuilt with the fresh &v=<og_ts> from the just-generated OG.
      onImageChange?.();

    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!groupId) {
      setError('Group not found');
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/groups/${groupId}/couple-image`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to delete image');
        return;
      }

      setCoupleImage(null);
      setCoupleImagePositionY(50);
      setCoupleImagePositionX(50);
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById('coupleImageInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reason: parent must refresh so collectionUrl drops the &v= once og_url
      // is null again (and so any other group state stays in sync)
      onImageChange?.();

    } catch (err) {
      setError('Failed to delete image');
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
        onImageChange?.();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to save position');
      }
    } catch {
      setError('Failed to save position');
    } finally {
      setIsSavingCouplePosition(false);
    }
  };

  const handleCancelCoupleReposition = () => {
    setIsRepositioningCoupleImage(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${
        showMessageCustomization ? 'lg:max-w-[820px]' : shareView === "email" ? 'lg:max-w-[760px]' : 'sm:max-w-[620px]'
      } transition-all duration-300 max-h-[90vh] flex flex-col`}>
        <DialogHeader>
          <DialogTitle className="type-modal-title">
            Collect Recipes
          </DialogTitle>
        </DialogHeader>

        {/* Reason: errors used to render at the bottom of the scroll area where
            mobile users couldn't see them — they'd hit "upload", nothing visible
            would change, and the error would fade out of view. Anchoring here
            keeps it visible regardless of scroll position. */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2 mx-0">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="py-4 overflow-y-auto flex-1 -mx-6 px-6">
          {!showMessageCustomization && shareView === "default" ? (
            /* Normal single-column layout */
            <div className="space-y-5 pt-3">
              {/* Hero Message */}
              <div className="text-center">
                <p className="text-gray-600 text-base leading-relaxed">
                  Send this link to everyone you want in your cookbook. They&apos;ll get a simple form to share their recipe.
                </p>
              </div>

              {/* Main Actions */}
              <div className="space-y-3">
                {/* Primary Action - Copy Link */}
                {/* Reason: when the user copies without a couple photo, swap the
                    success text for a nudge to add one. Link still gets copied —
                    the photo is critical for the WhatsApp preview but we don't
                    block, just remind. */}
                {/* URL field + Copy button — Paperless Post style */}
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-4 pr-1 py-1">
                  <input
                    type="text"
                    value={collectionUrl}
                    readOnly
                    onFocus={(e) => e.target.select()}
                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate min-w-0"
                  />
                  <Button
                    onClick={handleCopyLink}
                    className={`flex-shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 ${
                      copied
                        ? 'bg-[hsl(var(--brand-honey))] text-black hover:bg-[hsl(var(--brand-honey))]'
                        : 'bg-brand-charcoal text-brand-warm-white-warm hover:bg-gray-800'
                    }`}
                  >
                    {copied ? (
                      coupleImage ? (
                        <span className="flex items-center gap-1.5"><Check className="w-4 h-4" />Copied</span>
                      ) : (
                        <span className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4" />Add photo!</span>
                      )
                    ) : (
                      'Copy link'
                    )}
                  </Button>
                </div>

                {/* Quick share row — WhatsApp / Email / QR */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex flex-col items-center justify-center gap-2 py-3 hover:opacity-80 transition-opacity"
                  >
                    <MessageCircle className="w-6 h-6 text-[#25D366]" />
                    <span className="text-xs text-gray-700 font-medium">WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareView("email")}
                    className="flex flex-col items-center justify-center gap-2 py-3 hover:opacity-80 transition-opacity"
                  >
                    <Mail className="w-6 h-6 text-gray-700" />
                    <span className="text-xs text-gray-700 font-medium">Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareView("qr")}
                    className="flex flex-col items-center justify-center gap-2 py-3 hover:opacity-80 transition-opacity"
                  >
                    <QrCode className="w-6 h-6 text-gray-700" />
                    <span className="text-xs text-gray-700 font-medium">QR Code</span>
                  </button>
                </div>

                {/* Add photo & message — honey filled to signal importance */}
                <Button
                  onClick={handleShowMessageCustomization}
                  className="h-auto w-full rounded-full py-3.5 text-[15px] font-medium flex items-center justify-center gap-2 bg-[hsl(var(--brand-honey))] text-white hover:bg-[hsl(var(--brand-honey-dark))] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-honey-dark))] focus-visible:ring-offset-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Add photo & message
                </Button>
              </div>

              {/* Preview Link */}
              <div className="text-center">
                <button
                  onClick={() => {
                    if (collectionUrl && typeof window !== 'undefined') {
                      window.open(collectionUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 underline transition-colors"
                >
                  Preview what guests will see
                </button>
              </div>
            </div>
          ) : shareView === "email" ? (
            /* Email sub-view — two columns like Paperless Post.
               Right column has a darker cream background so the white preview
               card visually pops and signals "this white box is what gets copied". */
            <div className="grid grid-cols-1 lg:grid-cols-2 -mx-6 -my-4">
              {/* Left column: instructions + button + back, centered vertically */}
              <div className="flex flex-col justify-center items-center text-center space-y-5 px-6 py-8 lg:px-10 lg:py-12">
                <h3 className="font-serif text-xl text-gray-900 leading-tight">
                  Copy and paste to email
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
                  We&apos;ve bundled your image and message. Click the button below to copy them, then paste in a new email.
                </p>

                <Button
                  onClick={handleCopyEmailBlock}
                  className={`min-h-[44px] px-6 rounded-full text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 ${
                    emailCopied
                      ? 'bg-[hsl(var(--brand-honey))] text-black hover:bg-[hsl(var(--brand-honey))]'
                      : 'bg-brand-charcoal text-brand-warm-white-warm hover:bg-gray-800'
                  }`}
                >
                  {emailCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    'Copy to Clipboard'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setShareView("default")}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors pt-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </div>

              {/* Right column: preview card on darker cream background */}
              <div className="bg-[hsl(var(--brand-cream))] px-6 py-8 lg:px-10 lg:py-12 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-4 sm:p-5 text-center w-full">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">
                  Share a recipe with
                </p>
                <h4 className="font-serif text-lg sm:text-xl text-gray-900 leading-tight mb-3">
                  {coupleNames || "the couple"}
                </h4>
                {currentCoupleImage && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentCoupleImage}
                    alt={coupleNames || "Couple"}
                    className="w-full aspect-square object-cover rounded-lg mb-3"
                    style={{ objectPosition: `${currentCoupleImagePositionX}% ${currentCoupleImagePositionY}%` }}
                  />
                )}
                <p className="text-xs text-gray-600 leading-relaxed mb-4 max-w-xs mx-auto">
                  We&apos;re gifting them a hardcover cookbook. We want to include your recipe.
                </p>
                <a
                  href={collectionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[hsl(var(--brand-honey))] hover:bg-[hsl(var(--brand-honey-dark))] text-white font-semibold text-xs px-5 py-2 rounded-full transition-colors"
                >
                  Add Your Recipe →
                </a>
                </div>
              </div>
            </div>
          ) : shareView === "qr" ? (
            /* QR sub-view */
            <div className="space-y-5">
              <div className="space-y-2 text-center">
                <h3 className="font-serif text-xl text-gray-900">Print this for your event</h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
                  Put this QR on table cards at the event. Guests scan with their phone and add a recipe right there.
                </p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6">
                  {qrDataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={qrDataUrl} alt="Recipe collection QR code" className="w-40 h-40 sm:w-44 sm:h-44" />
                  ) : (
                    <div className="w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center text-gray-400 text-sm">
                      Generating QR…
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShareView("default")}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <Button
                  onClick={handleDownloadQR}
                  disabled={!qrDataUrl}
                  className="min-h-[44px] flex-1 flex items-center justify-center gap-3 rounded-full text-[15px] font-medium bg-brand-charcoal text-brand-warm-white-warm hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  <Download className="w-5 h-5" />
                  Download QR as PNG
                </Button>
              </div>
            </div>
          ) : (
            /* Expanded layout — focused only on editing photo + message.
               Share buttons live in the default view; this is "edit mode" only. */
            <div className="space-y-4 lg:space-y-6 pt-2">
              <div className="text-center">
                <p className="text-gray-600 text-base leading-relaxed">
                  Personalize your link. A photo and a personal note make the WhatsApp preview feel like it&apos;s from you.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Couple Image Section — right on desktop, top on mobile */}
                {groupId && (
                  <div className="space-y-4 order-1 lg:order-2">
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
                        ) : (
                          /* Normal cropped preview */
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
                        )}
                        {!isRepositioningCoupleImage && (
                          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2 sm:justify-end">
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
                          </div>
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
                            Add a photo of the couple
                          </p>
                          <p className="text-secondary-sm text-gray-500">
                            Click to upload (JPEG, PNG, WebP • max 5MB)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* File Input (Hidden) */}
                    <input
                      id="coupleImageInput"
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
                  </div>
                )}

                {/* Message Customization Section — left on desktop, bottom on mobile */}
                <div className="space-y-4 order-2 lg:order-1">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Your invite message
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    <textarea
                      value={editingMessage}
                      onChange={(e) => {
                        setEditingMessage(e.target.value);
                        setError(null);
                      }}
                      className="w-full p-3 lg:p-4 bg-white border-2 border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors text-gray-900 leading-relaxed"
                      rows={5}
                      placeholder="Your message to guests..."
                      maxLength={300}
                    />
                    <div className="space-y-2 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="flex-1 sm:flex-none min-h-[44px] rounded-lg text-sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleResetMessage}
                          disabled={isSaving}
                          className="flex-1 sm:flex-none min-h-[44px] rounded-lg text-sm"
                        >
                          Use default
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveMessage}
                          disabled={isSaving || editingMessage.trim().length === 0}
                          className="flex-1 sm:flex-none min-h-[44px] rounded-lg text-sm bg-brand-charcoal text-white hover:bg-gray-800"
                        >
                          Save
                        </Button>
                      </div>
                      <span className={`text-xs ${editingMessage.length > 280 ? 'text-red-500' : 'text-gray-400'}`}>
                        {editingMessage.length}/300
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Back to share — bottom left of expanded view */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowMessageCustomization(false)}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to share
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}