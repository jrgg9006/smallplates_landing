"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2, RefreshCw } from "lucide-react";
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
  const [regenerating, setRegenerating] = useState(false);

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
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setError("Failed to copy link");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRegenerate = async () => {
    if (!group?.id || regenerating) return;
    setRegenerating(true);
    setError(null);
    setLinkCopied(false);
    try {
      const res = await fetch(`/api/v1/groups/${group.id}/captain-token`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        setError(data?.error || "Could not regenerate link");
        return;
      }
      setInviteLink(buildInviteLink(data.token));
    } catch {
      setError("Could not regenerate link");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="type-modal-title">Invite a Captain</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-gray-600 text-base leading-relaxed">
            Captains have full access to this book and can help collect recipes. Anyone with this link becomes a captain. Only share it with people you trust. The link expires in 14 days and works for up to 10 captains.
          </p>

          {/* Copy button */}
          <Button
            onClick={handleCopyLink}
            disabled={loadingToken || !inviteLink}
            className={`w-full min-h-[44px] rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
              linkCopied
                ? "bg-[hsl(var(--brand-honey))] border-[hsl(var(--brand-honey))] text-black hover:bg-[hsl(var(--brand-honey))] hover:border-[hsl(var(--brand-honey))] hover:text-black"
                : "bg-black text-white hover:bg-gray-800 border-black"
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
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>

          {/* Regenerate */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={loadingToken || regenerating}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              {regenerating ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Regenerating…
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" />
                  Regenerate link
                </>
              )}
            </button>
            <p className="text-[11px] text-gray-400 mt-1">
              Old links stop working immediately.
            </p>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
