"use client";

import React from "react";
import type { GroupWithMembers } from "@/lib/types/database";

interface CaptainsDropdownProps {
  isOpen: boolean;
  selectedGroup: GroupWithMembers | null;
  onClose: () => void;
}

export function CaptainsDropdown({ isOpen, selectedGroup, onClose }: CaptainsDropdownProps) {
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
        <button className="w-full mt-2 py-2.5 bg-transparent border border-dashed border-[hsl(var(--brand-border-button))] rounded-[20px] text-[13px] text-[hsl(var(--brand-light-gray))] hover:bg-[hsl(var(--brand-border))] transition-colors">
          + Invite Captain
        </button>
      </div>
    </>
  );
}