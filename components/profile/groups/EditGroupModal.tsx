"use client";

import React, { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { addMonths, format, parse } from "date-fns";
import { Calendar, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateGroup } from "@/lib/supabase/groups";
import { GroupWithMembers } from "@/lib/types/database";
import { CoupleImageEditor } from "./CoupleImageEditor";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupWithMembers | null;
  onGroupUpdated?: (group: GroupWithMembers) => void;
  // Reason: couple image saves instantly via its own API; this lets the parent
  // reload the group so the dashboard header + share previews refresh.
  onImageChange?: () => void;
}

const MAX_NAME_LENGTH = 35;

export function EditGroupModal({
  isOpen,
  onClose,
  group,
  onGroupUpdated,
  onImageChange
}: EditGroupModalProps) {
  const [name, setName] = useState('');
  const [giftDate, setGiftDate] = useState('');
  const [giftDateUndecided, setGiftDateUndecided] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Styled calendar (react-day-picker) — same as the event-invite flow
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarInputRef = useRef<HTMLDivElement>(null);
  const fromDate = new Date();
  const toDate = addMonths(new Date(), 18);

  // Responsive hook — drives Sheet (mobile) vs Dialog (desktop)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640); // sm breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reason: key on group?.id (not the whole group object) so that an in-place
  // group reload — e.g. after the couple photo saves and refreshes the group —
  // doesn't clobber a name/date the user is mid-edit.
  useEffect(() => {
    if (group) {
      setName(group.name || '');
      setGiftDate(group.gift_date || '');
      setSelectedDate(group.gift_date ? parse(group.gift_date, 'yyyy-MM-dd', new Date()) : undefined);
      setGiftDateUndecided(group.gift_date_undecided || false);
      setCalendarOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, isOpen]);

  // Close the calendar when clicking outside it
  useEffect(() => {
    if (!calendarOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        calendarRef.current && !calendarRef.current.contains(e.target as Node) &&
        calendarInputRef.current && !calendarInputRef.current.contains(e.target as Node)
      ) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [calendarOpen]);

  // Reason: the date field sits near the bottom of the sheet, so the inline
  // calendar opens clipped. Scroll it fully into view the moment it opens.
  useEffect(() => {
    if (!calendarOpen) return;
    const id = setTimeout(() => {
      calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    return () => clearTimeout(id);
  }, [calendarOpen]);

  const resetForm = () => {
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!group) return;
    
    if (!name.trim()) {
      setError('Please enter a book name');
      return;
    }

    if (name.length > MAX_NAME_LENGTH) {
      setError(`Book name cannot exceed ${MAX_NAME_LENGTH} characters`);
      return;
    }

    const trimmedName = name.trim();
    
    // Check if anything changed
    const hasChanges =
      trimmedName !== group.name ||
      giftDate !== (group.gift_date || '') ||
      giftDateUndecided !== (group.gift_date_undecided || false);

    if (!hasChanges) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Reason: book_close_date = gift_date - 21 days (auto-calculated)
      let bookCloseDate: string | null = null;
      if (giftDate) {
        const d = new Date(giftDate + 'T00:00:00');
        d.setDate(d.getDate() - 21);
        bookCloseDate = d.toISOString().split('T')[0];
      }

      const updateData: any = {
        name: trimmedName,
        gift_date: giftDate || null,
        gift_date_undecided: giftDateUndecided,
        book_close_date: bookCloseDate,
      };

      // If they set a specific date, mark as not undecided
      if (giftDate) {
        updateData.gift_date_undecided = false;
      }

      // Reason: the Book Name is the single source of truth. Keep BOTH the legacy
      // display name and the printed cover name (print_couple_name) in sync with it
      // so editing the name here propagates everywhere — dashboard, mocks, emails,
      // and the printed cover — instead of diverging into a separate print name.
      if (trimmedName !== group.name) {
        updateData.couple_display_name = trimmedName;
        updateData.print_couple_name = trimmedName;
      }

      const { data, error: updateError } = await updateGroup(group.id, updateData);
      
      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      // Success! Close modal and notify parent
      resetForm();
      onClose();
      
      if (onGroupUpdated && data) {
        // Transform the updated data to match GroupWithMembers interface
        const updatedGroup: GroupWithMembers = {
          ...group,
          ...data,
        };
        onGroupUpdated(updatedGroup);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating group:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!group) return null;

  const bodyContent = (
        <div className="space-y-4 py-4">
          {/* Couple Photo — same image used in the dashboard header AND every
              shared preview (WhatsApp + email), so make that explicit. */}
          <div>
            <Label className="text-sm font-medium text-gray-600 mb-1 block">
              Couple photo
            </Label>
            <p className="text-xs text-gray-500 mb-3">
              This is the photo people see when you share your link on WhatsApp and email.
            </p>
            <CoupleImageEditor
              groupId={group.id}
              imageUrl={group.couple_image_url}
              positionX={group.couple_image_position_x ?? 50}
              positionY={group.couple_image_position_y ?? 50}
              onChange={onImageChange}
              compact
            />
          </div>

          {/* Name Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="edit-name" className="text-sm font-medium text-gray-600">
                Book Name *
              </Label>
              <span className={`text-xs ${
                name.length > MAX_NAME_LENGTH 
                  ? 'text-red-600 font-medium' 
                  : name.length > MAX_NAME_LENGTH * 0.9 
                    ? 'text-orange-600' 
                    : 'text-gray-500'
              }`}>
                {name.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length <= MAX_NAME_LENGTH) {
                  setName(newValue);
                }
              }}
              className={`mt-1 ${
                name.length > MAX_NAME_LENGTH 
                  ? 'border-red-300 focus:ring-red-500' 
                  : ''
              }`}
              placeholder="e.g., Family Recipes, Book Club"
              required
              maxLength={MAX_NAME_LENGTH}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim() && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              // Reason: don't pop the keyboard the instant a bottom sheet opens on mobile
              autoFocus={!isMobile}
            />
            {name.length > MAX_NAME_LENGTH && (
              <p className="mt-1 text-xs text-red-600">
                Book name cannot exceed {MAX_NAME_LENGTH} characters.
              </p>
            )}
          </div>

          {/* Delivery Date Section */}
          <div>
            <Label className="text-sm font-medium text-gray-600 mb-3 block">
              When do you want this book delivered?
            </Label>

            <div className="mb-3">
              <div
                ref={calendarInputRef}
                role="button"
                tabIndex={giftDateUndecided ? -1 : 0}
                onClick={() => { if (!giftDateUndecided) setCalendarOpen((prev) => !prev); }}
                onKeyDown={(e) => {
                  if (!giftDateUndecided && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setCalendarOpen((prev) => !prev);
                  }
                }}
                className={`w-full h-12 px-4 flex items-center rounded-lg transition-all duration-200 bg-[hsl(var(--brand-warm-white))] ${giftDateUndecided ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  border: `1px solid ${selectedDate ? 'hsl(var(--brand-honey))' : calendarOpen ? 'hsl(var(--brand-honey))' : 'hsl(var(--brand-sand))'}`,
                  boxShadow: calendarOpen ? '0 0 0 2px rgba(212, 168, 84, 0.15)' : 'none',
                }}
              >
                <Calendar className="w-[18px] h-[18px] text-[hsl(var(--brand-warm-gray))] mr-2.5 flex-shrink-0" strokeWidth={1.5} />
                {selectedDate ? (
                  <span className="text-[15px] font-medium text-[hsl(var(--brand-charcoal))] flex-1 text-left">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </span>
                ) : (
                  <span className="text-[15px] text-[hsl(var(--brand-warm-gray))] flex-1 text-left">
                    Pick a date
                  </span>
                )}
                {selectedDate && !giftDateUndecided && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedDate(undefined); setGiftDate(''); }}
                    className="p-1 rounded-full hover:bg-[hsl(var(--brand-sand))] transition-colors ml-1"
                  >
                    <X className="w-4 h-4 text-[hsl(var(--brand-warm-gray))]" strokeWidth={1.5} />
                  </button>
                )}
              </div>

              {calendarOpen && !giftDateUndecided && (
                <div
                  ref={calendarRef}
                  className="mt-2 flex justify-center rounded-xl border border-[hsl(var(--brand-sand))] bg-white p-2"
                >
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (date) {
                        setGiftDate(format(date, 'yyyy-MM-dd'));
                        setCalendarOpen(false);
                      }
                    }}
                    startMonth={fromDate}
                    endMonth={toDate}
                    disabled={{ before: fromDate, after: toDate }}
                    defaultMonth={selectedDate || fromDate}
                    style={{
                      ['--rdp-accent-color' as string]: 'hsl(var(--brand-honey))',
                      ['--rdp-accent-background-color' as string]: 'hsl(var(--brand-honey))',
                      ['--rdp-today-color' as string]: 'hsl(var(--brand-honey))',
                      ['--rdp-day-height' as string]: '40px',
                      ['--rdp-day-width' as string]: '40px',
                      ['--rdp-selected-border' as string]: 'none',
                      fontFamily: 'inherit',
                      color: 'hsl(var(--brand-charcoal))',
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="gift-date-undecided"
                checked={giftDateUndecided}
                onChange={(e) => {
                  setGiftDateUndecided(e.target.checked);
                  if (e.target.checked) {
                    setGiftDate('');
                    setSelectedDate(undefined);
                    setCalendarOpen(false);
                  }
                }}
                className="mr-3 h-4 w-4 text-[hsl(var(--brand-honey))] border-gray-300 rounded focus:ring-[hsl(var(--brand-honey))]"
              />
              <label htmlFor="gift-date-undecided" className="text-sm text-gray-700">
                I haven&apos;t decided yet
              </label>
            </div>

            {giftDateUndecided && (
              <p className="text-secondary-sm text-gray-500 italic mt-2">
                No recipe deadline will be shown until you set a date
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
  );

  // Action Buttons — side-by-side (each flex-1), like AddRecipeModal
  const footerButtons = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="flex-1 rounded-full border border-[rgba(45,45,45,0.14)] py-3.5 text-[15px] font-medium text-brand-charcoal transition-colors hover:bg-[rgba(45,45,45,0.03)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.18)] focus-visible:ring-offset-2 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={loading || !name.trim() || name.length > MAX_NAME_LENGTH}
        className="flex-1 rounded-full bg-brand-charcoal py-3.5 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    </>
  );

  // Mobile: Sheet that slides up from the bottom — matches the other dashboard modals
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="!h-[92dvh] !max-h-[92dvh] rounded-t-[20px] flex flex-col overflow-hidden p-0"
        >
          <div className="px-6 pt-6 pb-6 flex flex-col h-full overflow-hidden">
            <SheetHeader className="px-0 flex-shrink-0 mb-2 text-left">
              <SheetTitle className="type-modal-title">Edit Cookbook</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">{bodyContent}</div>
            <div
              className="flex-shrink-0 flex gap-3 border-t border-gray-200 pt-4"
              style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
            >
              {footerButtons}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: centered Dialog popup
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="type-modal-title">
            Edit Cookbook
          </DialogTitle>
        </DialogHeader>
        {bodyContent}
        <div className="mt-8 flex gap-3">{footerButtons}</div>
      </DialogContent>
    </Dialog>
  );
}