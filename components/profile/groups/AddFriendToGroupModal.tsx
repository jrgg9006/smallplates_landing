"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import type { GroupWithMembers } from "@/lib/types/database";

interface AddFriendToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupWithMembers | null;
  onInviteSent?: () => void;
}

export function AddFriendToGroupModal({ isOpen, onClose, group, onInviteSent }: AddFriendToGroupModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLinkCopied(false);
      setError(null);
      if (group?.id && typeof window !== 'undefined') {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
        setInviteLink(`${baseUrl}/groups/${group.id}/join`);
      }
    }
  }, [isOpen, group?.id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      onInviteSent?.();
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setError('Failed to copy link');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="type-modal-title">
            Invite a Captain
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-gray-600 text-sm">
            Captains have full access to this book and can help collect recipes. Share this link — they&apos;ll be asked to sign in when they open it.
          </p>

          {/* Copy button */}
          <Button
            onClick={handleCopyLink}
            className={`w-full min-h-[44px] rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
              linkCopied
                ? 'bg-[hsl(var(--brand-honey))] border-[hsl(var(--brand-honey))] text-black hover:bg-[hsl(var(--brand-honey))] hover:border-[hsl(var(--brand-honey))] hover:text-black'
                : 'bg-black text-white hover:bg-gray-800 border-black'
            }`}
          >
            {linkCopied ? (
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

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
