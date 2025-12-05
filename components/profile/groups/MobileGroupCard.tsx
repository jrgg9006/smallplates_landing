"use client";

import React, { useState, useRef, useEffect } from "react";
import { GroupWithMembers } from "@/lib/types/database";
import { Users, MoreHorizontal, Pencil, Trash2, UserPlus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getGuestProfileIcon } from "@/lib/utils/profileIcons";

interface MobileGroupCardProps {
  group: GroupWithMembers;
  isSelected?: boolean;
  onGroupClick?: (group: GroupWithMembers) => void;
  onEditGroup?: (group: GroupWithMembers) => void;
  onDeleteGroup?: (group: GroupWithMembers) => void;
  onExitGroup?: (group: GroupWithMembers) => void;
  onInviteFriend?: (group: GroupWithMembers) => void;
  userRole?: string | null;
}

export function MobileGroupCard({ 
  group,
  isSelected = false,
  onGroupClick,
  onEditGroup,
  onDeleteGroup,
  onExitGroup,
  onInviteFriend,
  userRole
}: MobileGroupCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOwner = userRole === 'owner';
  const canEdit = isOwner;
  const canDelete = isOwner;
  const canInvite = !!userRole; // All members can invite

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

  const handleCardClick = () => {
    if (onGroupClick) {
      onGroupClick(group);
    }
  };

  const memberCount = group.member_count || 0;
  const recipeCount = group.recipe_count || 0;
  
  // Get owner information
  const owner = group.group_members?.find(m => m.role === 'owner')?.profiles;
  const ownerName = owner?.full_name || 'you';
  const ownerId = owner?.id || group.created_by;
  
  // Determine if current user is the owner (for profile icon)
  // We'll use the owner's profile ID for the icon
  const isCurrentUserOwner = userRole === 'owner';

  return (
    <>
      <div 
        className={`bg-white border rounded-lg p-4 space-y-3 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
          isSelected 
            ? 'border-gray-900 shadow-md' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }`}
        onClick={handleCardClick}
      >
        {/* Name Section - Profile Image + Owner Name */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-shrink-0">
                <Image
                  src={getGuestProfileIcon(ownerId, isCurrentUserOwner)}
                  alt="Owner profile icon"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              </div>
              <div>
                <div className="font-medium text-gray-900 text-base">
                  {ownerName}
                </div>
                <div className="text-sm text-gray-500">
                  Created this cookbook
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px] py-1">
                    {canEdit && (
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 first:rounded-t-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          onEditGroup?.(group);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit cookbook
                      </button>
                    )}
                    
                    {canInvite && (
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          onInviteFriend?.(group);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                        Invite friend
                      </button>
                    )}

                    {!canDelete && (
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          onExitGroup?.(group);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Leave cookbook
                      </button>
                    )}

                    {canDelete && (
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 last:rounded-b-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(false);
                          onDeleteGroup?.(group);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete cookbook
                      </button>
                    )}
                  </div>
                  
                  {/* Overlay to close dropdown */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDropdown(false)}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Book Name */}
        <div>
          <div className="text-sm font-medium text-gray-600 mb-1">Cookbook</div>
          <div className="text-base text-gray-900">{group.name}</div>
        </div>

        {/* Description (if available) */}
        {group.description && (
          <div>
            <div className="text-sm text-gray-600 line-clamp-2">
              {group.description}
            </div>
          </div>
        )}

        {/* Stats Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{memberCount}</span>
            </div>
            <div className="text-xs text-gray-400">•</div>
            <span>{recipeCount} recipe{recipeCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            {group.visibility === 'public' && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Public
              </span>
            )}
            {isSelected && (
              <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}