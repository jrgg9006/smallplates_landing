"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Image as ImageIcon, MessageCircle, Mail, QrCode, ArrowLeft, Download } from "lucide-react";
import { getGroupShareMessage, updateGroupShareMessage, resetGroupShareMessage } from "@/lib/supabase/groups";
import { isIOSDevice } from "@/lib/utils/sharing";
import QRCode from "qrcode";
import { CoupleImageEditor } from "@/components/profile/groups/CoupleImageEditor";

interface ShareCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionUrl: string;
  userName: string | null;
  isOnboardingStep?: boolean;
  onStepComplete?: () => void;
  groupId?: string | null;
  coupleNames?: string | null;
  // Reason: drives occasion-aware copy. Weddings/bridal showers say "wedding
  // cookbook"; non-couple occasions (birthday/other) use a neutral phrasing since
  // coupleNames holds a book title, not people's names.
  occasion?: string | null;
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
  occasion = null,
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
      // Reason: clear edit state on close so the next open re-runs
      // loadCustomMessage (gated by !isEditingMessage) and reseeds the textarea.
      setIsEditingMessage(false);
    }
  }, [isOpen, openExpanded]);

  // Load custom message from group_members only (no profile fallback)
  const loadCustomMessage = async () => {
    try {
      // If no groupId, we can't load custom message - use default
      if (!groupId) {
        setCustomMessage(null);
        // Reason: opened expanded with no group → still seed the textarea with
        // the default so it isn't blank.
        if (openExpanded) {
          setEditingMessage(defaultMessage);
          setIsEditingMessage(true);
        }
        return;
      }

      // Always try to load custom message from group_members when groupId exists
      const { data: groupData, error: groupError } = await getGroupShareMessage(groupId);

      const loaded = !groupError && groupData?.custom_share_message
        ? groupData.custom_share_message
        : null;
      setCustomMessage(loaded);

      // Reason: when the modal opens directly in the expanded view (checklist /
      // setup), seed the textarea with the resolved message (custom or default).
      // The "Add photo & message" button seeds via handleShowMessageCustomization,
      // but the openExpanded shortcut bypasses that, leaving the box blank.
      if (openExpanded) {
        setEditingMessage(loaded || defaultMessage);
        setIsEditingMessage(true);
      }
    } catch (err) {
      console.error('Error loading custom message:', err);
      setCustomMessage(null);
    }
  };

  // Reason: weddings/bridal showers (and legacy groups with no occasion) say
  // "wedding cookbook"; anniversaries say "cookbook"; non-couple occasions
  // (birthday/other) hold a book title in coupleNames, so they use a neutral
  // "this cookbook" phrasing instead of a possessive.
  const isCoupleOccasion =
    occasion === 'wedding' || occasion === 'bridal_shower' || occasion === 'anniversary' || !occasion;
  const isWeddingOccasion = occasion === 'wedding' || occasion === 'bridal_shower' || !occasion;

  // Default message using brand voice
  const coupleDisplayName = coupleNames || 'this cookbook';
  const defaultMessage = isCoupleOccasion
    ? `You're adding a recipe to ${coupleDisplayName}'s ${isWeddingOccasion ? 'wedding cookbook' : 'cookbook'}. Doesn't have to be fancy—just something you actually make.`
    : `You're adding a recipe to this cookbook. Doesn't have to be fancy—just something you actually make.`;
  
  const shareMessage = customMessage || defaultMessage;

  // Reason: occasion-aware photo label. Couples (wedding/bridal/anniversary +
  // legacy no-occasion) say "of the couple"; birthdays name the person; anything
  // else (Other/unsure) stays neutral so it never says "couple".
  const photoUploadLabel = isCoupleOccasion
    ? "Add a photo of the couple"
    : occasion === "birthday"
      ? "Add a photo of the birthday person"
      : "Add a photo";

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
    const couple = coupleNames || "this cookbook";
    const intro = isCoupleOccasion
      ? `${couple} wants you to share a recipe for their ${isWeddingOccasion ? 'wedding cookbook' : 'cookbook'}.`
      : `You're invited to add a recipe to ${couple}.`;
    return `${intro}\n\n${shareMessage}\n\nAdd your recipe: ${collectionUrl}`;
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
                      currentCoupleImage ? (
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
                  <CoupleImageEditor
                    groupId={groupId}
                    imageUrl={currentCoupleImage}
                    positionX={currentCoupleImagePositionX}
                    positionY={currentCoupleImagePositionY}
                    onChange={onImageChange}
                    onError={setError}
                    uploadLabel={photoUploadLabel}
                    className="order-1 lg:order-2"
                  />
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