"use client";

import React, { useState, useEffect } from "react";
import type { GroupWithMembers } from "@/lib/types/database";
import { getGroupPendingInvitations, cancelGroupInvitation, type GroupInvitation } from "@/lib/supabase/groupInvitations";
import { Clock, Trash2 } from "lucide-react";

interface CaptainsDropdownProps {
  isOpen: boolean;
  selectedGroup: GroupWithMembers | null;
  onClose: () => void;
  onInviteCaptain?: () => void;
  refreshTrigger?: number; // Trigger to refresh pending invitations
}

export function CaptainsDropdown({ isOpen, selectedGroup, onClose, onInviteCaptain, refreshTrigger }: CaptainsDropdownProps) {
  const [pendingInvitations, setPendingInvitations] = useState<GroupInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Load pending invitations when dropdown opens or when refresh is triggered
  useEffect(() => {
    if (isOpen && selectedGroup?.id) {
      loadPendingInvitations();
    }
  }, [isOpen, selectedGroup?.id, refreshTrigger]);

  const loadPendingInvitations = async () => {
    if (!selectedGroup?.id) return;
    
    try {
      setLoadingInvitations(true);
      const { data, error } = await getGroupPendingInvitations(selectedGroup.id);
      
      if (error) {
        console.error('Error loading pending invitations:', error);
        return;
      }
      
      setPendingInvitations(data || []);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string, inviteeName: string) => {
    if (!selectedGroup?.id) return;
    
    // Simple confirmation dialog
    const confirmed = window.confirm(`Cancel invitation for ${inviteeName}?`);
    if (!confirmed) return;
    
    try {
      setCancelingId(invitationId);
      const { success, error } = await cancelGroupInvitation(selectedGroup.id, invitationId);
      
      if (error) {
        console.error('Error canceling invitation:', error);
        alert('Failed to cancel invitation. Please try again.');
        return;
      }
      
      if (success) {
        // Refresh the pending invitations list
        await loadPendingInvitations();
      }
    } catch (error) {
      console.error('Error canceling invitation:', error);
      alert('Failed to cancel invitation. Please try again.');
    } finally {
      setCancelingId(null);
    }
  };

  if (!isOpen) return null;
  
  // Get captains data from selectedGroup
  const captains = selectedGroup?.group_members?.map(member => ({
    name: member.profiles?.full_name || 'Unknown',
    role: member.role === 'admin' ? 'Creator' : 'Captain',
    initial: (member.profiles?.full_name?.[0] || 'U').toUpperCase()
  })) || [
    { name: "Ana Martínez", role: "Creator", initial: "A" },
    { name: "Ricardo García", role: "Captain", initial: "R" },
  ];
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute top-full left-0 mt-2 bg-[hsl(var(--brand-white))] rounded-2xl shadow-[0_4px_24px_rgba(45,45,45,0.12)] p-3 min-w-[220px] z-50 border border-[hsl(var(--brand-border))]">
        {captains.map((captain, idx) => (
          <div key={idx} className="flex items-center gap-2 py-2">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium ${
                captain.role === 'Creator' 
                  ? 'bg-[hsl(var(--brand-charcoal))] text-[hsl(var(--brand-white))]'
                  : 'bg-[#E8E6E1] text-[hsl(var(--brand-light-gray))]'
              }`}
            >
              {captain.initial}
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--brand-charcoal))] mb-0">{captain.name}</p>
              <p className="text-xs text-[hsl(var(--brand-warm-gray))] mb-0">{captain.role}</p>
            </div>
          </div>
        ))}
        
        {/* Pending Invitations Section */}
        {pendingInvitations.length > 0 && (
          <>
            {/* Honey Divider */}
            <div className="my-3 px-1">
              <div className="h-px bg-gradient-to-r from-transparent via-[hsl(var(--brand-honey))] to-transparent opacity-30"></div>
            </div>
            
            {/* Waiting to Join Header */}
            <div className="px-1 mb-2">
              <p className="text-xs text-[hsl(var(--brand-warm-gray))] font-medium">Waiting to join</p>
            </div>
            
            {/* Pending Invitation Items */}
            {pendingInvitations.map((invitation) => (
              <div 
                key={invitation.id} 
                className="py-1.5 px-1 group flex items-center justify-between hover:bg-gray-50/50 rounded-lg transition-colors"
              >
                <div className="flex-1">
                  <p className="text-xs text-[hsl(var(--brand-warm-gray))] mb-0">
                    {invitation.name || invitation.email}
                  </p>
                  {invitation.name && invitation.email && (
                    <p className="text-[10px] text-[hsl(var(--brand-warm-gray))]/60 mb-0">
                      {invitation.email}
                    </p>
                  )}
                </div>
                
                {/* Cancel Button - appears on hover */}
                <button
                  onClick={() => handleCancelInvitation(invitation.id, invitation.name || invitation.email)}
                  disabled={cancelingId === invitation.id}
                  className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded-md hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                  title="Cancel invitation"
                >
                  <Trash2 
                    className={`h-3 w-3 text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] transition-colors ${
                      cancelingId === invitation.id ? 'animate-pulse' : ''
                    }`} 
                  />
                </button>
              </div>
            ))}
          </>
        )}
        
        <button 
          onClick={() => {
            onInviteCaptain?.();
            onClose();
          }}
          className="w-full mt-3 py-2.5 bg-transparent border border-dashed border-[hsl(var(--brand-border-button))] rounded-[20px] text-[13px] text-[hsl(var(--brand-light-gray))] hover:bg-[hsl(var(--brand-border))] transition-colors"
        >
          + Invite Captain
        </button>
      </div>
    </>
  );
}