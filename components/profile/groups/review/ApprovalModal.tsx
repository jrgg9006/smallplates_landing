"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Reason: owner persists approval to DB before continuing; captains just
  // continue in-UI (their check is not recorded — only the owner's approval
  // gates printing). The container decides what onConfirm does per role.
  onConfirm: () => Promise<void> | void;
  // Pre-check the box for owners who already approved on a previous visit.
  alreadyApproved?: boolean;
}

// Reason: Shown when the user clicks "Continue" on the Recipes step. A required
// checkbox makes the print approval an explicit, deliberate action (Storyworth
// pattern). Uses the brand Dialog + type-* utility classes.
export function ApprovalModal({
  isOpen,
  onClose,
  onConfirm,
  alreadyApproved = false,
}: ApprovalModalProps) {
  const [checked, setChecked] = useState(alreadyApproved);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!checked || saving) return;
    setSaving(true);
    try {
      await onConfirm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="type-modal-title">
            Is everything ready to print?
          </DialogTitle>
        </DialogHeader>

        <p className="text-gray-600 text-base leading-relaxed">
          We clean up the formatting of every recipe (bullet points, steps,
          measurements) and add one image per recipe. The words stay yours. No one
          on our team rewrites them.
        </p>

        <p className="text-gray-600 text-base leading-relaxed">
          What you see in the preview is what gets printed. Give it one last look.
          Watch for typos, a duplicate, or anything you&apos;d rather not include.
          Once you continue, the recipes are locked.
        </p>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#F3F2F0] px-5 py-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-[hsl(var(--brand-border-button))] text-brand-honey focus:ring-brand-honey/30"
          />
          <span className="text-[15px] leading-relaxed text-brand-charcoal">
            I&apos;ve reviewed everything and confirm this book is ready to print.
          </span>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="w-full rounded-full border border-[rgba(45,45,45,0.14)] py-3.5 text-[15px] font-medium text-brand-charcoal transition-colors hover:bg-[rgba(45,45,45,0.03)] sm:flex-1"
          >
            Keep reviewing
          </button>
          <button
            onClick={handleConfirm}
            disabled={!checked || saving}
            className="w-full rounded-full bg-brand-charcoal py-3.5 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 disabled:opacity-40 sm:flex-1"
          >
            {saving ? "Saving…" : "Approve & continue →"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
