"use client";

import React, { useState } from "react";
import { Search, ChevronDown, Users, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddRecipeDropdown } from "@/components/ui/AddRecipeDropdown";
import { GroupMembersDropdown } from "./GroupMembersDropdown";
import { GroupActionsDropdown } from "./GroupActionsDropdown";
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
  onDeleteGroup: () => void;
  onExitGroup: () => void;
  userRole?: string | null;
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
  onAddNewRecipe,
  onDeleteGroup,
  onExitGroup,
  userRole
}: GroupRecipeTableControlsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleGroupChange = (group: GroupWithMembers) => {
    onGroupChange(group);
    setIsDropdownOpen(false);
  };
  return (
    <div className="py-4">
      {/* Desktop Layout - Large screens (1024px+) */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-8">
            {/* Group Selector */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 min-w-[200px] justify-between"
              >
                <span className="truncate">
                  {selectedGroup ? selectedGroup.name : 'Select Cookbook'}
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
                        Create New Cookbook
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
                placeholder="Search recipes in this cookbook..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-6 w-96 bg-transparent border-0 border-b border-gray-300 rounded-none focus:border-gray-900 focus:ring-0 pb-2"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Add Recipe Dropdown */}
            <AddRecipeDropdown
              buttonText="Add a Recipe to this Cookbook"
              onAddExistingRecipe={onAddExistingRecipe}
              onAddNewRecipe={onAddNewRecipe}
            />

            {/* Group Actions Dropdown - Three dots menu */}
            {selectedGroup && (
              <GroupActionsDropdown
                group={selectedGroup}
                userRole={userRole}
                onDeleteGroup={onDeleteGroup}
                onExitGroup={onExitGroup}
              />
            )}
          </div>
        </div>
      </div>

      {/* Medium Screen Layout - Tablets (768px-1023px) */}
      <div className="hidden md:block lg:hidden">
        <div className="space-y-3">
          {/* Top Row: Group Selector, Members, and Search */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Group Selector */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 min-w-[160px] justify-between"
              >
                <span className="truncate">
                  {selectedGroup ? selectedGroup.name : 'Select Cookbook'}
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
                        Create New Cookbook
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
            {selectedGroup && (
              <div className="flex-shrink-0">
                <GroupMembersDropdown group={selectedGroup} onInviteFriend={onInviteFriend} />
              </div>
            )}

            {/* Search Input - Flexible width */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search recipes..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-6 w-full bg-transparent border-0 border-b border-gray-300 rounded-none focus:border-gray-900 focus:ring-0 pb-2"
              />
            </div>
          </div>

          {/* Bottom Row: Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Add Recipe Dropdown - Shorter text for medium screens */}
            <AddRecipeDropdown
              buttonText="Add Recipe"
              onAddExistingRecipe={onAddExistingRecipe}
              onAddNewRecipe={onAddNewRecipe}
            />

            {/* Group Actions Dropdown - Three dots menu */}
            {selectedGroup && (
              <GroupActionsDropdown
                group={selectedGroup}
                userRole={userRole}
                onDeleteGroup={onDeleteGroup}
                onExitGroup={onExitGroup}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="space-y-4">
          {/* Group Selector - Full Width */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              <span className="truncate text-left">
                {selectedGroup ? selectedGroup.name : 'Select Cookbook'}
              </span>
              <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-400" />
            </button>
            
            {isDropdownOpen && (
              <>
                <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handleGroupChange(group)}
                      className={`w-full px-4 py-3 text-left text-base hover:bg-gray-50 flex items-center gap-3 ${
                        selectedGroup?.id === group.id
                          ? 'bg-gray-50 text-gray-900 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      <Users className="h-5 w-5 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{group.name}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-200 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onCreateGroup();
                      }}
                      className="w-full px-4 py-3 text-left text-base text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Plus className="h-5 w-5 text-gray-400" />
                      Create New Cookbook
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

          {/* Members and Search Row */}
          <div className="flex gap-3">
            {/* Members Dropdown */}
            {selectedGroup && (
              <div className="flex-shrink-0">
                <GroupMembersDropdown group={selectedGroup} onInviteFriend={onInviteFriend} />
              </div>
            )}

            {/* Search Input - Full width */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search recipes..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-base"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Add Recipe Button - Full Width */}
            <AddRecipeDropdown
              buttonText="Add a Recipe to this Cookbook"
              onAddExistingRecipe={onAddExistingRecipe}
              onAddNewRecipe={onAddNewRecipe}
              className="w-full"
            />

            {/* Group Actions - Centered */}
            {selectedGroup && (
              <div className="flex justify-center">
                <GroupActionsDropdown
                  group={selectedGroup}
                  userRole={userRole}
                  onDeleteGroup={onDeleteGroup}
                  onExitGroup={onExitGroup}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}