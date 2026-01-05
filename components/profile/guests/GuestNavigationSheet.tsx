"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Search, Plus, User, Check, Clock, ChevronDown } from "lucide-react";
import { getGuestsByGroup } from "@/lib/supabase/guests";
import type { Guest } from "@/lib/types/database";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GuestNavigationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName?: string;
  onGuestSelect?: (guest: Guest) => void;
  onAddGuest?: () => void;
}

export function GuestNavigationSheet({ 
  isOpen, 
  onClose, 
  groupId,
  groupName,
  onGuestSelect,
  onAddGuest 
}: GuestNavigationSheetProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "submitted">("all");
  const [isMobile, setIsMobile] = useState(false);

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadGuests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getGuestsByGroup(groupId);
    if (!error && data) {
      setGuests(data);
    }
    setLoading(false);
  }, [groupId]);

  // Load guests when sheet opens
  useEffect(() => {
    if (isOpen && groupId) {
      loadGuests();
    }
  }, [isOpen, groupId, loadGuests]);

  // Filter guests by search query and status
  const filteredGuests = useMemo(() => {
    let filtered = guests;
    
    // Filter by status first
    if (statusFilter === "pending") {
      filtered = filtered.filter(guest => (guest.recipes_received || 0) === 0);
    } else if (statusFilter === "submitted") {
      filtered = filtered.filter(guest => (guest.recipes_received || 0) > 0);
    }
    
    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(guest => 
        guest.first_name?.toLowerCase().includes(query) ||
        guest.last_name?.toLowerCase().includes(query) ||
        guest.email?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [guests, searchQuery, statusFilter]);

  // Sort guests: submitted first, then pending, alphabetically within each group
  const sortedGuests = useMemo(() => {
    return [...filteredGuests].sort((a, b) => {
      // First sort by status (submitted first)
      const aSubmitted = (a.recipes_received || 0) > 0;
      const bSubmitted = (b.recipes_received || 0) > 0;
      
      if (aSubmitted !== bSubmitted) {
        return aSubmitted ? -1 : 1;
      }
      
      // Then sort alphabetically by name
      const aName = `${a.first_name} ${a.last_name || ''}`.trim().toLowerCase();
      const bName = `${b.first_name} ${b.last_name || ''}`.trim().toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [filteredGuests]);


  const handleGuestClick = (guest: Guest) => {
    onGuestSelect?.(guest);
  };

  const getStatusDisplay = (guest: Guest) => {
    const recipeCount = guest.recipes_received || 0;
    if (recipeCount > 0) {
      return {
        icon: <Check size={14} className="text-[hsl(var(--brand-honey))]" />,
        text: recipeCount === 1 ? "1 recipe" : `${recipeCount} recipes`,
        className: "text-[hsl(var(--brand-honey))]"
      };
    }
    return {
      icon: <Clock size={14} className="text-[hsl(var(--brand-warm-gray))]" />,
      text: "Pending",
      className: "text-[hsl(var(--brand-warm-gray))]"
    };
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side={isMobile ? "bottom" : "left"} 
        className={isMobile 
          ? "!h-[85vh] !max-h-[85vh] rounded-t-[20px] p-0 overflow-hidden bg-white" 
          : "w-[85%] sm:w-[400px] p-0 overflow-hidden bg-white [&_button[data-radix-dialog-close]]:focus:outline-none [&_button[data-radix-dialog-close]]:focus:ring-0 [&_button[data-radix-dialog-close]]:focus:ring-offset-0"
        }
      >
        {/* Mobile visual handle */}
        {isMobile && <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-gray-300" />}

        <div className={`h-full flex flex-col ${isMobile ? 'pt-2' : ''}`}>
          {/* Header */}
          <SheetHeader className={`${isMobile ? 'px-6 py-4' : 'px-8 py-6'} border-b border-gray-100`}>
            <SheetTitle className="font-serif text-2xl font-semibold text-[hsl(var(--brand-charcoal))]">
              Manage Guests
            </SheetTitle>
          </SheetHeader>


          {/* Search and Filter */}
          <div className={`${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
            <div className="flex gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:border-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))]"
                />
              </div>
              
              {/* Status Filter */}
              <div className="w-32">
                <Select value={statusFilter} onValueChange={(value: "all" | "pending" | "submitted") => setStatusFilter(value)}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 focus:border-[hsl(var(--brand-honey))] focus:ring-[hsl(var(--brand-honey))]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-4 py-4' : 'p-6'}`}>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : guests.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No guests yet.</p>
                <p className="text-gray-400 text-sm mt-1">Add guests to start collecting recipes.</p>
              </div>
            ) : sortedGuests.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-sm">No guests match &quot;{searchQuery}&quot;</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedGuests.map((guest) => {
                  const status = getStatusDisplay(guest);
                  return (
                    <button
                      key={guest.id}
                      onClick={() => handleGuestClick(guest)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-100 bg-white
                                 hover:border-[hsl(var(--brand-honey))] hover:shadow-sm
                                 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Guest name */}
                        <p className="font-normal text-[hsl(var(--brand-charcoal))] truncate flex-1">
                          {guest.first_name} {guest.last_name || ''}
                        </p>
                        
                        {/* Status */}
                        <div className={`flex items-center gap-1.5 text-sm ${status.className} flex-shrink-0`}>
                          {status.icon}
                          <span>{status.text}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer - Add Guest Button */}
          <div className={`${isMobile ? 'px-4 py-4' : 'p-6'} border-t border-gray-100`}>
            <button
              onClick={() => {
                onAddGuest?.();
              }}
              className="w-full py-3 border-2 border-dashed border-[hsl(var(--brand-warm-gray))]/30 rounded-lg 
                         flex items-center justify-center gap-2 text-[hsl(var(--brand-warm-gray))] 
                         hover:border-[hsl(var(--brand-honey))] hover:text-[hsl(var(--brand-honey))] transition-colors"
            >
              <Plus size={20} />
              <span className="font-medium">Add Guest</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}