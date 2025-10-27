"use client";

import React, { useState } from "react";
import { Guest } from "@/lib/types/database";
import { Mail, ArrowUp, Trash2, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteGuestModal } from "./DeleteGuestModal";
import { SendMessageModal } from "./SendMessageModal";
import { archiveGuest } from "@/lib/supabase/guests";

interface MobileGuestCardProps {
  guest: Guest;
  onModalClose?: () => void;
  onGuestDeleted?: () => void;
  onAddRecipe?: (guest: Guest) => void;
  onRowClick?: (guest: Guest) => void;
}

// Status badge component for mobile
function MobileStatusBadge({ status }: { status: Guest["status"] }) {
  const styles = {
    pending: "bg-gray-100 text-gray-700",
    submitted: "bg-green-100 text-green-700", 
    reached_out: "bg-green-100 text-green-700",
  };

  const labels = {
    pending: "Pending",
    submitted: "Received",
    reached_out: "Reached Out",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium px-3 py-1 text-sm ${styles[status]}`}
    >
      {labels[status]}
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

  // Guest name display logic
  const fullName = `${guest.first_name} ${guest.last_name || ''}`.trim();
  const hasPrintedName = guest.printed_name && guest.printed_name.trim();
  const displayName = hasPrintedName ? guest.printed_name! : fullName;
  const showSubtitle = hasPrintedName;

  // Contact info validation
  const hasEmail = guest.email && guest.email.trim() && !guest.email.startsWith('NO_EMAIL_');
  const hasPhone = guest.phone && guest.phone.trim();
  const hasContactInfo = hasEmail || hasPhone;

  // Recipe count display
  const showRecipeCount = guest.status !== 'pending';

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
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
            <MobileStatusBadge status={guest.status} />
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="space-y-2">
          {/* Email */}
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600">
              {hasEmail ? guest.email : <span className="text-red-500">No email</span>}
            </span>
          </div>
          
          {/* Phone */}
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600">
              {hasPhone ? guest.phone : <span className="text-red-500">No mobile</span>}
            </span>
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
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteModal(true);
            }}
            title="Delete guest"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
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