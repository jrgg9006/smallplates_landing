"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GroupWithMembers } from "@/lib/types/database";
import { AlertTriangle } from "lucide-react";

interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupWithMembers | null;
  onConfirm: () => void;
  loading?: boolean;
  userRole?: string | null;
}

export function DeleteGroupModal({
  isOpen,
  onClose,
  group,
  onConfirm,
  loading = false,
  userRole = null,
}: DeleteGroupModalProps) {
  if (!group) return null;

  const isOwner = userRole === 'owner';
  const canDelete = isOwner;
  
  const actionText = canDelete ? "Delete Cookbook" : "Exit Cookbook";
  const warningText = canDelete 
    ? "This action cannot be undone. The cookbook, all its recipes, and the shared cookbook will be permanently deleted for ALL members."
    : "You will no longer be a member of this cookbook and won't have access to its recipes and shared cookbook. You can be re-invited later.";
  const buttonText = canDelete ? "Delete Cookbook" : "Exit Cookbook";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {actionText}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to {canDelete ? 'delete' : 'exit'}{' '}
              <span className="font-medium">&ldquo;{group.name}&rdquo;</span>?
            </p>
            <p className="text-sm text-gray-500">
              {warningText}
            </p>
          </div>
          
          {canDelete && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> This will affect all {group.member_count} member{group.member_count !== 1 ? 's' : ''} of this cookbook.
              </p>
            </div>
          )}

          {!canDelete && userRole && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> As a {userRole}, you can only exit the cookbook. Contact the cookbook owner to delete the entire cookbook.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons — standardized modal footer */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full rounded-full border border-[rgba(45,45,45,0.14)] py-3.5 text-[15px] font-medium text-brand-charcoal transition-colors hover:bg-[rgba(45,45,45,0.03)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.18)] focus-visible:ring-offset-2 disabled:opacity-50 sm:flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full rounded-full bg-brand-charcoal py-3.5 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 disabled:opacity-50 sm:flex-1"
          >
            {loading ? (canDelete ? 'Deleting...' : 'Exiting...') : buttonText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}