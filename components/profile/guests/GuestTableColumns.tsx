"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Mail, Trash2, ArrowUp } from "lucide-react";
import { Guest } from "@/lib/types/database";
import { useState } from "react";
import { DeleteGuestModal } from "./DeleteGuestModal";
import { Button } from "@/components/ui/button";
import { SendMessageModal } from "./SendMessageModal";
import { archiveGuest } from "@/lib/supabase/guests";
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
      <div className="flex justify-end items-center gap-1" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
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
        <Button
          variant="ghost"
          className="h-12 w-12"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            setShowDeleteModal(true);
          }}
          aria-label="Delete guest"
          title="Delete guest"
        >
          <Trash2 className="h-8 w-8" />
        </Button>
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
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
        className="h-4 w-4 rounded border-gray-200 text-gray-600 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(e.target.checked)}
        onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
        className="h-4 w-4 rounded border-gray-200 text-gray-600 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent border-0 shadow-none table-header-style justify-start"
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
          <div className="space-y-1">
            <div className="font-normal text-lg">
              {guest.printed_name}
            </div>
            <div className="text-sm text-gray-500">
              {fullName}
            </div>
          </div>
        );
      }
      
      return <div className="font-normal text-lg">{fullName}</div>;
    },
  },
  {
    id: "contact",
    header: () => <div className="table-header-style">Email</div>,
    cell: ({ row }) => {
      const guest = row.original;
      return (
        <div className="text-normal">
          {guest.email && guest.email.trim() && !guest.email.startsWith('NO_EMAIL_') ? (
            guest.email
          ) : (
            <span className="text-red-500">No email</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="table-header-style">Recipe Status</div>,
    cell: ({ row }) => {
      const guest = row.original;
      const status = row.getValue("status") as Guest["status"];
      const showRecipeCount = status !== 'pending';
      
      return (
        <div className="flex flex-col justify-center space-y-1 h-full">
          <div>
            <StatusBadge status={status} />
          </div>
          {showRecipeCount && (
            <div className="text-xs text-gray-500">
              Recipes: {guest.recipes_received || 0}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
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