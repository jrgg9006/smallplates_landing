"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Copy, Mail, MessageCircle, Facebook, Edit3, Save, X, RotateCcw } from "lucide-react";
import { validateWhatsAppURL, getWhatsAppTroubleshootingTips, isMobileDevice, isIOSDevice } from "@/lib/utils/sharing";
import { updateShareMessage, resetShareMessage, getCurrentProfile } from "@/lib/supabase/profiles";
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
  const [isMobile, setIsMobile] = useState(false);
  
  // Message editing states
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const isEditingRef = useRef(false);

  // Detect mobile device
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Load custom message when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCustomMessage();
      // Reset ref when modal opens
      isEditingRef.current = false;
    } else {
      // Reset editing state when modal closes
      setIsEditingMessage(false);
      setEditingMessage('');
      setMessageError(null);
      isEditingRef.current = false;
    }
  }, [isOpen]);

  // Load custom message from profile
  const loadCustomMessage = async () => {
    // Don't load if user is actively editing
    if (isEditingRef.current || isEditingMessage) {
      return;
    }
    try {
      const { data: profile } = await getCurrentProfile();
      if (profile?.custom_share_message && !isEditingRef.current) {
        setCustomMessage(profile.custom_share_message);
      }
    } catch (err) {
      console.error('Error loading custom message:', err);
    }
  };

  // Create personalized share message
  const shareTitle = "Share a Recipe to my Cookbook - SP&Co.";
  const defaultMessage = userName 
    ? `${userName} invites you to share your favorite recipe with them! They will print it in a cookbook.`
    : 'Share your favorite recipe with me! I will print it in a cookbook.';
  
  const shareMessage = customMessage || defaultMessage;

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

  // Message editing handlers
  const handleEditMessage = () => {
    setEditingMessage(shareMessage);
    setIsEditingMessage(true);
    isEditingRef.current = true;
    setMessageError(null);
  };

  const handleCancelEdit = () => {
    setIsEditingMessage(false);
    isEditingRef.current = false;
    setEditingMessage('');
    setMessageError(null);
  };

  const handleSaveMessage = async () => {
    if (editingMessage.trim().length === 0) {
      setMessageError('Message cannot be empty');
      return;
    }

    if (editingMessage.length > 280) {
      setMessageError('Message must be 280 characters or less');
      return;
    }

    setIsSaving(true);
    setMessageError(null);

    try {
      const { error } = await updateShareMessage(editingMessage);
      if (error) {
        setMessageError(error);
      } else {
        setCustomMessage(editingMessage);
        setIsEditingMessage(false);
        isEditingRef.current = false;
        setEditingMessage('');
      }
    } catch (err) {
      setMessageError('Failed to save message');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetMessage = async () => {
    setIsSaving(true);
    setMessageError(null);

    try {
      const { error } = await resetShareMessage();
      if (error) {
        setMessageError(error);
      } else {
        setCustomMessage(null);
        setIsEditingMessage(false);
        isEditingRef.current = false;
        setEditingMessage('');
      }
    } catch (err) {
      setMessageError('Failed to reset message');
    } finally {
      setIsSaving(false);
    }
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

  // Share content component (reusable for both mobile and desktop)
  const ShareContent = () => (
    <div className="space-y-4">
      {/* Share preview */}
      <div className="p-4 bg-gray-50 rounded-xl">
        {isEditingMessage ? (
          <div className="space-y-2">
            <textarea
              value={editingMessage}
              onChange={(e) => {
                e.stopPropagation();
                setEditingMessage(e.target.value);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              maxLength={280}
              placeholder="Enter your custom message..."
            />
            {/* Character count on its own line, left aligned */}
            <div className="mt-1 text-[11px] leading-none text-gray-500">{editingMessage.length}/280 characters</div>
            {/* Action buttons on a separate row, right aligned and compact */}
            <div className="mt-1 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetMessage}
                disabled={isSaving}
                className="h-7 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSaveMessage}
                disabled={isSaving || editingMessage.trim().length === 0}
                className="h-7 px-2 text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
            {messageError && (
              <div className="text-sm text-red-600">{messageError}</div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-2">{shareMessage}</p>
            <p className="text-xs text-gray-500 truncate font-mono">{collectionUrl}</p>
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEditMessage}
                className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit Message
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Share options - single column on mobile */}
      <div className={isMobile ? "space-y-2" : "grid grid-cols-2 gap-3"}>
        {shareOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.id}
              variant="outline"
              className={
                isMobile 
                  ? "w-full flex items-center justify-start gap-4 h-14 text-left border-gray-200"
                  : "flex flex-col items-center gap-2 h-24 relative"
              }
              onClick={option.action}
            >
              <Icon className={isMobile ? "w-5 h-5" : "w-6 h-6"} />
              <span className={isMobile ? "text-base" : "text-sm"}>
                {option.label}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

    </div>
  );

  // Mobile version with Drawer
  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content 
            className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-full max-h-[75vh] flex-col rounded-t-[10px] bg-white"
            onInteractOutside={(e) => {
              // Prevent drawer from closing when clicking inside, especially when editing
              if (isEditingRef.current || isEditingMessage) {
                e.preventDefault();
              }
            }}
            onEscapeKeyDown={(e) => {
              // Prevent drawer from closing on escape when editing
              if (isEditingRef.current || isEditingMessage) {
                e.preventDefault();
              }
            }}
          >
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-gray-300" />
            <div 
              className="p-5"
              onPointerDown={(e) => {
                // Prevent drawer drag from starting when clicking on content
                if (isEditingRef.current || isEditingMessage) {
                  e.stopPropagation();
                }
              }}
            >
              <Drawer.Title className="text-center text-lg font-semibold mb-3">
                Share Your Collection Link
              </Drawer.Title>
              <ShareContent />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop version with Dialog
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Share Your Collection Link
          </DialogTitle>
        </DialogHeader>
        <ShareContent />
      </DialogContent>
    </Dialog>
  );
}