"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Copy, Mail, MessageCircle, Facebook, Edit3, Save, RotateCcw } from "lucide-react";
import { validateWhatsAppURL, isMobileDevice } from "@/lib/utils/sharing";
import { updateShareMessage, resetShareMessage, getCurrentProfile } from "@/lib/supabase/profiles";
import { OnboardingBadge } from "@/components/onboarding/OnboardingBadge";
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
  isOnboardingStep?: boolean;
  onStepComplete?: () => void;
}

export function ShareCollectionModal({ 
  isOpen, 
  onClose, 
  collectionUrl,
  userName,
  isOnboardingStep = false,
  onStepComplete
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
  const [isLoading, setIsLoading] = useState(false);

  // Detect mobile device
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Load custom message when modal opens
  useEffect(() => {
    if (isOpen && !isEditingMessage) {
      loadCustomMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Load custom message from profile
  const loadCustomMessage = async () => {
    setIsLoading(true);
    try {
      const { data: profile, error: profileError } = await getCurrentProfile();
      if (!profileError && profile?.custom_share_message) {
        setCustomMessage(profile.custom_share_message);
      } else {
        setCustomMessage(null);
      }
    } catch (err) {
      console.error('Error loading custom message:', err);
      setCustomMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Default message
  const defaultMessage = userName 
    ? `Hi! I'm ${userName} and I'm collecting recipes for a special cookbook project. Would you share one of your favorites?`
    : 'Hi! I\'m collecting recipes for a special cookbook project. Would you share one of your favorites?';
  
  const shareMessage = customMessage || defaultMessage;

  // Default title for email subject
  const emailSubject = userName 
    ? `Share Your Recipe for ${userName}'s Cookbook! 🍳`
    : "Share Your Recipe for My Cookbook! 🍳";

  // WhatsApp preview title (fixed, shown in preview)
  const whatsappPreviewTitle = 'Share a Recipe to my Cookbook - SP&Co';

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
    const subject = encodeURIComponent(emailSubject);
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

    // WhatsApp: Only send the link (message appears in preview)
    const url = encodeURIComponent(collectionUrl);
    window.open(`https://wa.me/?text=${url}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(collectionUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  // Message editing handlers
  const handleEditMessage = () => {
    setEditingMessage(shareMessage);
    setIsEditingMessage(true);
    setMessageError(null);
    
    // If this is an onboarding step, complete it when user clicks Edit
    if (isOnboardingStep && onStepComplete) {
      onStepComplete();
    }
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
      const { error } = await updateShareMessage(editingMessage.trim());
      if (error) {
        setMessageError(error);
      } else {
        setCustomMessage(editingMessage.trim());
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

  // Mobile version - Drawer that slides up from bottom
  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={onClose}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-full max-h-[75vh] flex-col rounded-t-[10px] bg-white">
            <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-gray-300" />
            <div className="p-6 overflow-y-auto">
              <Drawer.Title className="text-center text-lg font-semibold mb-6">
                Share Your Collection Link
              </Drawer.Title>
              <div className="space-y-6">
                {/* WhatsApp Preview section */}
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Message Title: </span>
                    <span className="text-gray-700 text-sm">{whatsappPreviewTitle}</span>
                  </div>
                </div>

                {/* Message section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between relative">
                    <h3 className="text-sm font-medium text-gray-900">Personal Message</h3>
                    {!isEditingMessage && (
                      <button
                        onClick={handleEditMessage}
                        className={`text-sm text-gray-500 hover:text-gray-700 transition-all flex items-center gap-1 relative ${
                          isOnboardingStep 
                            ? 'ring-2 ring-[#464665] ring-offset-2 rounded-md px-2 py-1 animate-pulse' 
                            : ''
                        }`}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                        {isOnboardingStep && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#464665] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#464665]"></span>
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {isEditingMessage ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingMessage}
                        onChange={(e) => setEditingMessage(e.target.value)}
                        className="w-full p-4 bg-white border-2 border-gray-900 rounded-xl resize-none focus:outline-none focus:ring-0 focus:border-gray-900 transition-colors text-gray-900 leading-relaxed"
                        rows={4}
                        maxLength={280}
                        placeholder={defaultMessage}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">{editingMessage.length}/280 characters</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="h-8 px-3 text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleResetMessage}
                            disabled={isSaving}
                            className="h-8 px-3 text-gray-600 hover:text-gray-900"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveMessage}
                            disabled={isSaving || editingMessage.trim().length === 0}
                            className="h-8 px-4 bg-gray-900 text-white hover:bg-gray-800"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                      
                      {messageError && (
                        <div className="text-sm text-red-600 mt-1">{messageError}</div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                      <p className="text-gray-700 leading-relaxed">{shareMessage}</p>
                    </div>
                  )}
                </div>

                {/* Onboarding Badge - Show only during onboarding, after Personal Message */}
                {isOnboardingStep && !isEditingMessage && (
                  <div className="relative">
                    {/* Arrow pointing to Edit button */}
                    <div className="absolute -top-8 right-0 flex items-center justify-end">
                      <svg 
                        className="w-16 h-12 text-[#464665]" 
                        viewBox="0 0 64 48" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          d="M8 40 L56 8 M56 8 L40 8 M56 8 L56 24" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className="animate-pulse"
                        />
                      </svg>
                    </div>
                    <OnboardingBadge
                      stepNumber={3}
                      title="Step 3 of Onboarding"
                      message="Edit your personal message to customize how your link appears when shared. Click 'Edit' above to get started."
                    />
                  </div>
                )}

                <div className="h-px bg-gray-200" />

                {/* Share options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Share via</h3>
                    <button
                      onClick={() => {
                        if (collectionUrl && typeof window !== 'undefined') {
                          window.open(collectionUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 underline transition-colors"
                    >
                      Preview Form
                    </button>
                  </div>
                  <div className="space-y-2">
                    {shareOptions.map((option) => {
                      const Icon = option.icon;
                      const isActive = option.id === 'copy' && copied;
                      
                      return (
                        <button
                          key={option.id}
                          onClick={option.action}
                          className={`
                            w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                            ${isActive 
                              ? 'bg-green-50 border-green-500 text-green-700' 
                              : 'bg-white border-gray-200 hover:border-gray-900 hover:bg-gray-50 text-gray-900'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-600'}`} />
                          <span className="font-medium text-left flex-1">
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop version - Sheet that slides from right
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="!w-[45%] !max-w-none h-full flex flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl font-semibold mb-4">
            Share Your Collection Link
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 pr-4">
            {/* WhatsApp Preview section */}
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-900">Message Title: </span>
                <span className="text-gray-700 text-sm">{whatsappPreviewTitle}</span>
              </div>
            </div>

            {/* Message section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between relative">
                <h3 className="text-sm font-medium text-gray-900">Personal Message</h3>
                {!isEditingMessage && (
                  <button
                    onClick={handleEditMessage}
                    className={`text-sm text-gray-500 hover:text-gray-700 transition-all flex items-center gap-1 relative ${
                      isOnboardingStep 
                        ? 'ring-2 ring-[#464665] ring-offset-2 rounded-md px-2 py-1 animate-pulse' 
                        : ''
                    }`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                    {isOnboardingStep && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#464665] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#464665]"></span>
                      </span>
                    )}
                  </button>
                )}
              </div>
              
              {isEditingMessage ? (
                <div className="space-y-3">
                  <textarea
                    value={editingMessage}
                    onChange={(e) => setEditingMessage(e.target.value)}
                    className="w-full p-4 bg-white border-2 border-gray-900 rounded-xl resize-none focus:outline-none focus:ring-0 focus:border-gray-900 transition-colors text-gray-900 leading-relaxed"
                    rows={5}
                    maxLength={280}
                    placeholder={defaultMessage}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{editingMessage.length}/280 characters</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="h-8 px-3 text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleResetMessage}
                        disabled={isSaving}
                        className="h-8 px-3 text-gray-600 hover:text-gray-900"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveMessage}
                        disabled={isSaving || editingMessage.trim().length === 0}
                        className="h-8 px-4 bg-gray-900 text-white hover:bg-gray-800"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                  
                  {messageError && (
                    <div className="text-sm text-red-600 mt-1">{messageError}</div>
                  )}
                </div>
              ) : (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                  <p className="text-gray-700 leading-relaxed">{shareMessage}</p>
                </div>
              )}
            </div>

            {/* Onboarding Badge - Show only during onboarding, after Personal Message */}
            {isOnboardingStep && !isEditingMessage && (
              <div className="relative">
                {/* Arrow pointing to Edit button */}
                <div className="absolute -top-8 right-0 flex items-center justify-end">
                  <svg 
                    className="w-16 h-12 text-[#464665]" 
                    viewBox="0 0 64 48" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M8 40 L56 8 M56 8 L40 8 M56 8 L56 24" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="animate-pulse"
                    />
                  </svg>
                </div>
                <OnboardingBadge
                  stepNumber={3}
                  title="Step 3 of Onboarding"
                  message="Edit your personal message to customize how your link appears when shared. Click 'Edit' above to get started."
                />
              </div>
            )}

            <div className="h-px bg-gray-200" />

            {/* Share options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Share via</h3>
                <button
                  onClick={() => {
                    if (collectionUrl && typeof window !== 'undefined') {
                      window.open(collectionUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 underline transition-colors"
                >
                  Preview Form
                </button>
              </div>
              <div className="space-y-2">
                {shareOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = option.id === 'copy' && copied;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={option.action}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                        ${isActive 
                          ? 'bg-green-50 border-green-500 text-green-700' 
                          : 'bg-white border-gray-200 hover:border-gray-900 hover:bg-gray-50 text-gray-900'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-600'}`} />
                      <span className="font-medium text-left flex-1">
                        {option.label}
                      </span>
                      {option.id === 'copy' && (
                        <span className={`text-sm ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {isActive ? 'Link copied!' : 'One click to copy'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}