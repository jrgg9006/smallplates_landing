"use client";

import React, { useState, useEffect } from "react";
import { Users, Crown, Shield, User as UserIcon, UserPlus } from "lucide-react";
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
import type { GroupWithMembers, GroupMemberWithProfile } from "@/lib/types/database";

interface GroupMembersDropdownProps {
  group: GroupWithMembers;
  onInviteFriend?: () => void;
}

export function GroupMembersDropdown({ group, onInviteFriend }: GroupMembersDropdownProps) {
  const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (group.id) {
      loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await getGroupMembers(group.id);
      
      if (error) {
        console.error('Error loading group members:', error);
        return;
      }
      
      if (data) {
        setMembers(data);
      }
    } catch (err) {
      console.error('Error loading group members:', err);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2" disabled={loading}>
          <Users className="h-4 w-4" />
          <span>Members ({group.member_count || 0})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Group Members
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
              Invite a friend to this group
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
              Invite a friend to this group
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
              Invite a friend to this group
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}