'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Check, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useProfileOnboarding } from '@/lib/contexts/ProfileOnboardingContext';
import type { GroupWithMembers } from '@/lib/types/database';

interface SetupChecklistProps {
  group: GroupWithMembers | null;
  onOpenEditGroup: () => void;
  onOpenInviteCaptain: () => void;
  onOpenShareLink: () => void;
  onOpenImportGuests: (source: 'zola' | 'the_knot') => void;
  onOpenCouplePhoto: () => void;
  // Reason: expose imperative open control so the WelcomeOverlay can auto-open
  // the wizard at step 1 after the user clicks "Show me".
  autoOpen?: boolean;
  onAutoOpenConsumed?: () => void;
}

interface StepDef {
  id: string;
  title: string;
  why: string;
  done: boolean;
  action: () => void;
  cta: string;
  // Reason: when the step is done, some steps render richer feedback than a plain "Done".
  // doneLabel overrides the text; doneVisual renders above it (e.g. the couple photo preview).
  doneLabel?: string;
  doneVisual?: React.ReactNode;
  // Reason: some steps replace the single honey CTA with a custom action block
  // (e.g. two brand-logo buttons for Zola / The Knot). When present, this overrides
  // the default `cta` button rendering in the pending state.
  customAction?: React.ReactNode;
}

