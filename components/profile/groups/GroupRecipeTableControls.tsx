"use client";

import React, { useState } from "react";
import { Search, ChevronDown, Users, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddRecipeDropdown } from "@/components/ui/AddRecipeDropdown";
import { GroupMembersDropdown } from "./GroupMembersDropdown";
import { GroupWithMembers } from "@/lib/types/database";

interface GroupRecipeTableControlsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  groups: GroupWithMembers[];
  selectedGroup: GroupWithMembers | null;
  onGroupChange: (group: GroupWithMembers) => void;
  onCreateGroup: () => void;
  onInviteFriend: () => void;
  onAddExistingRecipe: () => void;
  onAddNewRecipe: () => void;
}

export function GroupRecipeTableControls({ 
  searchValue, 
  onSearchChange,
  groups,
  selectedGroup,
  onGroupChange,
  onCreateGroup,
  onInviteFriend,
  onAddExistingRecipe,
  onAddNewRecipe
}: GroupRecipeTableControlsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleGroupChange = (group: GroupWithMembers) => {
    onGroupChange(group);
    setIsDropdownOpen(false);
  };
  return (
    <div className="py-4">
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-8">
            {/* Group Selector */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 min-w-[200px] justify-between"
              >
                <span className="truncate">
                  {selectedGroup ? selectedGroup.name : 'Select Group'}
                </span>
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              </button>
              
              {isDropdownOpen && (
                <>
                  <div className="absolute top-12 left-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => handleGroupChange(group)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                          selectedGroup?.id === group.id
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{group.name}</span>
                      </button>
                    ))}
                    <div className="border-t border-gray-200 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onCreateGroup();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create New Group
                      </button>
                    </div>
                  </div>
                  {/* Overlay to close dropdown */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                </>
              )}
            </div>

            {/* Members Dropdown */}
            {selectedGroup && <GroupMembersDropdown group={selectedGroup} onInviteFriend={onInviteFriend} />}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search recipes in this group..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-6 w-96 bg-transparent border-0 border-b border-gray-300 rounded-none focus:border-gray-900 focus:ring-0 pb-2"
              />
            </div>
          </div>

          {/* Add Recipe Dropdown */}
          <AddRecipeDropdown
            buttonText="Add a Recipe to this Group"
            onAddExistingRecipe={onAddExistingRecipe}
            onAddNewRecipe={onAddNewRecipe}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Group Selector, Members and Search */}
        <div className="flex gap-3">
          {/* Group Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 min-w-[140px] justify-between"
            >
              <span className="truncate">
                {selectedGroup ? selectedGroup.name : 'Group'}
              </span>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </button>
            
            {isDropdownOpen && (
              <>
                <div className="absolute top-12 left-0 w-60 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handleGroupChange(group)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                        selectedGroup?.id === group.id
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{group.name}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-200 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onCreateGroup();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Group
                    </button>
                  </div>
                </div>
                {/* Overlay to close dropdown */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)}
                />
              </>
            )}
          </div>

          {/* Members Dropdown */}
          {selectedGroup && <GroupMembersDropdown group={selectedGroup} onInviteFriend={onInviteFriend} />}

          {/* Search Input - Full width */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search recipes in this group..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Add Recipe Dropdown */}
          <AddRecipeDropdown
            buttonText="Add a Recipe to this Group"
            onAddExistingRecipe={onAddExistingRecipe}
            onAddNewRecipe={onAddNewRecipe}
          />
        </div>
      </div>
    </div>
  );
}