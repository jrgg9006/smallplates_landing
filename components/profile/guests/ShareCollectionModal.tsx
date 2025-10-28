"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Mail, MessageCircle, Facebook } from "lucide-react";
import { validateWhatsAppURL, getWhatsAppTroubleshootingTips, isMobileDevice, isIOSDevice } from "@/lib/utils/sharing";
import type { LucideIcon } from "lucide-react";

interface ShareOption {
  id: 'copy' | 'email' | 'whatsapp' | 'facebook';
  label: string;
  icon: LucideIcon;
  action: () => void;
}

interface ShareCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionUrl: string;
  userName: string | null;
}

export function ShareCollectionModal({ 
  isOpen, 
  onClose, 
  collectionUrl,
  userName 
}: ShareCollectionModalProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create personalized share message
  const shareTitle = "Share a Recipe to my Cookbook - SP&Co.";
  const shareMessage = userName 
    ? `${userName} invites you to share your favorite recipe with them! They will print it in a cookbook.`
    : 'Share your favorite recipe with me! I will print it in a cookbook.';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(collectionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Failed to copy link");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`${shareMessage}\n\n${collectionUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleWhatsAppShare = () => {
    // Validate URL for WhatsApp
    const validation = validateWhatsAppURL(collectionUrl);
    if (!validation.isValid) {
      const errorMessage = validation.issues.length > 0 
        ? validation.issues[0] 
        : "Invalid URL for WhatsApp";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
      return;
    }

    const message = encodeURIComponent(`${shareMessage}\n\n${collectionUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(collectionUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'copy',
      label: copied ? 'Copied!' : 'Copy Link',
      icon: Copy,
      action: handleCopyLink
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      action: handleEmailShare
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      action: handleWhatsAppShare
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      action: handleFacebookShare
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Share Your Collection Link</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Share preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">{shareMessage}</p>
            <p className="text-xs text-gray-500 truncate">{collectionUrl}</p>
          </div>

          {/* Share options grid */}
          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.id}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-24 relative"
                  onClick={option.action}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm">{option.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* WhatsApp troubleshooting for iOS */}
          {isIOSDevice() && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>iOS tip:</strong> If WhatsApp doesn&apos;t open, make sure you have WhatsApp installed and try copying the link instead.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}