export function SetupChecklist({
  group,
  onOpenEditGroup,
  onOpenInviteCaptain,
  onOpenShareLink,
  onOpenImportGuests,
  onOpenCouplePhoto,
  autoOpen = false,
  onAutoOpenConsumed,
}: SetupChecklistProps) {
  const {
    getSharedToWhatsappAt,
    isChecklistPermanentlyDismissed,
    permanentlyDismissChecklist,
  } = useProfileOnboarding();
  const [guestCount, setGuestCount] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  // Reason: inline two-step confirmation for permanent dismissal, so we don't
  // stack a nested modal on top of the wizard.
  const [confirmingHide, setConfirmingHide] = useState(false);

  const groupId = group?.id ?? '';
  const sharedToWhatsappAt = groupId ? getSharedToWhatsappAt(groupId) : null;

  // Fetch guest count for the selected group
  useEffect(() => {
    if (!group?.id) {
      setGuestCount(null);
      return;
    }
    let cancelled = false;
    const supabase = createSupabaseClient();
    // Reason: exclude is_self because every group auto-creates a "self" guest
    // for the owner's own recipes. That doesn't count as "bringing the guest list in".
    supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', group.id)
      .eq('is_archived', false)
      .eq('is_self', false)
      .then(({ count }) => {
        if (!cancelled) setGuestCount(count ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [group?.id]);

  // Reset when switching groups
  useEffect(() => {
    setIsOpen(false);
    setCurrentIdx(0);
    setConfirmingHide(false);
  }, [group?.id]);

  const steps: StepDef[] = useMemo(() => {
    if (!group) return [];

    const hasClosureDate = !!group.book_close_date;

    // Reason: collect captain display names for the Done visual (step 2). Prefer
    // printed_name (what they chose), fallback to profiles.full_name, fallback to email.
    const captains = (group.group_members || [])
      .filter(m => m.role !== 'owner')
      .map(m => {
        const printed = m.printed_name?.trim();
        if (printed) return printed;
        const full = (m.profiles as { full_name?: string | null; email?: string | null } | null)?.full_name?.trim();
        if (full) return full;
        const email = (m.profiles as { email?: string | null } | null)?.email;
        return email || 'Captain';
      });
    // Reason: mirrors getDeadlineText in groups/page.tsx — "April 22nd" style,
    // month + ordinal day, no year. Keeps date display consistent across the dashboard.
    const formatClosureDate = (dateString: string): string => {
      try {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const monthName = date.toLocaleDateString('en-US', { month: 'long' });
        const d = date.getDate();
        const suffix =
          d >= 11 && d <= 13 ? 'th' : ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'][d % 10];
        return `${monthName} ${d}${suffix}`;
      } catch {
        return 'Set';
      }
    };
    const closureDateLabel = group.book_close_date
      ? `Closes ${formatClosureDate(group.book_close_date)}`
      : undefined;
    const captainsCount = captains.length;
    const hasCaptains = captainsCount > 0;
    const hasShared = !!sharedToWhatsappAt;
    const hasGuests = (guestCount ?? 0) > 0;
    const hasCouplePhoto = !!group.couple_image_url;

    return [
      {
        id: 'closure_date',
        title: 'Pick your closure date',
        why: 'Two weeks of buffer keeps things calm.',
        done: hasClosureDate,
        action: onOpenEditGroup,
        cta: 'Pick a date',
        doneLabel: closureDateLabel,
      },
      {
        id: 'captains',
        title: 'Invite your captains',
        why: 'A captain gets 3× more recipes than you chasing alone.',
        done: hasCaptains,
        action: onOpenInviteCaptain,
        cta: 'Invite captains',
        doneVisual: hasCaptains ? (
          <ul className="flex flex-col gap-2 items-center">
            {captains.map((name, i) => (
              <li
                key={`${name}-${i}`}
                className="flex items-center gap-2 text-[15px] text-[hsl(var(--brand-charcoal))]"
              >
                <Check
                  className="w-4 h-4 text-[hsl(var(--brand-honey))] flex-shrink-0"
                  strokeWidth={2.5}
                />
                <span className="font-serif">{name}</span>
              </li>
            ))}
          </ul>
        ) : undefined,
      },
      {
        id: 'whatsapp',
        title: 'Share your link in WhatsApp/SMS groups',
        why: 'Add a photo, a message, then paste it in your group chats.',
        done: hasShared,
        action: onOpenShareLink,
        cta: 'Customize and share',
      },
      {
        id: 'guests',
        title: 'Bring your guest list in',
        why: 'Import from Zola or The Knot. Then invite the whole list in one click.',
        done: hasGuests,
        action: () => onOpenImportGuests('zola'),
        cta: 'Import list',
        doneLabel: guestCount ? `${guestCount} ${guestCount === 1 ? 'guest' : 'guests'} ready` : undefined,
        // Reason: replace the single honey CTA with two brand-logo buttons.
        // Each opens the respective import modal and closes the wizard.
        customAction: !hasGuests ? (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                onOpenImportGuests('zola');
                setIsOpen(false);
              }}
              aria-label="Import from Zola"
              className="flex items-center justify-center w-[140px] h-[56px] rounded-xl border border-[hsl(var(--brand-border))] bg-white hover:border-[hsl(var(--brand-honey))] hover:bg-[hsl(var(--brand-warm-white))] transition-all"
            >
              <Image
                src="/images/guest_modal/Zola_Logo.svg"
                alt="Zola"
                width={72}
                height={22}
                className="object-contain"
              />
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenImportGuests('the_knot');
                setIsOpen(false);
              }}
              aria-label="Import from The Knot"
              className="flex items-center justify-center w-[140px] h-[56px] rounded-xl border border-[hsl(var(--brand-border))] bg-white hover:border-[hsl(var(--brand-honey))] hover:bg-[hsl(var(--brand-warm-white))] transition-all"
            >
              <Image
                src="/images/guest_modal/knot_logo.png"
                alt="The Knot"
                width={78}
                height={28}
                className="object-contain"
              />
            </button>
          </div>
        ) : undefined,
      },
      {
        id: 'couple_photo',
        title: "Add the couple's photo",
        why: 'Make it feel like yours.',
        done: hasCouplePhoto,
        action: onOpenCouplePhoto,
        cta: 'Upload photo',
        doneVisual: hasCouplePhoto ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={group.couple_image_url || ''}
              alt="Couple"
              className="w-[180px] h-[110px] object-cover rounded-xl border border-[hsl(var(--brand-border))]"
              style={{
                objectPosition: `${group.couple_image_position_x ?? 50}% ${group.couple_image_position_y ?? 50}%`,
              }}
            />
            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[hsl(var(--brand-honey))] flex items-center justify-center shadow-sm ring-2 ring-white">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </span>
          </div>
        ) : undefined,
      },
    ];
  }, [group, sharedToWhatsappAt, guestCount, onOpenEditGroup, onOpenInviteCaptain, onOpenShareLink, onOpenImportGuests, onOpenCouplePhoto]);

  const completedCount = steps.filter(s => s.done).length;
  const total = steps.length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isComplete = total > 0 && completedCount === total;

  // Reason: when opening, jump to the first incomplete step so the user never lands on a done one.
  const openWizard = useCallback(() => {
    const firstIncomplete = steps.findIndex(s => !s.done);
    setCurrentIdx(firstIncomplete === -1 ? 0 : firstIncomplete);
    setIsOpen(true);
  }, [steps]);

  const closeWizard = useCallback(() => {
    setIsOpen(false);
    setConfirmingHide(false);
  }, []);

  // Auto-open from WelcomeOverlay trigger
  useEffect(() => {
    if (autoOpen && group && !isOpen) {
      openWizard();
      onAutoOpenConsumed?.();
    }
  }, [autoOpen, group, isOpen, openWizard, onAutoOpenConsumed]);

  // ESC key closes
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWizard();
      if (e.key === 'ArrowLeft' && currentIdx > 0) setCurrentIdx(currentIdx - 1);
      if (e.key === 'ArrowRight' && currentIdx < total - 1) setCurrentIdx(currentIdx + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, currentIdx, total, closeWizard]);

  if (!group || steps.length === 0) return null;

  // Reason: user clicked "I've got it from here" for this group — hide the pill
  // and modal entirely. Can be restored from Account Settings.
  if (groupId && isChecklistPermanentlyDismissed(groupId)) return null;

  const currentStep = steps[currentIdx];

  return (
    <div className="mt-5 mb-1">
      {/* Progress pill */}
      <button
        type="button"
        onClick={openWizard}
        aria-haspopup="dialog"
        aria-label={isComplete ? 'Getting started complete' : `Getting started, ${percent}% complete. Click to continue.`}
        className="group relative inline-flex items-center gap-3 px-5 h-[38px] rounded-[10px] bg-[hsl(var(--brand-warm-white))] border border-[hsl(var(--brand-honey))]/30 hover:border-[hsl(var(--brand-honey))] transition-all overflow-hidden min-w-[240px]"
      >
        {/* Bottom progress line */}
        <div
          className="absolute bottom-0 left-0 h-[3px] bg-[hsl(var(--brand-honey))] transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
          aria-hidden
        />

        {/* Content */}
        <div className="relative flex items-center gap-2 flex-1">
          {isComplete ? (
            <>
              <Check className="w-3.5 h-3.5 text-[hsl(var(--brand-honey))]" strokeWidth={2.5} />
              <span className="font-serif text-[14px] text-[hsl(var(--brand-charcoal))]">
                All done
              </span>
            </>
          ) : (
            <>
              <span className="font-serif text-[14px] text-[hsl(var(--brand-charcoal))]">
                Getting started
              </span>
              <span className="text-[12px] font-medium text-[hsl(var(--brand-honey))] tabular-nums">
                {percent}%
              </span>
            </>
          )}
        </div>
      </button>

      {/* Wizard modal */}
      <AnimatePresence>
        {isOpen && currentStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/15 backdrop-blur-sm"
            onClick={closeWizard}
            role="dialog"
            aria-modal="true"
            aria-label="Getting started"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-[440px] bg-white rounded-3xl shadow-xl p-8 md:p-10"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={closeWizard}
                aria-label="Close getting started"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[hsl(var(--brand-warm-gray))] hover:bg-[hsl(var(--brand-warm-white))] hover:text-[hsl(var(--brand-charcoal))] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Celebration state when complete */}
              {isComplete ? (
                <div className="text-center pt-4 pb-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--brand-warm-white))] mb-6">
                    <Check className="w-8 h-8 text-[hsl(var(--brand-honey))]" strokeWidth={2.25} />
                  </div>
                  <h2 className="font-serif text-[32px] leading-tight text-[hsl(var(--brand-charcoal))] mb-3">
                    All set.
                  </h2>
                  <p className="text-[15px] text-[hsl(var(--brand-warm-gray))] leading-relaxed mb-8 max-w-[280px] mx-auto">
                    Everything is in place. The book will start filling itself.
                  </p>
                  <button
                    type="button"
                    onClick={closeWizard}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[hsl(var(--brand-charcoal))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-warm-gray))] transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Progress dots */}
                  <div className="flex items-center justify-center gap-2 mt-2 mb-8">
                    {steps.map((s, i) => {
                      const isCurrent = i === currentIdx;
                      const isDone = s.done;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setCurrentIdx(i)}
                          aria-label={`Go to step ${i + 1}: ${s.title}`}
                          className="group p-1"
                        >
                          <span
                            className={`block rounded-full transition-all duration-300 ${
                              isCurrent
                                ? 'w-6 h-2 bg-[hsl(var(--brand-honey))]'
                                : isDone
                                ? 'w-2 h-2 bg-[hsl(var(--brand-honey))] opacity-60'
                                : 'w-2 h-2 bg-[hsl(var(--brand-border-button))]'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Eyebrow */}
                  <div className="text-center mb-3">
                    <span className="text-[11px] uppercase tracking-[0.15em] text-[hsl(var(--brand-warm-gray))] font-medium">
                      Step {currentIdx + 1} of {total}
                    </span>
                  </div>

                  {/* Title — the big serif */}
                  <motion.h2
                    key={`title-${currentIdx}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="font-serif text-[30px] md:text-[34px] leading-[1.15] text-center text-[hsl(var(--brand-charcoal))] mb-4"
                  >
                    {currentStep.title}
                  </motion.h2>

                  {/* One-line why */}
                  <motion.p
                    key={`why-${currentIdx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                    className="text-center text-[15px] text-[hsl(var(--brand-warm-gray))] leading-relaxed mb-10 px-2"
                  >
                    {currentStep.why}
                  </motion.p>

                  {/* Primary action */}
                  <div className="flex flex-col items-center gap-3 mb-8">
                    {currentStep.done ? (
                      <div className="flex flex-col items-center gap-3">
                        {currentStep.doneVisual}
                        {!currentStep.doneVisual && (
                          <div className="flex items-center gap-2 text-[hsl(var(--brand-honey))]">
                            <Check className="w-5 h-5" strokeWidth={2.25} />
                            <span className="text-sm font-medium">
                              {currentStep.doneLabel ?? 'Done'}
                            </span>
                          </div>
                        )}
                        {currentStep.doneVisual && currentStep.doneLabel && (
                          <span className="text-sm font-medium text-[hsl(var(--brand-honey))]">
                            {currentStep.doneLabel}
                          </span>
                        )}
                      </div>
                    ) : currentStep.customAction ? (
                      currentStep.customAction
                    ) : (
                      <button
                          type="button"
                          onClick={() => {
                            currentStep.action();
                            closeWizard();
                          }}
                          className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-[hsl(var(--brand-honey))] text-white text-[15px] font-medium hover:bg-[hsl(var(--brand-honey-dark))] transition-colors shadow-sm"
                        >
                          {currentStep.cta}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    )}
                  </div>

                  {/* Footer nav */}
                  <div className="flex items-center justify-between pt-5 border-t border-[hsl(var(--brand-border))]">
                    <button
                      type="button"
                      onClick={() => currentIdx > 0 && setCurrentIdx(currentIdx - 1)}
                      disabled={currentIdx === 0}
                      aria-label="Previous step"
                      className="w-8 h-8 flex items-center justify-center rounded-full text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-warm-white))] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-[hsl(var(--brand-warm-gray))]">
                      <span className="font-serif text-[hsl(var(--brand-honey))] tabular-nums">{percent}%</span>
                      <span className="ml-1">done</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => currentIdx < total - 1 && setCurrentIdx(currentIdx + 1)}
                      disabled={currentIdx === total - 1}
                      aria-label="Next step"
                      className="w-8 h-8 flex items-center justify-center rounded-full text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] hover:bg-[hsl(var(--brand-warm-white))] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Permanent dismiss link + inline two-step confirm */}
                  <div className="mt-5 flex justify-center min-h-[20px]">
                    {!confirmingHide ? (
                      <button
                        type="button"
                        onClick={() => setConfirmingHide(true)}
                        className="text-[11px] text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] hover:underline underline-offset-2 transition-colors"
                      >
                        I&apos;ve got it from here
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[11px] text-[hsl(var(--brand-warm-gray))] text-center">
                          Hide this guide? You can bring it back from Account Settings.
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              permanentlyDismissChecklist(groupId);
                              closeWizard();
                            }}
                            className="text-[11px] font-medium text-[hsl(var(--brand-honey))] hover:text-[hsl(var(--brand-honey-dark))] transition-colors"
                          >
                            Yes, hide
                          </button>
                          <span className="text-[hsl(var(--brand-border-button))]">·</span>
                          <button
                            type="button"
                            onClick={() => setConfirmingHide(false)}
                            className="text-[11px] text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))] transition-colors"
                          >
                            Never mind
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
