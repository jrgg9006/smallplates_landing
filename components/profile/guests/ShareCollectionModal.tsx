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
import { getGroupShareMessage, updateGroupShareMessage, resetGroupShareMessage } from "@/lib/supabase/groups";

interface ShareCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionUrl: string;
  userName: string | null;
  isOnboardingStep?: boolean;
  onStepComplete?: () => void;
  groupId?: string | null;
  coupleNames?: string | null;
}

export function ShareCollectionModal({ 
  isOpen, 
  onClose, 
  collectionUrl,
  userName,
  isOnboardingStep = false,
  onStepComplete,
  groupId = null,
  coupleNames = null
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
  }, [isOpen, groupId]);

  // Load custom message from group_members only (no profile fallback)
  const loadCustomMessage = async () => {
    try {
      // If no groupId, we can't load custom message - use default
      if (!groupId) {
        setCustomMessage(null);
        return;
      }

      // Always try to load custom message from group_members when groupId exists
      const { data: groupData, error: groupError } = await getGroupShareMessage(groupId);
      
      if (!groupError && groupData?.custom_share_message) {
        setCustomMessage(groupData.custom_share_message);
      } else {
        // No custom message found or error occurred - use default
        setCustomMessage(null);
      }
    } catch (err) {
      console.error('Error loading custom message:', err);
      setCustomMessage(null);
    }
  };

  // Default message using brand voice
  const coupleDisplayName = coupleNames || 'your friends';
  const defaultMessage = `You're adding a recipe to ${coupleDisplayName}'s wedding cookbook. Doesn't have to be fancy—just something you actually make. It'll live in their kitchen forever.`;
  
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


  const handleShowMessageCustomization = () => {
    setShowMessageCustomization(true);
    // Automatically start editing when customization is shown
    setEditingMessage(shareMessage);
    setIsEditingMessage(true);
    setError(null);
    
    // If this is an onboarding step, complete it when user clicks customize
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
      const signature = userName || '';
      
      // Only save to group_members (requires groupId)
      if (!groupId) {
        setError('Unable to save: no group selected');
        setIsSaving(false);
        return;
      }
      
      const result = await updateGroupShareMessage(groupId, editingMessage.trim(), signature);
      
      if (result.error) {
        setError(result.error);
      } else {
        setCustomMessage(editingMessage.trim());
        setIsEditingMessage(false);
        setShowMessageCustomization(false);
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
      // Only reset from group_members (requires groupId)
      if (!groupId) {
        setError('Unable to reset: no group selected');
        setIsSaving(false);
        return;
      }
      
      const result = await resetGroupShareMessage(groupId);
      
      if (result.error) {
        setError(result.error);
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
              You&apos;re about to create something incredible.
            </p>
            <p className="text-gray-600 text-sm">
              Send this link to everyone who loves them. They&apos;ll add their favorite recipes. 
              We&apos;ll turn it into a book they&apos;ll cook from forever.
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
              </div>
              
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
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${editingMessage.length > 280 ? 'text-red-500' : 'text-gray-400'}`}>
                    {editingMessage.length}/300
                  </span>
                <div className="flex gap-2">
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
              </div>

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