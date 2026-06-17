"use client";

import React, { useState, useEffect } from "react";
import { RecipeWithGuest, Guest } from "@/lib/types/database";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Edit, Download, ChevronDown, Plus, Info } from "lucide-react";
import Image from "next/image";
import { changeRecipeGuest, logRecipeEdit } from "@/lib/supabase/recipes";
import { getRecipeViewState, type RecipeViewState } from "@/lib/recipes/cleanVersionState";
import { getGuests } from "@/lib/supabase/guests";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getRecipeGroups } from "@/lib/supabase/groupRecipes";
import { isGroupMember } from "@/lib/supabase/groupMembers";
import { AddGuestModal } from "@/components/profile/guests/AddGuestModal";

interface RecipeDetailsModalProps {
  recipe: RecipeWithGuest | null;
  isOpen: boolean;
  onClose: () => void;
  onRecipeUpdated?: () => void;
  initialEditMode?: boolean;
}

export function RecipeDetailsModal({ recipe, isOpen, onClose, onRecipeUpdated, initialEditMode = false }: RecipeDetailsModalProps) {
  const { user } = useAuth();
  
  // Local state for recipe to allow immediate updates after editing
  const [localRecipe, setLocalRecipe] = useState<RecipeWithGuest | null>(recipe);
  
  // Responsive hook to detect mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  const [recipeNotes, setRecipeNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Groups state
  const [recipeGroups, setRecipeGroups] = useState<Array<{ group_id: string; group_name: string }>>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  // Guest selector state (edit mode) — mirrors AddRecipeModal's dropdown
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string>('');
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Clean version (recipe_print_ready) state — fetched when the modal opens.
  type CleanFields = {
    recipe_name_clean: string;
    ingredients_clean: string;
    instructions_clean: string;
    note_clean: string | null;
  };
  const [printReady, setPrintReady] = useState<CleanFields | null>(null);
  const [viewState, setViewState] = useState<RecipeViewState>('processing');
  const [cleanLoaded, setCleanLoaded] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showCleaningInfo, setShowCleaningInfo] = useState(false);

  // Update local recipe when prop changes
  useEffect(() => {
    if (recipe) {
      setLocalRecipe(recipe);
    }
  }, [recipe]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640); // sm breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Also check on component mount with a more reliable method
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
    }
  }, [isOpen]);

  // Reset edit mode when modal closes or set initial edit mode when modal opens
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setError(null);
      setShowGuestDropdown(false);
      setShowAddGuestModal(false);
    } else {
      // Set edit mode based on initialEditMode when modal opens
      setIsEditMode(initialEditMode);
    }
  }, [isOpen, initialEditMode]);

  // Initialize form state when entering edit mode
  useEffect(() => {
    if (localRecipe && isEditMode) {
      if (viewState === 'cleaned' && printReady) {
        setRecipeTitle(printReady.recipe_name_clean || '');
        setRecipeIngredients(printReady.ingredients_clean || '');
        setRecipeInstructions(printReady.instructions_clean || '');
        setRecipeNotes(printReady.note_clean || '');
      } else {
        setRecipeTitle(localRecipe.recipe_name || '');
        setRecipeIngredients(localRecipe.ingredients || '');
        setRecipeInstructions(localRecipe.instructions || '');
        setRecipeNotes(localRecipe.comments || '');
      }
      setSelectedGuestId(localRecipe.guest_id);
      setError(null);
    }
  }, [localRecipe, isEditMode, viewState, printReady]);

  // Load guests for the selector when entering edit mode
  useEffect(() => {
    if (!isEditMode || !localRecipe) return;
    const loadGuests = async () => {
      setGuestsLoading(true);
      try {
        // Reason: group recipes carry group_id; fall back to the recipe's group
        // association so the dropdown shows the same people as AddRecipeModal.
        const groupId = localRecipe.group_id || recipeGroups[0]?.group_id;
        const { data: guestsData } = await getGuests(groupId || undefined, false);
        setGuests(guestsData || []);
      } catch (err) {
        console.error('Error loading guests:', err);
      } finally {
        setGuestsLoading(false);
      }
    };
    loadGuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, localRecipe?.id, recipeGroups]);

  // Close guest dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowGuestDropdown(false);
      }
    };
    if (showGuestDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGuestDropdown]);

  const handleGuestAdded = async (newGuestId?: string) => {
    const groupId = localRecipe?.group_id || recipeGroups[0]?.group_id;
    const { data: guestsData } = await getGuests(groupId || undefined, false);
    setGuests(guestsData || []);
    if (newGuestId) {
      setSelectedGuestId(newGuestId);
    }
    setShowAddGuestModal(false);
  };

  // Load groups and check permissions when modal opens
  useEffect(() => {
    const loadGroupsAndCheckPermissions = async () => {
      if (!localRecipe || !isOpen || !user) {
        setRecipeGroups([]);
        setCanEdit(false);
        return;
      }

      setLoadingGroups(true);
      try {
        // Get groups for the recipe
        const { data: groupsData, error: groupsError } = await getRecipeGroups(localRecipe.id);
        
        if (groupsError) {
          console.error('Error loading groups:', groupsError);
          setRecipeGroups([]);
        } else {
          const groups = groupsData || [];
          setRecipeGroups(groups);
          
          // Check if user is creator (can always edit)
          const isCreator = localRecipe.user_id === user.id;
          
          // Check if user is member of any group
          let isMemberOfGroup = false;
          if (groups.length > 0) {
            for (const group of groups) {
              const { data: isMember } = await isGroupMember(group.group_id);
              if (isMember) {
                isMemberOfGroup = true;
                break;
              }
            }
          }
          
          // User can edit if they're the creator OR a member of a group
          setCanEdit(isCreator || isMemberOfGroup);
        }
      } catch (err) {
        console.error('Unexpected error loading groups:', err);
        setRecipeGroups([]);
        setCanEdit(false);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadGroupsAndCheckPermissions();
  }, [localRecipe, isOpen, user]);

  // Reason: the clean version (recipe_print_ready) is the source of truth the user
  // sees/edits. Fetch it via the server endpoint (RLS-safe). Existence + recipe age
  // drive which of the three states (cleaned/processing/fallback) we render.
  useEffect(() => {
    if (!localRecipe || !isOpen) return;
    let cancelled = false;
    setCleanLoaded(false);
    const load = async () => {
      try {
        const res = await fetch(`/api/v1/recipes/${localRecipe.id}/clean`);
        const json = await res.json();
        if (cancelled) return;
        const pr: CleanFields | null = res.ok ? json.print_ready : null;
        setPrintReady(pr);
        setViewState(getRecipeViewState({
          hasPrintReady: !!pr,
          recipeCreatedAt: localRecipe.created_at,
          now: Date.now(),
        }));
      } catch {
        if (!cancelled) {
          setPrintReady(null);
          setViewState(getRecipeViewState({
            hasPrintReady: false,
            recipeCreatedAt: localRecipe.created_at,
            now: Date.now(),
          }));
        }
      } finally {
        if (!cancelled) setCleanLoaded(true);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localRecipe?.id, isOpen]);

  // Reason: while cleaning is in flight we poll for the print_ready row every 3s and
  // recompute the state (elapsed grows toward the 60s timeout). We stop as soon as
  // the clean version lands (→ cleaned) or the timeout elapses (→ fallback).
  useEffect(() => {
    if (!localRecipe || !isOpen || viewState !== 'processing') return;
    const tick = async () => {
      try {
        const res = await fetch(`/api/v1/recipes/${localRecipe.id}/clean`);
        const json = await res.json();
        const pr: CleanFields | null = res.ok ? json.print_ready : null;
        if (pr) setPrintReady(pr);
        setViewState(getRecipeViewState({
          hasPrintReady: !!pr,
          recipeCreatedAt: localRecipe.created_at,
          now: Date.now(),
        }));
      } catch {
        setViewState(getRecipeViewState({
          hasPrintReady: false,
          recipeCreatedAt: localRecipe.created_at,
          now: Date.now(),
        }));
      }
    };
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localRecipe?.id, isOpen, viewState]);

  const handleCancel = () => {
    setIsEditMode(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!localRecipe) return;

    // Validation
    if (!recipeTitle.trim()) {
      setError('Please fill in Recipe Title');
      return;
    }

    if (!recipeIngredients.trim() || !recipeInstructions.trim()) {
      setError('Please fill in Ingredients and Instructions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const guestChanged = Boolean(selectedGuestId) && selectedGuestId !== localRecipe.guest_id;
      const newGuest = guestChanged ? guests.find(g => g.id === selectedGuestId) : undefined;

      const before = {
        recipe_name: localRecipe.recipe_name || '',
        ingredients: localRecipe.ingredients || '',
        instructions: localRecipe.instructions || '',
        comments: localRecipe.comments,
      };
      const after = {
        recipe_name: recipeTitle.trim(),
        ingredients: recipeIngredients.trim(),
        instructions: recipeInstructions.trim(),
        comments: recipeNotes.trim() || null,
      };
      // Reassign the guest first — it also moves the recipes_received counters
      if (guestChanged) {
        const { error: guestChangeError } = await changeRecipeGuest(localRecipe.id, selectedGuestId);
        if (guestChangeError) {
          setError(guestChangeError);
          setLoading(false);
          return;
        }
      }

      // Always save to the clean version (recipe_print_ready) via the endpoint.
      // The original (guest_recipes) is never written from here. If no clean row
      // existed yet (fallback), the endpoint creates one and flags it for review.
      const res = await fetch(`/api/v1/recipes/${localRecipe.id}/clean`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_name: after.recipe_name,
          ingredients: after.ingredients,
          instructions: after.instructions,
          note: after.comments,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Failed to save');
        setLoading(false);
        return;
      }
      setPrintReady(json.print_ready);
      setViewState('cleaned');
      setShowOriginal(false);

      // Audit trail — best-effort: a failure here must not block the edit itself.
      // Reason: only log GUEST changes here. Text edits are already logged by the
      // DB trigger check_recipe_edit_after_completion ('Edited by recipe owner');
      // logging them here too caused a double-write. Guest reassignment is NOT
      // captured by that trigger, so this is the only place that records it.
      if (guestChanged) {
        const oldGuestLabel = localRecipe.guests
          ? `${localRecipe.guests.first_name} ${localRecipe.guests.last_name || ''}`.trim()
          : 'Unknown';
        const newGuestLabel = newGuest
          ? `${newGuest.first_name} ${newGuest.last_name || ''}`.trim()
          : selectedGuestId;

        const { error: historyError } = await logRecipeEdit({
          recipeId: localRecipe.id,
          before,
          after,
          editReason: `Guest changed: ${oldGuestLabel} → ${newGuestLabel}`,
        });
        if (historyError) {
          console.error('Failed to log recipe edit:', historyError);
        }
      }

      // Success! Update local recipe state immediately
      setLocalRecipe({
        ...localRecipe,
        guest_id: guestChanged ? selectedGuestId : localRecipe.guest_id,
        guests: guestChanged && newGuest
          ? {
              first_name: newGuest.first_name,
              last_name: newGuest.last_name || '',
              printed_name: newGuest.printed_name,
              email: newGuest.email || '',
              is_self: newGuest.is_self ?? false,
              source: newGuest.source,
            }
          : localRecipe.guests,
      });

      setIsEditMode(false);

      // Refresh parent component if callback provided
      if (onRecipeUpdated) {
        onRecipeUpdated();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating recipe:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!localRecipe) return null;

  const guest = localRecipe.guests;

  // Reason: cleaned state shows the clean version (source of truth); fallback shows
  // the original. "View original" temporarily reveals the raw submission in cleaned.
  const inCleaned = viewState === 'cleaned' && !!printReady;
  const displayName = inCleaned && !showOriginal ? printReady!.recipe_name_clean : localRecipe.recipe_name;
  const displayIngredients = inCleaned && !showOriginal ? printReady!.ingredients_clean : localRecipe.ingredients;
  const displayInstructions = inCleaned && !showOriginal ? printReady!.instructions_clean : localRecipe.instructions;
  const displayNote = inCleaned && !showOriginal ? printReady!.note_clean : localRecipe.comments;

  const guestRealName = guest ? `${guest.first_name} ${guest.last_name || ''}`.trim() : '';
  const guestName = guest
    ? (guest.printed_name ? `${guest.printed_name} (${guestRealName})` : guestRealName)
    : 'Unknown Guest';
  const guestEmail = guest?.email || null;

  const sourceLabel = localRecipe.guests?.source === 'collection'
    ? 'Collected from link'
    : 'Added manually';

  // Guest selector (edit mode) — same control as AddRecipeModal, minus "It is mine"
  const getGuestDisplayName = (g: Guest) => {
    if (g.printed_name && g.printed_name.trim()) {
      return `${g.printed_name} (${g.first_name} ${g.last_name || ''})`.trim();
    }
    return `${g.first_name} ${g.last_name || ''}`.trim();
  };

  const selectedGuestOption = guests.find(g => g.id === selectedGuestId);
  // Reason: the recipe's current guest may not be in the dropdown list (e.g. a
  // self-guest), so fall back to the name already shown in view mode.
  const guestTriggerLabel = selectedGuestOption
    ? getGuestDisplayName(selectedGuestOption)
    : guestsLoading
      ? 'Loading…'
      : guestName;

  const guestSelector = (
    <div className="mb-4 flex items-center gap-3 max-w-md">
      <Label className="text-sm font-medium text-gray-700 flex-shrink-0">
        Who&apos;s sharing this?
      </Label>
      <div className="relative flex-1" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowGuestDropdown(!showGuestDropdown)}
          disabled={guestsLoading}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-brand-sand bg-white text-sm text-brand-charcoal transition-all duration-200 hover:border-[hsl(var(--brand-honey))]/60 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-honey))]/30 focus-visible:border-[hsl(var(--brand-honey))]"
        >
          <span className="text-brand-charcoal">{guestTriggerLabel}</span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              showGuestDropdown ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showGuestDropdown && (
          <>
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[320px] overflow-auto">
              {guests.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setSelectedGuestId(g.id);
                    setShowGuestDropdown(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-200 ${
                    selectedGuestId === g.id
                      ? 'bg-[hsl(var(--brand-honey))]/10 text-brand-charcoal font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {getGuestDisplayName(g)}
                </button>
              ))}
              <div className="border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowGuestDropdown(false);
                    setShowAddGuestModal(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  Add new guest
                </button>
              </div>
            </div>
            <div
              className="fixed inset-0 z-[5]"
              onClick={() => setShowGuestDropdown(false)}
            ></div>
          </>
        )}
      </div>
    </div>
  );

  const isPdfUrl = (url: string) =>
    url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('application/pdf');

  const firstDocUrl = localRecipe.document_urls?.[0] ?? null;
  const firstDocIsPdf = firstDocUrl ? isPdfUrl(firstDocUrl) : false;

  // Helper function to determine if recipe is still processing
  const isRecipeProcessing = () => {
    if (localRecipe.upload_method !== 'image') return false;
    if (!localRecipe.document_urls || localRecipe.document_urls.length === 0) return false;

    // PDFs are not processed by the AI pipeline — never show the spinner
    if (localRecipe.document_urls.every(isPdfUrl)) return false;

    // Check if ingredients/instructions contain placeholder text
    const ingredients = localRecipe.ingredients || '';
    const instructions = localRecipe.instructions || '';

    const isPlaceholderIngredients = ingredients === 'See uploaded images';
    const isPlaceholderInstructions = instructions.match(/^\d+ images? uploaded$/);

    return isPlaceholderIngredients || isPlaceholderInstructions;
  };

  // Reason: in cleaned state the clean version exists, so never show the
  // image-OCR "processing" spinner even if the original still holds placeholder text.
  const showProcessingIndicator = isRecipeProcessing() && !inCleaned;

  // When a PDF was uploaded, ingredients/instructions keep placeholder text — show a note instead
  const hasPdfPlaceholder =
    firstDocIsPdf &&
    (localRecipe.ingredients === 'See uploaded images' ||
      !!(localRecipe.instructions || '').match(/^\d+ images? uploaded$/));

  // Format groups text
  const formatGroupsText = () => {
    if (loadingGroups) {
      return '';
    }
    if (recipeGroups.length === 0) {
      return '';
    }
    if (recipeGroups.length === 1) {
      return `. Active in Group: ${recipeGroups[0].group_name}`;
    }
    return `. Active in Groups: ${recipeGroups.map(g => g.group_name).join(', ')}`;
  };

  const loadingBlock = (
    <div role="status" className="flex-1 flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-[hsl(var(--brand-honey))]" />
    </div>
  );

  const processingBlock = (
    <div role="status" className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-[hsl(var(--brand-honey))] mb-5" />
      <h3 className="font-serif text-2xl text-brand-charcoal mb-2">Getting your recipe ready</h3>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
        We&apos;re cleaning up the spelling and formatting so it reads right in the book. Takes a few seconds.
      </p>
    </div>
  );

  // Content component for desktop - book-style layout
  const desktopContent = (
    <div className="flex-1 flex flex-col min-w-0">
      {!cleanLoaded ? loadingBlock : viewState === 'processing' ? processingBlock : (
      <>
      {/* Guest name — small caps */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400 font-serif">
          {guestName}
        </p>
        {canEdit && !isEditMode && (
          <button
            onClick={() => setIsEditMode(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            aria-label="Edit recipe"
          >
            <Edit className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Recipe title */}
      <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-brand-charcoal leading-tight mb-4">
        {displayName || 'Untitled Recipe'}
      </h2>

      {/* Fallback banner — explains why the raw original is shown */}
      {viewState === 'fallback' && !isEditMode && (
        <div className="mb-4 rounded-xl border border-[#F0DCC8] bg-[#FBEFE6] px-4 py-3">
          <p className="text-[13px] font-medium text-[#8A5A2B]">Still cleaning this one up</p>
          <p className="text-[13px] leading-relaxed text-[#8A5A2B]">
            For now you&apos;re looking at what was sent. Go ahead and edit it — we&apos;ll handle the formatting before it&apos;s printed.
          </p>
        </div>
      )}

      {/* Cleaned-state label + View original toggle */}
      {inCleaned && !isEditMode && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
          <span>
            {showOriginal
              ? 'This is the original, exactly as it was sent.'
              : '✅ This is the cleaned-up version — or your latest edit — that goes in your book.'}
          </span>
          <button
            type="button"
            onClick={() => setShowOriginal((v) => !v)}
            className="rounded-sm underline underline-offset-2 hover:text-gray-600 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--brand-honey))]/50"
          >
            {showOriginal ? 'View book version' : 'View original'}
          </button>
        </div>
      )}

      {/* Personal note */}
      {displayNote && displayNote.trim() && (
        <p className="text-base italic text-gray-500 font-serif mb-6">
          &ldquo;{displayNote}&rdquo;
        </p>
      )}

      {/* Recipe Image or PDF */}
      {firstDocUrl && (
        <div className="flex-shrink-0 mb-6">
          {firstDocIsPdf ? (
            <>
              <a
                href={firstDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 hover:bg-gray-100 transition-colors group"
              >
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-600 flex-1">Uploaded PDF</span>
                <span className="text-sm text-gray-400 group-hover:text-gray-600 transition-colors">View →</span>
              </a>
              {hasPdfPlaceholder && (
                <p className="mt-2 text-xs text-gray-400 italic">
                  We&apos;ll pull the text from this PDF and add it to the book — nothing to do on your end.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="rounded-xl overflow-hidden shadow-lg bg-gray-100">
                <div className="relative aspect-video w-full">
                  <Image
                    src={firstDocUrl}
                    alt={localRecipe.recipe_name || 'Recipe image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 65vw, 50vw"
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <a
                  href={firstDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download image
                </a>
              </div>
            </>
          )}
        </div>
      )}

      <div className="border-t border-gray-200 my-6" />

      {/* Two Column Layout — matches print layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Ingredients */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Ingredients</h3>
          {showProcessingIndicator ? (
            <div className="flex items-center text-sm text-blue-600 italic font-sans font-light m-0">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Processing image...
            </div>
          ) : hasPdfPlaceholder ? (
            <p className="text-sm text-gray-400 italic">See the PDF above</p>
          ) : displayIngredients && displayIngredients.trim() ? (
            <pre className="whitespace-pre-wrap break-words font-serif text-base text-gray-700 leading-relaxed m-0">
              {displayIngredients}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic">No ingredients provided</p>
          )}
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Instructions</h3>
          {showProcessingIndicator ? (
            <div className="flex items-center text-sm text-blue-600 italic font-sans font-light m-0">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Processing image...
            </div>
          ) : hasPdfPlaceholder ? (
            <p className="text-sm text-gray-400 italic">See the PDF above</p>
          ) : displayInstructions && displayInstructions.trim() ? (
            <pre className="whitespace-pre-wrap break-words font-serif text-base text-gray-700 leading-[1.6] m-0">
              {displayInstructions}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic">No instructions provided</p>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );

  // Content component for mobile - stacked layout
  const mobileContent = (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {!cleanLoaded ? loadingBlock : viewState === 'processing' ? processingBlock : (
      <>
      {/* Guest name — small caps */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400 font-serif">
          {guestName}
        </p>
        {canEdit && !isEditMode && (
          <button
            onClick={() => setIsEditMode(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            aria-label="Edit recipe"
          >
            <Edit className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Recipe title */}
      <h2 className="font-serif text-3xl font-semibold text-brand-charcoal leading-tight mb-4">
        {displayName || 'Untitled Recipe'}
      </h2>

      {/* Fallback banner — explains why the raw original is shown */}
      {viewState === 'fallback' && !isEditMode && (
        <div className="mb-4 rounded-xl border border-[#F0DCC8] bg-[#FBEFE6] px-4 py-3">
          <p className="text-[13px] font-medium text-[#8A5A2B]">Still cleaning this one up</p>
          <p className="text-[13px] leading-relaxed text-[#8A5A2B]">
            For now you&apos;re looking at what was sent. Go ahead and edit it — we&apos;ll handle the formatting before it&apos;s printed.
          </p>
        </div>
      )}

      {/* Cleaned-state label + View original toggle */}
      {inCleaned && !isEditMode && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
          <span>
            {showOriginal
              ? 'This is the original, exactly as it was sent.'
              : '✅ This is the cleaned-up version — or your latest edit — that goes in your book.'}
          </span>
          <button
            type="button"
            onClick={() => setShowOriginal((v) => !v)}
            className="rounded-sm underline underline-offset-2 hover:text-gray-600 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--brand-honey))]/50"
          >
            {showOriginal ? 'View book version' : 'View original'}
          </button>
        </div>
      )}

      {/* Personal note */}
      {displayNote && displayNote.trim() && (
        <p className="text-base italic text-gray-500 font-serif mb-6">
          &ldquo;{displayNote}&rdquo;
        </p>
      )}

      {/* Recipe Image or PDF */}
      {firstDocUrl && (
        <div className="flex-shrink-0 mb-6">
          {firstDocIsPdf ? (
            <>
              <a
                href={firstDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 hover:bg-gray-100 transition-colors group"
              >
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-600 flex-1">Uploaded PDF</span>
                <span className="text-sm text-gray-400 group-hover:text-gray-600 transition-colors">View →</span>
              </a>
              {hasPdfPlaceholder && (
                <p className="mt-2 text-xs text-gray-400 italic">
                  We&apos;ll pull the text from this PDF and add it to the book — nothing to do on your end.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="rounded-xl overflow-hidden shadow-lg bg-gray-100">
                <div className="relative aspect-video w-full">
                  <Image
                    src={firstDocUrl}
                    alt={localRecipe.recipe_name || 'Recipe image'}
                    fill
                    className="object-cover"
                    sizes="95vw"
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <a
                  href={firstDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download image
                </a>
              </div>
            </>
          )}
        </div>
      )}

      <div className="border-t border-gray-200 my-6" />

      {/* Stacked Layout for Mobile */}
      <div className="flex-1 space-y-6 pb-6">
        {/* Ingredients */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Ingredients</h3>
          {showProcessingIndicator ? (
            <div className="flex items-center text-sm text-blue-600 italic m-0">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Processing image...
            </div>
          ) : hasPdfPlaceholder ? (
            <p className="text-sm text-gray-400 italic">See the PDF above</p>
          ) : displayIngredients && displayIngredients.trim() ? (
            <pre className="whitespace-pre-wrap break-words font-serif text-base text-gray-700 leading-relaxed m-0">
              {displayIngredients}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic">No ingredients provided</p>
          )}
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Instructions</h3>
          {showProcessingIndicator ? (
            <div className="flex items-center text-sm text-blue-600 italic m-0">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Processing image...
            </div>
          ) : hasPdfPlaceholder ? (
            <p className="text-sm text-gray-400 italic">See the PDF above</p>
          ) : displayInstructions && displayInstructions.trim() ? (
            <pre className="whitespace-pre-wrap break-words font-serif text-base text-gray-700 leading-[1.6] m-0">
              {displayInstructions}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic">No instructions provided</p>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );

  // Edit content component for desktop - reusing AddRecipeModal styling patterns
  const desktopEditContent = (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Guest selector — lets the user reassign the recipe */}
      {guestSelector}

      {/* Recipe Title - Editable */}
      <input
        type="text"
        value={recipeTitle}
        onChange={(e) => setRecipeTitle(e.target.value)}
        placeholder="Recipe name"
        maxLength={60}
        className="w-full font-serif text-3xl lg:text-4xl font-semibold text-brand-charcoal leading-tight bg-transparent border-0 border-b-2 border-gray-200 px-0 py-2 mb-4 focus:outline-none focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 placeholder:font-normal transition-all duration-200"
        required
      />

      {/* Personal note - Editable */}
      <div className="flex-shrink-0 mb-6">
        <textarea
          value={recipeNotes}
          onChange={(e) => setRecipeNotes(e.target.value)}
          placeholder="Add a personal note..."
          className="w-full text-base italic text-gray-500 font-serif leading-relaxed bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 placeholder:not-italic resize-none min-h-[60px] transition-all duration-200"
        />
      </div>

      {/* Two Column Layout — matches print layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Ingredients */}
        <div className="flex flex-col">
          <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Ingredients</h3>
          <textarea
            value={recipeIngredients}
            onChange={(e) => setRecipeIngredients(e.target.value)}
            placeholder="Pecorino, not parmesan. Good eggs. The real guanciale."
            className="flex-1 text-base text-gray-700 leading-relaxed whitespace-pre-wrap bg-white border border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 resize-none font-serif transition-all duration-200 min-h-[120px]"
          />
        </div>

        {/* Instructions */}
        <div className="flex flex-col">
          <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Instructions</h3>
          <textarea
            value={recipeInstructions}
            onChange={(e) => setRecipeInstructions(e.target.value)}
            placeholder="Start with cold pan. Trust the process. Save the pasta water—you will need it."
            className="flex-1 text-base text-gray-700 leading-[1.6] whitespace-pre-wrap bg-white border border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 resize-none font-serif transition-all duration-200 min-h-[200px]"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex-shrink-0 bg-red-50/50 border border-red-200 rounded-xl p-3 mt-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );

  // Edit content component for mobile - reusing AddRecipeModal styling patterns
  const mobileEditContent = (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Guest selector — lets the user reassign the recipe */}
      {guestSelector}

      {/* Recipe Title - Editable */}
      <input
        type="text"
        value={recipeTitle}
        onChange={(e) => setRecipeTitle(e.target.value)}
        placeholder="Recipe name"
        maxLength={60}
        className="w-full font-serif text-3xl font-semibold text-brand-charcoal leading-tight bg-transparent border-0 border-b-2 border-gray-200 px-0 py-2 mb-4 focus:outline-none focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 transition-all duration-200"
        required
      />

      {/* Personal note - Editable */}
      <textarea
        id="recipeNotes"
        value={recipeNotes}
        onChange={(e) => setRecipeNotes(e.target.value)}
        placeholder="Add a personal note..."
        className="w-full text-base italic text-gray-500 font-serif leading-relaxed bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 placeholder:not-italic resize-vertical min-h-[140px] transition-all duration-200"
      />

      {/* Stacked Layout for Mobile */}
      <div className="flex-1 space-y-6 pb-6">
        {/* Ingredients */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Ingredients</h3>
          <textarea
            id="recipeIngredients"
            value={recipeIngredients}
            onChange={(e) => setRecipeIngredients(e.target.value)}
            placeholder="Pecorino, not parmesan. Good eggs. The real guanciale."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] resize-vertical min-h-[180px] bg-white font-serif transition-all duration-200 placeholder:text-gray-400"
          />
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-gray-500 font-semibold mb-3">Instructions</h3>
          <textarea
            id="recipeInstructions"
            value={recipeInstructions}
            onChange={(e) => setRecipeInstructions(e.target.value)}
            placeholder="Start with cold pan. Trust the process. Save the pasta water—you will need it."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] resize-vertical min-h-[220px] bg-white font-serif transition-all duration-200 placeholder:text-gray-400"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );

  // Clean-up explainer — a proper modal (matches AddFriendToGroupModal styling)
  // so it reads clean and trustworthy, not like a cramped tooltip.
  const cleaningInfoModal = (
    <Dialog open={showCleaningInfo} onOpenChange={setShowCleaningInfo}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="type-modal-title">We auto-clean every recipe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-gray-600 text-base leading-relaxed">
            The first time a recipe is sent in, we run a quick clean-up: we fix obvious typos and
            tidy the formatting so every page in the book reads the same way. We don&apos;t rewrite
            the recipe or change anyone&apos;s voice — and anything you edit afterward stays exactly
            as you wrote it.
          </p>
          <p className="text-gray-600 text-base leading-relaxed">
            What you see here is that cleaned-up version. To compare it with exactly what was
            sent, tap <span className="font-medium text-brand-charcoal">View original</span> under
            the title.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Mobile version - Sheet that slides up from bottom
  if (isMobile) {
    return (
      <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="!h-[85vh] !max-h-[85vh] rounded-t-[20px] flex flex-col overflow-hidden p-0">
          <div className="px-6 pt-6 pb-6 flex flex-col h-full overflow-hidden">
            <SheetHeader className="px-0 flex-shrink-0 mb-4">
              <SheetTitle className="type-modal-title">
                <span className="inline-flex items-center gap-2">
                  <span>Recipe Details</span>
                  <button
                    type="button"
                    aria-label="About the clean-up"
                    aria-expanded={showCleaningInfo}
                    onClick={() => setShowCleaningInfo(true)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[hsl(var(--brand-warm-gray))] transition-colors hover:bg-[hsl(var(--brand-sand))]/50 hover:text-[hsl(var(--brand-charcoal))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-honey))]/40"
                  >
                    <Info className="h-[18px] w-[18px]" />
                  </button>
                </span>
              </SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col overflow-y-auto">
              {isEditMode ? mobileEditContent : mobileContent}
            </div>
            
            {/* Save/Cancel Buttons - Fixed bottom for mobile when in edit mode.
                Side-by-side (each flex-1) to free up vertical space for typing — matches AddRecipeModal. */}
            {isEditMode && (
              <div className="mt-4 pb-safe flex-shrink-0 flex gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 rounded-full border border-[rgba(45,45,45,0.14)] py-3.5 text-[15px] font-medium text-brand-charcoal transition-colors hover:bg-[rgba(45,45,45,0.03)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.18)] focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 rounded-full bg-brand-charcoal py-3.5 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Nested AddGuestModal */}
      <AddGuestModal
        isOpen={showAddGuestModal}
        onClose={() => setShowAddGuestModal(false)}
        onGuestAdded={handleGuestAdded}
        groupId={localRecipe.group_id || recipeGroups[0]?.group_id || undefined}
      />
      {cleaningInfoModal}
      </>
    );
  }

  // Desktop version - Dialog popup (centered)
  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 bg-white">
        <DialogHeader className="flex-shrink-0 px-8 pt-6 pb-2">
          <DialogTitle className="type-modal-title text-gray-900">
            <span className="inline-flex items-center gap-2">
              <span>Recipe Details</span>
              <button
                type="button"
                aria-label="About the clean-up"
                aria-expanded={showCleaningInfo}
                onClick={() => setShowCleaningInfo(true)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[hsl(var(--brand-warm-gray))] transition-colors hover:bg-[hsl(var(--brand-sand))]/50 hover:text-[hsl(var(--brand-charcoal))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-honey))]/40"
              >
                <Info className="h-[18px] w-[18px]" />
              </button>
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col pl-8 pr-8 pt-8 pb-6 min-w-0 overflow-y-auto">
          {isEditMode ? desktopEditContent : desktopContent}
        </div>

        {/* Action Buttons - Fixed position at bottom when in edit mode */}
          {isEditMode && (
          <div className="flex justify-end gap-3 flex-shrink-0 bg-white px-8 py-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="rounded-full border border-[rgba(45,45,45,0.14)] px-6 py-3 text-[15px] font-medium text-brand-charcoal transition-colors hover:bg-[rgba(45,45,45,0.03)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.18)] focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="rounded-full bg-brand-charcoal px-6 py-3 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
            </div>
          )}
      </DialogContent>
    </Dialog>

    {/* Nested AddGuestModal */}
    <AddGuestModal
      isOpen={showAddGuestModal}
      onClose={() => setShowAddGuestModal(false)}
      onGuestAdded={handleGuestAdded}
      groupId={localRecipe.group_id || recipeGroups[0]?.group_id || undefined}
    />
    {cleaningInfoModal}
    </>
  );
}

