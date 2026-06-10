"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2 } from "lucide-react";
import type { GroupWithMembers } from "@/lib/types/database";

interface AddFriendToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupWithMembers | null;
  onInviteSent?: () => void;
}

export function AddFriendToGroupModal({
  isOpen,
  onClose,
  group,
  onInviteSent,
}: AddFriendToGroupModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [loadingToken, setLoadingToken] = useState(false);

  const buildInviteLink = (token: string): string => {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    return `${baseUrl}/groups/${group?.id}/join?token=${token}`;
  };

  // Reason: lazy-fetch the captain invite token when the modal opens. The GET
  // endpoint generates one on first call (or when the previous one expired).
  useEffect(() => {
    if (!isOpen || !group?.id) return;

    let cancelled = false;
    setLinkCopied(false);
    setError(null);
    setInviteLink("");
    setLoadingToken(true);

    fetch(`/api/v1/groups/${group.id}/captain-token`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !data.token) {
          setError(data?.error || "Could not load captain link");
          return;
        }
        setInviteLink(buildInviteLink(data.token));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load captain link");
      })
      .finally(() => {
        if (!cancelled) setLoadingToken(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, group?.id]);

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      onInviteSent?.();
      // Reason: the copied state now carries a next-step instruction, so give
      // the user time to read it.
      setTimeout(() => setLinkCopied(false), 4000);
    } catch {
      setError("Failed to copy link");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="type-modal-title">Captain Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-gray-600 text-base leading-relaxed">
            A captain can see everything in this book and helps collect recipes. Anyone with this link becomes one, so share it with people you trust.
          </p>

          {/* Copy button */}
          <Button
            onClick={handleCopyLink}
            disabled={loadingToken || !inviteLink}
            className={`w-full h-auto rounded-full py-3.5 text-[15px] font-medium flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 ${
              linkCopied
                ? "bg-[hsl(var(--brand-honey))] text-black hover:bg-[hsl(var(--brand-honey))]"
                : "bg-brand-charcoal text-brand-warm-white-warm hover:bg-gray-800"
            }`}
          >
            {loadingToken ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading link…
              </>
            ) : linkCopied ? (
              <>
                <Check className="h-4 w-4" />
                Copied. Now paste it in a text or WhatsApp
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
