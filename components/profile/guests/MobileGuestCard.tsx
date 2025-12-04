"use client";

import React, { useState, useEffect, useRef } from "react";
import { GuestSource, GuestWithMeta } from "@/lib/types/database";
import { Mail, ArrowUp, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteGuestModal } from "./DeleteGuestModal";
import { SendMessageModal } from "./SendMessageModal";
import { archiveGuest } from "@/lib/supabase/guests";
import Image from "next/image";
import { getGuestProfileIcon } from "@/lib/utils/profileIcons";

interface MobileGuestCardProps {
  guest: GuestWithMeta;
  onModalClose?: () => void;
  onGuestDeleted?: () => void;
  onAddRecipe?: (guest: GuestWithMeta) => void;
  onRowClick?: (guest: GuestWithMeta) => void;
}

// Status badge component for mobile
function MobileStatusBadge({ status, source }: { status: GuestWithMeta["status"]; source?: GuestSource | null }) {
  const styles = {
    pending: "bg-gray-100 text-gray-700",
    submitted: "bg-green-100 text-green-700", 
    reached_out: "bg-green-100 text-green-700",
  };

  const labels: Record<GuestWithMeta["status"], string> = {
    pending: "Pending",
    submitted: "Received",
    reached_out: "Reached Out",
  };

  const sourceLabels: Record<GuestSource, string> = {
    manual: "Added Manually",
    collection: "Collection Link",
  };

  const displayLabel =
    status === 'submitted' && source ? sourceLabels[source] : labels[status];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium px-3 py-1 text-sm ${styles[status]}`}
    >
      {displayLabel}
    </span>
  );
}

export function MobileGuestCard({ 
  guest, 
  onModalClose, 
  onGuestDeleted, 
  onAddRecipe,
  onRowClick 
}: MobileGuestCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Guest name display logic
  const fullName = `${guest.first_name} ${guest.last_name || ''}`.trim();
  const hasPrintedName = guest.printed_name && guest.printed_name.trim();
  const displayName = hasPrintedName ? guest.printed_name! : fullName;
  const showSubtitle = hasPrintedName;

  // Contact info validation
  const hasEmail = guest.email && guest.email.trim() && !guest.email.startsWith('NO_EMAIL_');
  const hasContactInfo = hasEmail;

  // Recipe count display
  const showRecipeCount = guest.status !== 'pending';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      const { error } = await archiveGuest(guest.id);
      
      if (error) {
        console.error('Error archiving guest:', error);
        setDeleting(false);
        return;
      }
      
      handleCloseDeleteModal();
      
      if (onGuestDeleted) {
        onGuestDeleted();
      }
      
    } catch (err) {
      console.error('Unexpected error archiving guest:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    if (onModalClose) {
      onModalClose();
    }
  };

  const handleSendMessage = () => {
    setShowMessageModal(true);
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    if (onModalClose) {
      onModalClose();
    }
  };

  const handleCardClick = () => {
    if (onRowClick) {
      onRowClick(guest);
    }
  };

  return (
    <>
      <div 
        className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleCardClick}
      >
        {/* Name Section */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-shrink-0">
                <Image
                  src={getGuestProfileIcon(guest.id, guest.is_self)}
                  alt="Chef profile icon"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              </div>
              <div>
                <div className="font-medium text-gray-900 text-base">
                  {displayName}
                </div>
                {showSubtitle && (
                  <div className="text-sm text-gray-500">
                    {fullName}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex-shrink-0">
            <MobileStatusBadge status={guest.status} source={guest.latest_recipe_source} />
          </div>
        </div>


        {/* Recipe Count (if applicable) */}
        {showRecipeCount && (
          <div className="text-xs text-gray-500">
            Recipes: {guest.recipes_received || 0}
          </div>
        )}

        {/* Actions Section */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-2 text-xs ${!hasContactInfo ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (hasContactInfo) {
                handleSendMessage();
              }
            }}
            disabled={!hasContactInfo}
            title={hasContactInfo ? "Send message" : "No contact info available"}
          >
            <Mail className="h-4 w-4" />
            Message
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              if (onAddRecipe) {
                onAddRecipe(guest);
              }
            }}
            title="Add recipe"
          >
            <ArrowUp className="h-4 w-4" />
            Add Recipe
          </Button>
          
          {/* 3 Dots Menu */}
          <div className="relative ml-auto" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center justify-center p-1 h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              title="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                <button
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    setShowDeleteModal(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <DeleteGuestModal
        isOpen={showDeleteModal}
        guestName={displayName}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <SendMessageModal
        guest={guest}
        isOpen={showMessageModal}
        onClose={handleCloseMessageModal}
      />
    </>
  );
}