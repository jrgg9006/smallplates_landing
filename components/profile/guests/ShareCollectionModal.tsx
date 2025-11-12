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
  
  // WhatsApp customization states
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  // Detect mobile device
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Load custom content when modal opens
  useEffect(() => {
    if (isOpen && !isEditingContent) {
      loadCustomContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Load custom content from profile
  const loadCustomContent = async () => {
    try {
      // TODO: Load custom WhatsApp preview settings from profile
      // const { data: profile } = await getCurrentProfile();
      // if (profile?.custom_whatsapp_title) {
      //   setCustomTitle(profile.custom_whatsapp_title);
      // }
      // if (profile?.custom_whatsapp_description) {
      //   setCustomDescription(profile.custom_whatsapp_description);
      // }
    } catch (err) {
      console.error('Error loading custom content:', err);
    }
  };

  // Create personalized share content
  const defaultTitle = userName 
    ? `Share Your Recipe for ${userName}'s Cookbook! 🍳`
    : "Share Your Recipe for My Cookbook! 🍳";
  const defaultDescription = userName 
    ? `Help ${userName} create a beautiful family cookbook with your favorite recipe. It will be printed in a gorgeous book!`
    : 'Help me create a beautiful family cookbook with your favorite recipe. It will be printed in a gorgeous book!';
  const defaultMessage = userName 
    ? `Hi! I'm ${userName} and I'm collecting recipes for a special cookbook project. Would you share one of your favorites?`
    : 'Hi! I\'m collecting recipes for a special cookbook project. Would you share one of your favorites?';
  
  const shareTitle = customTitle || defaultTitle;
  const shareDescription = customDescription || defaultDescription;
  const shareMessage = defaultMessage; // Keep message simple

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

    // WhatsApp only uses the message, not separate title
    // The link preview title comes from the webpage meta tags
    const message = encodeURIComponent(`${shareMessage}\n\n${collectionUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(collectionUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  // Content editing handlers
  const handleEditContent = () => {
    setEditingTitle(shareTitle);
    setEditingDescription(shareDescription);
    setIsEditingContent(true);
    setContentError(null);
  };

  const handleCancelEdit = () => {
    setIsEditingContent(false);
    setEditingTitle('');
    setEditingDescription('');
    setContentError(null);
  };

  const handleSaveContent = async () => {
    if (editingTitle.trim().length === 0) {
      setContentError('WhatsApp title cannot be empty');
      return;
    }

    if (editingDescription.trim().length === 0) {
      setContentError('WhatsApp description cannot be empty');
      return;
    }

    setIsSaving(true);
    setContentError(null);

    try {
      // Save locally for now
      setCustomTitle(editingTitle);
      setCustomDescription(editingDescription);
      setIsEditingContent(false);
      setEditingTitle('');
      setEditingDescription('');
      
      // TODO: Save to database and update meta tags on collector page
      // const { error } = await updateCollectorMetaTags({ 
      //   title: editingTitle, 
      //   description: editingDescription,
      //   collectionToken: extractTokenFromUrl(collectionUrl) 
      // });
    } catch (err) {
      setContentError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetContent = async () => {
    setIsSaving(true);
    setContentError(null);

    try {
      // Reset to defaults
      setCustomTitle(null);
      setCustomDescription(null);
      setIsEditingContent(false);
      setEditingTitle('');
      setEditingDescription('');
      
      // TODO: Reset in database when backend is ready
      // const { error } = await resetCollectorMetaTags();
    } catch (err) {
      setContentError('Failed to reset content');
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
            <div className="p-6">
              <Drawer.Title className="text-center text-lg font-semibold mb-6">
                Share Your Collection Link
              </Drawer.Title>
              <div className="space-y-6">
            {/* WhatsApp Preview section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">WhatsApp Preview</h3>
                {!isEditingContent && (
                  <button
                    onClick={handleEditContent}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Customize
                  </button>
                )}
              </div>
              
              {isEditingContent ? (
                <div className="space-y-3">
                  {/* WhatsApp Title Input */}
                  <div>
                    <label htmlFor="editingTitle" className="block text-xs font-medium text-gray-600 mb-1">
                      WhatsApp Preview Title
                    </label>
                    <input
                      id="editingTitle"
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="w-full p-3 bg-white border-2 border-gray-900 rounded-xl focus:outline-none focus:ring-0 focus:border-gray-900 transition-colors text-gray-900"
                      maxLength={60}
                      placeholder="Share Your Recipe for My Cookbook! 🍳"
                    />
                    <p className="text-xs text-gray-500 mt-1">{editingTitle.length}/60 - This appears as the main headline in WhatsApp</p>
                  </div>

                  {/* WhatsApp Description Textarea */}
                  <div className="relative">
                    <label htmlFor="editingDescription" className="block text-xs font-medium text-gray-600 mb-1">
                      WhatsApp Preview Description
                    </label>
                    <textarea
                      id="editingDescription"
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      className="w-full p-4 bg-white border-2 border-gray-900 rounded-xl resize-none focus:outline-none focus:ring-0 focus:border-gray-900 transition-colors text-gray-900 leading-relaxed"
                      rows={3}
                      maxLength={160}
                      placeholder="Help me create a beautiful family cookbook with your favorite recipe..."
                      style={{ minHeight: '100px' }}
                    />
                    <div className="absolute bottom-2 right-3 text-[11px] text-gray-400">
                      {editingDescription.length}/160
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This appears as the description in the WhatsApp preview box</p>
                  </div>

                  {/* Info about WhatsApp */}
                  <div className="border border-gray-200 bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">📱 WhatsApp Preview</p>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>When someone shares your link, WhatsApp will show a preview box with your custom title and description.</p>
                      <p className="text-xs text-gray-600">Note: Changes may take a few minutes to appear in WhatsApp due to caching.</p>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex justify-end gap-2">
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
                      onClick={handleResetContent}
                      disabled={isSaving}
                      className="h-8 px-3 text-gray-600 hover:text-gray-900"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveContent}
                      disabled={isSaving || editingTitle.trim().length === 0 || editingDescription.trim().length === 0}
                      className="h-8 px-4 bg-gray-900 text-white hover:bg-gray-800"
                    >
                      Save
                    </Button>
                  </div>
                  
                  {contentError && (
                    <div className="text-sm text-red-600 mt-1">{contentError}</div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview Card */}
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-5">
                    {/* Title Section */}
                    <div className="mb-4 pb-3 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Title</p>
                      <p className="text-gray-700 leading-relaxed font-light">{shareTitle}</p>
                    </div>
                    
                    {/* Description Section */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Description</p>
                      <p className="text-gray-700 leading-relaxed font-light">{shareDescription}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-200" />

            {/* Share options - single column on mobile */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Share via</h3>
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
          {/* Share message section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">WhatsApp Preview</h3>
              {!isEditingContent && (
                <button
                  onClick={handleEditContent}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Customize
                </button>
              )}
            </div>
            
            {isEditingContent ? (
              <div className="space-y-3">
                {/* WhatsApp Title Input */}
                <div>
                  <label htmlFor="editingTitle" className="block text-xs font-medium text-gray-600 mb-1">
                    WhatsApp Preview Title
                  </label>
                  <input
                    id="editingTitle"
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-gray-900 rounded-xl focus:outline-none focus:ring-0 focus:border-gray-900 transition-colors text-gray-900"
                    maxLength={60}
                    placeholder="Share Your Recipe for My Cookbook! 🍳"
                  />
                  <p className="text-xs text-gray-500 mt-1">{editingTitle.length}/60 - This appears as the main headline in WhatsApp</p>
                </div>

                {/* WhatsApp Description Textarea */}
                <div className="relative">
                  <label htmlFor="editingDescription" className="block text-xs font-medium text-gray-600 mb-1">
                    WhatsApp Preview Description
                  </label>
                  <textarea
                    id="editingDescription"
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    className="w-full p-4 bg-white border-2 border-gray-900 rounded-xl resize-none focus:outline-none focus:ring-0 focus:border-gray-900 transition-colors text-gray-900 leading-relaxed"
                    rows={3}
                    maxLength={160}
                    placeholder="Help me create a beautiful family cookbook with your favorite recipe..."
                    style={{ minHeight: '100px' }}
                  />
                  <div className="absolute bottom-2 right-3 text-[11px] text-gray-400">
                    {editingDescription.length}/160
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This appears as the description in the WhatsApp preview box</p>
                </div>

                {/* Info about WhatsApp */}
                <div className="border border-gray-200 bg-blue-50 p-4 rounded-xl">
                  <p className="text-xs font-medium text-blue-800 mb-2 uppercase tracking-wide">📱 WhatsApp Preview</p>
                  <div className="text-sm text-blue-900 space-y-1">
                    <p>When someone shares your link, WhatsApp will show a preview box with your custom title and description.</p>
                    <p className="text-xs text-blue-700">Note: Changes may take a few minutes to appear in WhatsApp due to caching.</p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-end gap-2">
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
                
                {messageError && (
                  <div className="text-sm text-red-600 mt-1">{messageError}</div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview Card */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-5">
                  {/* Title Section */}
                  <div className="mb-4 pb-3 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Title</p>
                    <p className="text-gray-700 leading-relaxed font-light">{shareTitle}</p>
                  </div>
                  
                  {/* Message Section */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Message</p>
                    <p className="text-gray-700 leading-relaxed font-light">{shareMessage}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-200" />

          {/* Share options - horizontal rectangles */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Share via</h3>
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