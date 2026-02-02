"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Upload, X, Image as ImageIcon } from "lucide-react";
import { getGroupShareMessage, updateGroupShareMessage, resetGroupShareMessage } from "@/lib/supabase/groups";
import Image from "next/image";

interface ShareCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionUrl: string;
  userName: string | null;
  isOnboardingStep?: boolean;
  onStepComplete?: () => void;
  groupId?: string | null;
  coupleNames?: string | null;
  currentCoupleImage?: string | null;
}

export function ShareCollectionModal({ 
  isOpen, 
  onClose, 
  collectionUrl,
  userName,
  isOnboardingStep = false,
  onStepComplete,
  groupId = null,
  coupleNames = null,
  currentCoupleImage = null
}: ShareCollectionModalProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showMessageCustomization, setShowMessageCustomization] = useState(false);
  
  // Image upload state
  const [coupleImage, setCoupleImage] = useState<string | null>(currentCoupleImage);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Load custom message when modal opens
  useEffect(() => {
    if (isOpen && !isEditingMessage) {
      loadCustomMessage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, groupId]);

  // Sync couple image state when modal opens or currentCoupleImage changes
  useEffect(() => {
    setCoupleImage(currentCoupleImage);
  }, [currentCoupleImage, isOpen]);

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

  // Image upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      // Reset input on error
      event.target.value = '';
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      // Reset input on error
      event.target.value = '';
      return;
    }

    // Clear previous file and error
    setSelectedFile(file);
    setError(null);
    
    // Auto-upload the file
    handleUploadImage(file);
  };

  const handleImageClick = () => {
    const input = document.getElementById('coupleImageInput') as HTMLInputElement;
    if (input) {
      // Reset input value before clicking to ensure onChange always fires
      input.value = '';
      // Use click() method directly
      input.click();
    } else {
      console.error('coupleImageInput not found');
    }
  };

  const handleUploadImage = async (file?: File) => {
    const fileToUpload = file || selectedFile;
    if (!fileToUpload || !groupId) {
      setError('No file selected or group not found');
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', fileToUpload);

      const response = await fetch(`/api/v1/groups/${groupId}/couple-image`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to upload image');
        return;
      }

      setCoupleImage(result.url);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('coupleImageInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!groupId) {
      setError('Group not found');
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/groups/${groupId}/couple-image`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to delete image');
        return;
      }

      setCoupleImage(null);
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById('coupleImageInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err) {
      setError('Failed to delete image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${
        showMessageCustomization ? 'lg:max-w-[900px]' : 'sm:max-w-[500px]'
      } transition-all duration-300 max-h-[90vh] flex flex-col`}>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold">
            Collect Recipes
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 overflow-y-auto flex-1 -mx-6 px-6">
          {!showMessageCustomization ? (
            /* Normal single-column layout */
            <div className="space-y-6">e
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
                
                {/* Secondary Actions */}
                <div className="text-center space-y-2">
                  <button
                    onClick={handleShowMessageCustomization}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors block mx-auto"
                  >
                    Customize message
                  </button>
                </div>
              </div>

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
            </div>
          ) : (
            /* Expanded layout - responsive for mobile */
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-4 lg:space-y-6">
                {/* Hero Message */}
                <div className="text-left space-y-2">
                  <p className="text-gray-900 text-lg">
                    You&apos;re about to create something incredible.
                  </p>
                  <p className="text-gray-600 text-sm">
                    Send this link to everyone who loves them. They&apos;ll add their favorite recipes. 
                    We&apos;ll turn it into a book they&apos;ll cook from forever.
                  </p>
                </div>

                {/* Copy Link Button */}
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

                {/* Customize Message Link */}
                <div className="text-left">
                  <button
                    onClick={handleShowMessageCustomization}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Customize message
                  </button>
                </div>
              </div>

              {/* Right Column - Image Upload + Message Customization */}
              <div className="lg:col-span-3 space-y-4 lg:space-y-6">
                {/* Couple Image Section */}
                {groupId && (
                  <div className="space-y-4">
                    {/* Current Image Display */}
                    {coupleImage ? (
                      <div className="space-y-3">
                        <div className="relative w-full h-32 lg:h-40 bg-gray-100 rounded-xl overflow-hidden">
                          <Image
                            key={coupleImage}
                            src={coupleImage}
                            alt="Couple"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteImage();
                            }}
                            disabled={isUploadingImage}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleImageClick();
                            }}
                            disabled={isUploadingImage}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Change
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Upload UI when no image */
                      <div className="space-y-3">
                        <div 
                          className="border-2 border-dashed border-gray-300 rounded-xl p-6 lg:p-8 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleImageClick();
                          }}
                        >
                          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-600 mb-1 font-medium">
                            Add couple image
                          </p>
                          <p className="text-xs text-gray-500">
                            Click to upload (JPEG, PNG, WebP • max 5MB)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* File Input (Hidden) */}
                    <input
                      id="coupleImageInput"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Upload Status */}
                    {isUploadingImage && (
                      <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          Uploading...
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Message Customization Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
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
                      className="w-full p-3 lg:p-4 bg-white border-2 border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors text-gray-900 leading-relaxed"
                      rows={5}
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

                  {/* Preview Link in Right Column */}
                  <div className="pt-2">
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
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}