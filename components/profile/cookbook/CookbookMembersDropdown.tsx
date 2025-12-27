"use client";

import React, { useState, useEffect, useRef } from "react";
import { Users, Crown, Shield, User as UserIcon, UserPlus, Mail, MoreHorizontal, RotateCcw, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getGroupMembers } from "@/lib/supabase/groupMembers";
import { getGroupPendingInvitations, type GroupInvitation } from "@/lib/supabase/groupInvitations";
import type { GroupMemberWithProfile, Cookbook } from "@/lib/types/database";

interface CookbookMembersDropdownProps {
  cookbook: Cookbook;
  onInviteFriend?: () => void;
}

export function CookbookMembersDropdown({ cookbook, onInviteFriend }: CookbookMembersDropdownProps) {
  // console.log removed for production
  const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [dropdownPositions, setDropdownPositions] = useState<{ [key: string]: { top: number; right: number } }>({});
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    if (cookbook.is_group_cookbook && cookbook.group_id) {
      loadMembers();
      loadPendingInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookbook.group_id, cookbook.is_group_cookbook]);

  const loadMembers = async () => {
    if (!cookbook.group_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await getGroupMembers(cookbook.group_id);
      
      if (error) {
        console.error('Error loading cookbook members:', error);
        return;
      }
      
      if (data) {
        setMembers(data);
        setMemberCount(data.length);
      }
    } catch (err) {
      console.error('Error loading cookbook members:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    if (!cookbook.group_id) return;
    
    try {
      setLoadingInvitations(true);
      const { data, error } = await getGroupPendingInvitations(cookbook.group_id);
      
      if (error) {
        console.error('Error loading pending invitations:', error);
        return;
      }
      
      if (data) {
        setPendingInvitations(data);
      }
    } catch (err) {
      console.error('Error loading pending invitations:', err);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    // console.log removed for production
    setActionLoading(invitationId);
    setOpenMenuId(null);
    
    try {
      const response = await fetch(`/api/v1/groups/${cookbook.group_id}/invitations/${invitationId}/resend`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Error: ${data.error || 'Failed to resend invitation'}`);
        return;
      }

      // console.log removed for production
    } catch (err) {
      console.error('Error resending invitation:', err);
      alert('Failed to resend invitation. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    // console.log removed for production
    if (!confirm('Are you sure you want to cancel this invitation? The person will no longer be able to join using the invitation link.')) {
      // console.log removed for production
      return;
    }
    // console.log removed for production

    setActionLoading(invitationId);
    setOpenMenuId(null);
    
    try {
      const response = await fetch(`/api/v1/groups/${cookbook.group_id}/invitations/${invitationId}`, {
        method: 'PATCH',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`Error: ${data.error || 'Failed to cancel invitation'}`);
        return;
      }

      await loadPendingInvitations();
      // console.log removed for production
    } catch (err) {
      console.error('Error canceling invitation:', err);
      alert('Failed to cancel invitation. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>, invitationId: string) => {
    e.stopPropagation();
    
    if (openMenuId === invitationId) {
      setOpenMenuId(null);
      setDropdownPositions(prev => {
        const newPositions = { ...prev };
        delete newPositions[invitationId];
        return newPositions;
      });
    } else {
      if (openMenuId) {
        setOpenMenuId(null);
      }
      
      const button = e.currentTarget;
      const buttonRect = button.getBoundingClientRect();
      const estimatedDropdownHeight = 80;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const rightPosition = window.innerWidth - buttonRect.right;
      
      let topPosition: number;
      if (spaceBelow < estimatedDropdownHeight + 10 && spaceAbove > estimatedDropdownHeight + 10) {
        topPosition = buttonRect.top - estimatedDropdownHeight - 4;
      } else {
        topPosition = buttonRect.bottom + 4;
      }
      
      setDropdownPositions(prev => ({
        ...prev,
        [invitationId]: { top: topPosition, right: rightPosition }
      }));
      
      setOpenMenuId(invitationId);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId]?.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-3 w-3 text-blue-600" />;
      default:
        return <UserIcon className="h-3 w-3 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      default:
        return 'Member';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-yellow-700';
      case 'admin':
        return 'text-blue-700';
      default:
        return 'text-gray-600';
    }
  };

  // Group members by role for display
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 };
    const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
    const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 3;
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    // Within same role, sort alphabetically by name
    const aName = a.profiles?.full_name || a.profiles?.email || '';
    const bName = b.profiles?.full_name || b.profiles?.email || '';
    return aName.localeCompare(bName);
  });

  // Don't show dropdown if it's not a group cookbook
  if (!cookbook.is_group_cookbook || !cookbook.group_id) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2" disabled={loading}>
          <Users className="h-4 w-4" />
          <span>Members ({memberCount})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Cookbook Members
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <>
            <DropdownMenuItem disabled>
              <div className="text-sm text-gray-500">Loading members...</div>
            </DropdownMenuItem>
            
            {/* Invite Friend Option */}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onInviteFriend}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50"
            >
              <UserPlus className="h-4 w-4" />
              Add someone to this cookbook
            </DropdownMenuItem>
          </>
        ) : sortedMembers.length === 0 ? (
          <>
            <DropdownMenuItem disabled>
              <div className="text-sm text-gray-500">No members found</div>
            </DropdownMenuItem>
            
            {/* Invite Friend Option */}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onInviteFriend}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50"
            >
              <UserPlus className="h-4 w-4" />
              Add someone to this cookbook
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {sortedMembers.map((member) => (
              <DropdownMenuItem key={member.profile_id} className="flex items-center gap-3 py-3 cursor-default">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getRoleIcon(member.role)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {member.profiles?.full_name || member.profiles?.email?.split('@')[0] || 'Unknown User'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={getRoleColor(member.role)}>
                        {getRoleLabel(member.role)}
                      </span>
                      {member.profiles?.email && (
                        <>
                          <span>•</span>
                          <span className="truncate">{member.profiles.email}</span>
                        </>
                      )}
                    </div>
                    {member.joined_at && (
                      <div className="text-xs text-gray-400 mt-1">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            
            {/* Invite Friend Option */}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onInviteFriend}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50"
            >
              <UserPlus className="h-4 w-4" />
              Add someone to this cookbook
            </DropdownMenuItem>
          </>
        )}

        {/* Pending Invitations Section */}
        {pendingInvitations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2 text-xs text-gray-500 font-normal">
              <Mail className="h-3 w-3" />
              Invited ({pendingInvitations.length})
            </DropdownMenuLabel>
            {loadingInvitations ? (
              <DropdownMenuItem disabled>
                <div className="text-sm text-gray-500">Loading invitations...</div>
              </DropdownMenuItem>
            ) : (
              pendingInvitations.map((invitation) => {
                const nameParts = invitation.name?.trim().split(' ') || [];
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                const isMenuOpen = openMenuId === invitation.id;
                const isLoading = actionLoading === invitation.id;
                
                return (
                  <DropdownMenuItem 
                    key={invitation.id} 
                    className="flex items-center gap-2 py-2 cursor-default relative"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-700 truncate">
                        {firstName} {lastName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {invitation.email}
                      </div>
                    </div>
                    <div className="relative flex-shrink-0" ref={(el) => { menuRefs.current[invitation.id] = el; }}>
                      <button
                        ref={(el) => { buttonRefs.current[invitation.id] = el; }}
                        type="button"
                        onClick={(e) => handleToggleMenu(e, invitation.id)}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        disabled={isLoading}
                        aria-label="Invitation options"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </DropdownMenuItem>
                );
              })
            )}
          </>
        )}
      </DropdownMenuContent>
      </DropdownMenu>

    {/* Render overlay and menus OUTSIDE DropdownMenu */}
    {openMenuId && (
      <div 
        className="fixed inset-0 z-[90]" 
        onClick={() => {
          setOpenMenuId(null);
          setDropdownPositions(prev => {
            const newPositions = { ...prev };
            if (openMenuId) {
              delete newPositions[openMenuId];
            }
            return newPositions;
          });
        }}
      />
    )}

    {/* Render menus for all open invitations */}
    {pendingInvitations.map((invitation) => {
      const isMenuOpen = openMenuId === invitation.id;
      const position = dropdownPositions[invitation.id];
      
      if (!isMenuOpen || !position) return null;
      
      return (
        <div
          key={`menu-${invitation.id}`}
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-[100] min-w-[160px] py-1"
          style={{
            top: `${position.top}px`,
            right: `${position.right}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            onClick={(e) => {
              // console.log removed for production
              e.stopPropagation();
              handleResendInvitation(invitation.id);
            }}
            disabled={actionLoading === invitation.id}
          >
            <RotateCcw className="h-4 w-4" />
            Resend invite
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            onClick={(e) => {
              // console.log removed for production
              e.stopPropagation();
              handleCancelInvitation(invitation.id);
            }}
            disabled={actionLoading === invitation.id}
          >
            <X className="h-4 w-4" />
            Cancel invite
          </button>
        </div>
      );
    })}
    </>
  );
}