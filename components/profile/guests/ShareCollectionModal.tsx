"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  
  // Message editing states - SIMPLIFIED
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  // Detect mobile device
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Load custom message when modal opens
  useEffect(() => {
    if (isOpen && !isEditingMessage) {
      loadCustomMessage();
    }
  }, [isOpen]);

  // Load custom message from profile
  const loadCustomMessage = async () => {
    try {
      const { data: profile } = await getCurrentProfile();
      if (profile?.custom_share_message) {
        setCustomMessage(profile.custom_share_message);
      } else {
        setCustomMessage(null);
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

  // Message editing handlers - SIMPLIFIED
  const handleEditMessage = () => {
    setEditingMessage(shareMessage);
    setIsEditingMessage(true);
    setMessageError(null);
  };

  const handleCancelEdit = () => {
    setIsEditingMessage(false);
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

  // Mobile version
  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[92%] sm:max-w-md max-h-[80vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              Share Your Collection Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Share preview */}
            <div className="p-4 bg-gray-50 rounded-xl">
              {isEditingMessage ? (
                <div className="space-y-2">
                  <textarea
                    id="editingMessage"
                    value={editingMessage}
                    onChange={(e) => setEditingMessage(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="space-y-2">
              {shareOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.id}
                    variant="outline"
                    className="w-full flex items-center justify-start gap-4 h-14 text-left border-gray-200"
                    onClick={option.action}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-base">
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
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop version
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Share Your Collection Link
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Share preview */}
          <div className="p-4 bg-gray-50 rounded-xl">
            {isEditingMessage ? (
              <div className="space-y-2">
                <textarea
                  id="editingMessage"
                  value={editingMessage}
                  onChange={(e) => setEditingMessage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Share options - grid on desktop */}
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
                  <span className="text-sm">
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
      </DialogContent>
    </Dialog>
  );
}