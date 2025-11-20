"use client";

import React from "react";
import { Plus, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddGroupDropdownProps {
  onCreateNewGroup: () => void;
  onInviteFriend: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export function AddGroupDropdown({
  onCreateNewGroup,
  onInviteFriend,
  disabled = false,
  className,
  title = "Group actions"
}: AddGroupDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={disabled}
          className={cn(
            "bg-teal-600 text-white hover:bg-teal-700",
            "rounded-full w-16 h-16", 
            "flex items-center justify-center",
            "shadow-lg hover:shadow-xl transition-shadow",
            "p-0",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg",
            className
          )}
          title={title}
        >
          <Plus className="h-12 w-12" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-70">
        <DropdownMenuItem onClick={onCreateNewGroup}>
          <Plus className="h-4 w-4 mr-2" />
          Create new cookbook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onInviteFriend}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite a friend to this Cookbook
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}