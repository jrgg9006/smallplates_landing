"use client";

import React, { useState, useEffect, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Mail, Trash2, ArrowUp, MoreHorizontal } from "lucide-react";
import { Guest } from "@/lib/types/database";
import { DeleteGuestModal } from "./DeleteGuestModal";
import { Button } from "@/components/ui/button";
import { SendMessageModal } from "./SendMessageModal";
import { archiveGuest } from "@/lib/supabase/guests";
import Image from "next/image";
import { getGuestProfileIcon } from "@/lib/utils/profileIcons";
import "@/lib/types/table";

// Status badge component
function StatusBadge({ status }: { status: Guest["status"] }) {
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

  const sizeClasses = {
    pending: "px-3 py-1 text-sm",
    submitted: "px-3 py-1 text-sm",
    reached_out: "px-2.5 py-0.5 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        styles[status]
      } ${sizeClasses[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// Actions cell component  
function ActionsCell({ guest, onModalClose, onGuestDeleted, onAddRecipe }: { 
  guest: Guest; 
  onModalClose?: () => void; 
  onGuestDeleted?: () => void;
  onAddRecipe?: (guest: Guest) => void;
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      const { error } = await archiveGuest(guest.id);
      
      if (error) {
        console.error('Error archiving guest:', error);
        // You could show a toast notification here
        setDeleting(false);
        return;
      }
      
      // Success! Close modal and refresh the guest list
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
    // Signal that a modal is closing to prevent row click
    if (onModalClose) {
      onModalClose();
    }
  };

  const handleSendMessage = () => {
    setShowMessageModal(true);
  };

  // Check if guest has any contact information
  const hasContactInfo = (guest.email && guest.email.trim() && !guest.email.startsWith('NO_EMAIL_'));

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

  const handleCloseMessageModal = () => {
    console.log('SendMessageModal closing, calling onModalClose');
    setShowMessageModal(false);
    // Signal that a modal is closing to prevent row click
    if (onModalClose) {
      onModalClose();
    }
  };

  return (
    <>
      <div className="flex justify-end items-center gap-1 pr-4" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
        <Button
          variant="ghost"
          className={`h-12 w-12 ${!hasContactInfo ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            if (hasContactInfo) {
              handleSendMessage();
            }
          }}
          disabled={!hasContactInfo}
          aria-label={hasContactInfo ? "Send message" : "No contact info available"}
          title={hasContactInfo ? "Send message" : "No contact info available"}
        >
          <Mail className="h-8 w-8" />
        </Button>
        <Button
          variant="ghost"
          className="h-12 w-12"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            if (onAddRecipe) {
              onAddRecipe(guest);
            }
          }}
          aria-label="Add recipe"
          title="Add recipe"
        >
          <ArrowUp className="h-8 w-8" />
        </Button>
        {/* 3 Dots Menu */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            className="h-12 w-12"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            aria-label="More options"
            title="More options"
          >
            <MoreHorizontal className="h-8 w-8" />
          </Button>
          
          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
              <button
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
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

      <DeleteGuestModal
        isOpen={showDeleteModal}
        guestName={`${guest.first_name} ${guest.last_name || ''}`.trim()}
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

export const columns: ColumnDef<Guest>[] = [
  {
    accessorKey: "updated_at",
    header: "Last Updated",
    // Hidden column for sorting - we don't display it but use it for sorting
    enableHiding: true,
    meta: {
      hidden: true,
    },
  },
  {
    id: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent border-0 shadow-none table-header-style justify-start pl-4"
        >
          <span className="table-header-style">Name</span>
          <ArrowUpDown className="ml-2 h-3 w-3 text-white opacity-70" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const guest = row.original;
      const fullName = `${guest.first_name} ${guest.last_name || ''}`.trim();
      const hasPrintedName = guest.printed_name && guest.printed_name.trim();
      
      if (hasPrintedName) {
        return (
          <div className="flex items-center gap-3 pl-4">
            <div className="flex-shrink-0">
              <Image
                src={getGuestProfileIcon(guest.id, guest.is_self)}
                alt="Chef profile icon"
                width={56}
                height={56}
                className="rounded-full"
              />
            </div>
            <div className="space-y-1">
              <div className="font-normal text-lg">
                {guest.printed_name}
              </div>
              <div className="text-sm text-gray-500">
                {fullName}
              </div>
            </div>
          </div>
        );
      }
      
      return (
        <div className="flex items-center gap-3 pl-4">
          <div className="flex-shrink-0">
            <Image
              src={getGuestProfileIcon(guest.id, guest.is_self)}
              alt="Chef profile icon"
              width={56}
              height={56}
              className="rounded-full"
            />
          </div>
          <div className="font-normal text-lg">{fullName}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="table-header-style text-center">Recipe Status</div>,
    cell: ({ row }) => {
      const guest = row.original;
      const status = row.getValue("status") as Guest["status"];
      
      return (
        <div className="flex items-center justify-center h-full w-full">
          <StatusBadge status={status} />
        </div>
      );
    },
  },
  {
    accessorKey: "recipes_received",
    header: () => <div className="table-header-style text-center">Recipes</div>,
    cell: ({ row }) => {
      const guest = row.original;
      const recipeCount = guest.recipes_received || 0;
      
      return (
        <div className="flex items-center justify-center h-full w-full">
          <span className="text-sm font-medium text-gray-900">
            {recipeCount}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="table-header-style text-right pr-4">Actions</div>,
    cell: ({ row, table }) => {
      const guest = row.original;
      const onModalClose = table.options.meta?.onModalClose;
      const onGuestDeleted = table.options.meta?.onGuestDeleted;
      const onAddRecipe = table.options.meta?.onAddRecipe;
      return <ActionsCell guest={guest} onModalClose={onModalClose} onGuestDeleted={onGuestDeleted} onAddRecipe={onAddRecipe} />;
    },
    enableSorting: false,
    enableHiding: false,
  },
];