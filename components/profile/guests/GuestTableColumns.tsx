"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Mail, Trash2 } from "lucide-react";
import { Guest } from "@/lib/types/guest";
import { useState } from "react";
import { DeleteGuestModal } from "./DeleteGuestModal";
import { Button } from "@/components/ui/button";
import { SendMessageModal } from "./SendMessageModal";
import "@/lib/types/table";

// Status badge component
function StatusBadge({ status }: { status: Guest["recipeStatus"] }) {
  const styles = {
    not_invited: "bg-gray-100 text-gray-700",
    invited: "bg-yellow-100 text-yellow-700",
    submitted: "bg-green-100 text-green-700",
  };

  const labels = {
    not_invited: "Not Invited",
    invited: "Invited",
    submitted: "Submitted",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[status]
      }`}
    >
      {labels[status]}
    </span>
  );
}

// Actions cell component  
function ActionsCell({ guest, onModalClose }: { guest: Guest; onModalClose?: () => void }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const handleDelete = () => {
    // In production, this would call an API to delete the guest
    console.log("Deleting guest:", guest.id);
    setShowDeleteModal(false);
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

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    // Signal that a modal is closing to prevent row click
    if (onModalClose) {
      onModalClose();
    }
  };

  return (
    <>
      <div className="flex justify-end items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            handleSendMessage();
          }}
          aria-label="Send message"
          title="Send message"
        >
          <Mail className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteModal(true);
          }}
          aria-label="Delete guest"
          title="Delete guest"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <DeleteGuestModal
        isOpen={showDeleteModal}
        guestName={guest.name}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDelete}
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
        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-2 focus:ring-black focus:ring-offset-2"
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(e.target.checked)}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-2 focus:ring-black focus:ring-offset-2"
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Name
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    id: "contact",
    header: "Email & Phone",
    cell: ({ row }) => {
      const guest = row.original;
      return (
        <div className="space-y-1">
          <div className="text-sm">{guest.email}</div>
          {guest.phone && (
            <div className="text-xs text-gray-500">{guest.phone}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "recipeStatus",
    header: "Recipe Status",
    cell: ({ row }) => {
      return <StatusBadge status={row.getValue("recipeStatus")} />;
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const guest = row.original;
      const onModalClose = table.options.meta?.onModalClose;
      return <ActionsCell guest={guest} onModalClose={onModalClose} />;
    },
    enableSorting: false,
    enableHiding: false,
  },
];