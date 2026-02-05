"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus } from "lucide-react";
import { getMyGroups } from "@/lib/supabase/groups";
import type { GroupWithMembers } from "@/lib/types/database";

// Extend the interface locally to ensure image_group_dashboard is available
interface GroupWithDashboardImage extends GroupWithMembers {
  image_group_dashboard: string | null;
  dashboard_image_position_y: number;
}
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface GroupNavigationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupSelect?: (group: GroupWithMembers) => void;
  currentGroupId?: string;
}

export function GroupNavigationSheet({ isOpen, onClose, onGroupSelect, currentGroupId }: GroupNavigationSheetProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupWithDashboardImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  const loadGroups = async () => {
    setLoading(true);
    const { data, error } = await getMyGroups();
    if (!error && data) {
      setGroups(data as GroupWithDashboardImage[]);
    }
    setLoading(false);
  };

  const formatWeddingDate = (date: string | null, timeline: string | null, undecided: boolean) => {
    if (undecided && timeline) {
      return timeline;
    }
    if (date) {
      const weddingDate = new Date(date);
      return weddingDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return "Celebrations ahead";
  };

  const handleGroupSelect = (group: GroupWithDashboardImage) => {
    onGroupSelect?.(group);
    onClose();
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
              Your Books
            </SheetTitle>
          </SheetHeader>
          
          {/* Content */}
          <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-4 py-4' : 'p-6'}`}>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-40 bg-gray-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-sm">No books yet.</p>
                <p className="text-gray-400 text-sm mt-1">Your collections will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupSelect(group)}
                    className={`
                      w-full rounded-lg overflow-hidden transition-all duration-300
                      hover:shadow-lg hover:-translate-y-0.5 relative group
                      ${currentGroupId === group.id ? 'ring-2 ring-[hsl(var(--brand-charcoal))]' : ''}
                    `}
                  >
                    <div className="h-40 relative">
                      {/* Background Image */}
                      <Image
                        src={group.image_group_dashboard || "/images/profile/Hero_Profile_2400.jpg"}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 400px) 100vw, 400px"
                        style={{ objectPosition: `center ${group.dashboard_image_position_y ?? 50}%` }}
                      />
                      
                      {/* Dark Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />
                      
                      {/* Content */}
                      <div className="absolute inset-0 p-6 flex flex-col justify-between">
                        <div className="text-left">
                          <h3 className="font-serif text-xl font-medium text-white">
                            {group.name}
                          </h3>
                        </div>
                        
                        <div className="flex justify-between items-end">
                          <p className="text-sm text-white/90">
                            {formatWeddingDate(group.wedding_date, group.wedding_timeline, group.wedding_date_undecided || false)}
                          </p>
                          
                          {currentGroupId === group.id && (
                            <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white border border-white/30">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
                    </div>
                  </button>
                ))}

                {/* Create New Book Button */}
                <button
                  onClick={() => {
                    onClose();
                    router.push('/onboarding-gift?mode=add-book');
                  }}
                  className="w-full py-4 border-2 border-dashed border-[hsl(var(--brand-warm-gray))]/30 rounded-lg 
                             flex items-center justify-center gap-2 text-[hsl(var(--brand-warm-gray))] 
                             hover:border-[hsl(var(--brand-honey))] hover:text-[hsl(var(--brand-honey))] transition-colors"
                >
                  <Plus size={20} />
                  <span className="font-medium">Create a new book</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}