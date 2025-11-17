"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { GroupWithMembers } from "@/lib/types/database";

interface GroupSelectorProps {
  groups: GroupWithMembers[];
  selectedGroup: GroupWithMembers | null;
  onGroupChange: (group: GroupWithMembers) => void;
}

export function GroupSelector({ groups, selectedGroup, onGroupChange }: GroupSelectorProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 min-w-[200px] justify-between">
          <span className="truncate">
            {selectedGroup ? selectedGroup.name : "Select a group"}
          </span>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[250px]">
        {groups.map((group) => (
          <DropdownMenuItem
            key={group.id}
            onClick={() => onGroupChange(group)}
            className="flex flex-col items-start gap-1 py-3 cursor-pointer"
          >
            <div className="font-medium">{group.name}</div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span>{group.member_count || 0} members</span>
              <span>•</span>
              <span>{group.visibility}</span>
            </div>
            {group.description && (
              <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                {group.description}
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}