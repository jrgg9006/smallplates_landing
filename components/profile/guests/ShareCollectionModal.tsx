"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Edit3 } from "lucide-react";
import { updateShareMessage, resetShareMessage, getCurrentProfile } from "@/lib/supabase/profiles";

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
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showMessageCustomization, setShowMessageCustomization] = useState(false);

  // Load custom message when modal opens
  useEffect(() => {
    if (isOpen && !isEditingMessage) {
      loadCustomMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Load custom message from profile
  const loadCustomMessage = async () => {
    try {
      const { data: profile, error: profileError } = await getCurrentProfile();
      if (!profileError && profile) {
        if (profile.custom_share_signature !== undefined) {
          // New format: separated fields
          if (profile.custom_share_message) {
            const combinedMessage = `${profile.custom_share_message}

— ${profile.custom_share_signature || userName || '(Your name)'}`;
            setCustomMessage(combinedMessage);
          } else {
            setCustomMessage(null);
          }
        } else if (profile.custom_share_message) {
          // Legacy format: combined message
          setCustomMessage(profile.custom_share_message);
        } else {
          setCustomMessage(null);
        }
      } else {
        setCustomMessage(null);
      }
    } catch (err) {
      console.error('Error loading custom message:', err);
      setCustomMessage(null);
    }
  };

  // Default message using brand voice
  const defaultMessage = `I'm putting together a cookbook with recipes from everyone who loves us.

Send your favorite dish — anything goes. Takes 5 minutes. You'll be in our kitchen forever.

— ${userName || '(Your name)'}`;
  
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

  const handleCopyLinkAndMessage = async () => {
    try {
      const fullMessage = `${shareMessage}\n\n${collectionUrl}`;
      await navigator.clipboard.writeText(fullMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Failed to copy link and message");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleShowMessageCustomization = () => {
    setShowMessageCustomization(true);
  };

  const handleEditMessage = () => {
    // Parse existing message to separate note and signature
    const messageToEdit = shareMessage;
    const signatureMatch = messageToEdit.match(/—\s*(.+)$/);
    
    if (signatureMatch) {
      const note = messageToEdit.replace(/\n*—\s*.+$/, '').trim();
      setEditingMessage(note);
    } else {
      setEditingMessage(messageToEdit);
    }
    
    setIsEditingMessage(true);
    setError(null);
    
    // If this is an onboarding step, complete it when user clicks Edit
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
      const signature = userName || '(Your name)';
      const { error } = await updateShareMessage(editingMessage.trim(), signature);
      if (error) {
        setError(error);
      } else {
        const combinedMessage = `${editingMessage.trim()}

— ${signature}`;
        setCustomMessage(combinedMessage);
        setIsEditingMessage(false);
        setEditingMessage('');
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
      const { error } = await resetShareMessage();
      if (error) {
        setError(error);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold">
            Collect Recipes
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Hero Message */}
          <div className="text-center space-y-2">
            <p className="text-gray-900 text-lg">
              You're about to create something incredible.
            </p>
            <p className="text-gray-600 text-sm">
              Send this link to everyone who loves them. They'll add their favorite recipes. 
              We'll turn it into a book they'll cook from forever.
            </p>
          </div>

          {/* Main Actions */}
          <div className="space-y-3">
            {/* Primary Action - Copy Link */}
            <Button
              onClick={handleCopyLink}
              className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                copied 
                  ? 'bg-[hsl(var(--brand-honey))] border-[hsl(var(--brand-honey))] text-black hover:bg-[hsl(var(--brand-honey))] hover:border-[hsl(var(--brand-honey))] hover:text-black' 
                  : 'bg-black text-white hover:bg-gray-800 border-black'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Link
                </>
              )}
            </Button>
            
            {/* Secondary Action - Customize Message */}
            {!showMessageCustomization && (
              <div className="text-center">
                <button
                  onClick={handleShowMessageCustomization}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Customize message
                </button>
              </div>
            )}
          </div>

          {/* Message Customization Section (Collapsible) */}
          {showMessageCustomization && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                  Your message to guests:
                </h3>
                {!isEditingMessage && (
                  <button
                    onClick={handleEditMessage}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-all flex items-center gap-1"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingMessage ? (
                <div className="space-y-3">
                  <textarea
                    value={editingMessage}
                    onChange={(e) => {
                      setEditingMessage(e.target.value);
                      setError(null);
                    }}
                    className="w-full p-4 bg-white border-2 border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors text-gray-900 leading-relaxed"
                    rows={4}
                    placeholder="Your message to guests..."
                    maxLength={300}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResetMessage}
                      disabled={isSaving}
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveMessage}
                      disabled={isSaving || editingMessage.trim().length === 0}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                    {shareMessage}
                  </p>
                </div>
              )}

              {/* Copy Link & Message when customizing */}
              <Button
                onClick={handleCopyLinkAndMessage}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Link & Message
              </Button>
            </div>
          )}

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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}