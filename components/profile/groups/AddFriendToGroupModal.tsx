"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserPlus, Copy, Check } from "lucide-react";
import type { GroupWithMembers } from "@/lib/types/database";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddFriendToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupWithMembers | null;
  onInviteSent?: () => void;
}

export function AddFriendToGroupModal({ isOpen, onClose, group, onInviteSent }: AddFriendToGroupModalProps) {
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    relationship: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  // Reset form when modal opens and check email verification
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        email: '',
        relationship: '',
      });
      setError(null);
      setLinkCopied(false);
      
      // Check email verification status
      const checkEmailVerification = async () => {
        if (user?.id) {
          try {
            const { data: profile } = await getCurrentProfile();
            setEmailVerified(profile?.email_verified || false);
          } catch (error) {
            console.error('Error checking email verification:', error);
            setEmailVerified(false);
          }
        }
      };
      
      checkEmailVerification();
    }
  }, [isOpen, user]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check email verification first
    if (emailVerified === false) {
      setError('Please verify your email address before inviting others. Check your inbox for the verification link.');
      return;
    }
    
    // Validate required fields
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!group?.id) {
      setError('Group information is missing');
      return;
    }

    try {
      setLoading(true);
      setError(null);


      // Send invitation via API
      const response = await fetch(`/api/v1/groups/${group.id}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          relationship: formData.relationship,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send invitation');
        return;
      }

      // Success! Just close the modal
      onClose();
      if (onInviteSent) {
        onInviteSent();
      }
    } catch (err) {
      console.error('Error sending invite:', err);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      // Generate shareable link for direct group joining
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const inviteLink = `${baseUrl}/groups/${group?.id}/join`;
      
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      
      // Reset the button text after 2 seconds
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Error copying invite link:', err);
      setError('Failed to copy invite link');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold">
            Invite a Captain
          </DialogTitle>
        </DialogHeader>
        
        {/* Explanation text */}
        <p className="text-xs sm:text-sm text-[#2D2D2D] leading-relaxed font-light mt-2">
          A captain will have full access to this book and can help you collect recipes together.
        </p>
        
        <div className="space-y-4 pt-4 pb-2">
          {/* Name Field */}
          <div>
            <Label htmlFor="friendName" className="text-sm font-medium text-gray-600">
              Name *
            </Label>
            <Input
              id="friendName"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Friend's name"
              required
              disabled={loading}
              autoFocus
              className="mt-1"
            />
          </div>

          {/* Email Field */}
          <div>
            <Label htmlFor="friendEmail" className="text-sm font-medium text-gray-600">
              Email *
            </Label>
            <Input
              id="friendEmail"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="friend@email.com"
              required
              disabled={loading}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              An invitation to join will be sent to this email
            </p>
          </div>

          {/* Relationship Field */}
          <div>
            <Label htmlFor="relationship" className="text-sm font-medium text-gray-600">
              How does this Captain know the couple?
            </Label>
            <Select
              value={formData.relationship}
              onValueChange={(value) => handleInputChange('relationship', value)}
              disabled={loading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="bridesmaid">Bridesmaid</SelectItem>
                <SelectItem value="wedding-planner">Wedding Planner</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Copy Invite Link Button */}
          <div>
            <Label className="text-sm font-medium text-gray-600 mb-3 block">
              Or share invite link
            </Label>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyInviteLink}
              className={`w-full flex items-center gap-2 transition-colors mb-2 ${
                linkCopied ? 'text-green-700 border-green-700 hover:bg-green-50' : ''
              }`}
              disabled={loading || linkCopied}
            >
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Invite Link
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button 
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendInvite}
            className="bg-black text-white hover:bg-gray-800"
            disabled={loading || !formData.name.trim() || !formData.email.trim()}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {loading ? 'Sending...' : 'Send Invite'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}