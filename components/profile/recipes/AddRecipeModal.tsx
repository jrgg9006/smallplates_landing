"use client";

import React, { useState, useEffect } from "react";
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
import { addRecipe, addUserRecipe, addRecipeWithFiles } from "@/lib/supabase/recipes";
import { addRecipeToCookbook } from "@/lib/supabase/cookbooks";
import { addRecipeToGroup } from "@/lib/supabase/groupRecipes";
import { getGuests } from "@/lib/supabase/guests";
import { getCurrentProfile, getSelfGuestPrintedName } from "@/lib/supabase/profiles";
import { Guest } from "@/lib/types/database";
import { ChevronDown, Plus, PenTool, Camera } from "lucide-react";
import { RecipeImageUpload } from "./RecipeImageUpload";
import { AddGuestModal } from "@/components/profile/guests/AddGuestModal";

interface AddPlateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeAdded?: () => void; // Callback to refresh the plate list
  cookbookId?: string | null; // Optional cookbook ID to auto-add plate after creation
  groupId: string | null; // Group ID is now REQUIRED when not null - enforce it
  preselectedGuestId?: string | null; // Optional guest ID to pre-select
}

export function AddRecipeModal({ isOpen, onClose, onRecipeAdded, cookbookId, groupId, preselectedGuestId }: AddPlateModalProps) {
  // Debug: Log when modal opens with different contexts
  React.useEffect(() => {
    if (isOpen) {
      // console.log removed for production
    }
  }, [isOpen, cookbookId, groupId]);
  // Responsive hook to detect mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640); // sm breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [selectedGuestId, setSelectedGuestId] = useState<string>('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [isMyOwnRecipe, setIsMyOwnRecipe] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'text' | 'image'>('text');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  const [recipeNotes, setRecipeNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userPrintedName, setUserPrintedName] = useState<string>('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Load guests and user profile when modal opens
  useEffect(() => {
    if (isOpen) {
      loadGuests();
      loadUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Reason: loadGuests/loadUserProfile are stable functions, only run on modal open

  // Set preselected guest when modal opens with a preselected guest
  useEffect(() => {
    if (isOpen && preselectedGuestId) {
      setSelectedGuestId(preselectedGuestId);
      setIsMyOwnRecipe(false); // Ensure "My Own Plate" is unchecked when preselecting a guest
    }
  }, [isOpen, preselectedGuestId]);

  const loadUserProfile = async () => {
    try {
      const { data: profile, error: profileError } = await getCurrentProfile();
      if (profileError || !profile) {
        console.error('Error loading user profile:', profileError);
        return;
      }
      setUserName(profile.full_name || '');

      // Also load printed_name from guest record
      const { data: printedName } = await getSelfGuestPrintedName();
      if (printedName) {
        setUserPrintedName(printedName);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  // Close dropdown when clicking outside
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

  const loadGuests = async () => {
    setGuestsLoading(true);
    try {
      const { data: guestsData, error: guestsError } = await getGuests(groupId || undefined, false);
      
      if (guestsError) {
        console.error('Error loading guests:', guestsError);
        setError('Failed to load guests');
        return;
      }
      
      setGuests(guestsData || []);
      
      // Auto-select first guest if only one exists
      if (guestsData && guestsData.length === 1) {
        setSelectedGuestId(guestsData[0].id);
      }
    } catch (err) {
      console.error('Error loading guests:', err);
      setError('Failed to load guests');
    } finally {
      setGuestsLoading(false);
    }
  };

  const handleGuestAdded = async (newGuestId?: string) => {
    // Refresh the guest list
    await loadGuests();
    
    // Auto-select the newly created guest if ID is provided
    if (newGuestId) {
      setSelectedGuestId(newGuestId);
    }
    
    // Close the AddGuestModal
    setShowAddGuestModal(false);
  };

  const resetForm = () => {
    setSelectedGuestId('');
    setIsMyOwnRecipe(false);
    setUploadMethod('text');
    setSelectedFiles([]);
    setUploadProgress(0);
    setRecipeTitle('');
    setRecipeIngredients('');
    setRecipeInstructions('');
    setRecipeNotes('');
    setError(null);
    setUserPrintedName('');
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSave = async () => {
    // Critical validation: Ensure we have a target (group or cookbook)
    if (!groupId && !cookbookId) {
      setError("Unable to save recipe: No collection specified. Please contact support.");
      return;
    }

    // Validation
    if (!isMyOwnRecipe && !selectedGuestId) {
      setError("Whose recipe is this?");
      return;
    }

    if (!recipeTitle.trim()) {
      setError("Every recipe needs a name");
      return;
    }

    // Validation based on upload method
    if (uploadMethod === 'image') {
      if (selectedFiles.length === 0) {
        setError("Show us what you're making");
        return;
      }
    } else {
      if (!recipeInstructions.trim()) {
        setError("Tell us how to make it");
        return;
      }
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      let createdRecipeId: string | null = null;

      // If groupId is provided, create plate directly in the group
      // console.log removed for production
      if (groupId) {
        // console.log removed for production
        if (uploadMethod === 'image') {
          // For groups with image uploads, we need to use a different approach
          // First create the recipe with files, then add it to the group
          setUploadProgress(20);
          
          const formData = isMyOwnRecipe
            ? {
                recipeName: recipeTitle.trim(),
                ingredients: '', // Not used in image mode, but required by type
                instructions: '', // Not used in image mode, but required by type
                personalNote: recipeNotes.trim() || undefined,
              }
            : {
                recipe_name: recipeTitle.trim(),
                ingredients: '', // Not used in image mode, but required by type
                instructions: '', // Not used in image mode, but required by type
                comments: recipeNotes.trim() || undefined,
              };

          const { data: recipeResult, error: recipeError } = await addRecipeWithFiles(
            isMyOwnRecipe ? null : selectedGuestId,
            formData,
            selectedFiles,
            isMyOwnRecipe,
            groupId
          );

          setUploadProgress(50);

          if (recipeError) {
            setError(recipeError);
            setLoading(false);
            setUploadProgress(0);
            return;
          }

          createdRecipeId = recipeResult?.id || null;
          
          // Add the recipe to the group
          if (createdRecipeId) {
            // console.log removed for production
            const { error: groupError } = await addRecipeToGroup(groupId, createdRecipeId);
            if (groupError) {
              console.error('❌ Failed to add recipe to group:', groupError);
              // Plate was created but not added to group - still continue
            } else {
              // console.log removed for production
            }
          } else {
            console.error('❌ No recipe ID returned after creation!');
          }

          setUploadProgress(100);
        } else {
          // Text mode: create recipe using existing functions, then add to group
          if (isMyOwnRecipe) {
            const userRecipeData = {
              recipeName: recipeTitle.trim(),
              ingredients: recipeIngredients.trim(),
              instructions: recipeInstructions.trim(),
              personalNote: recipeNotes.trim() || undefined,
            };

            const { data: userRecipeData_result, error: recipeError } = await addUserRecipe(userRecipeData, groupId);
            
            if (recipeError) {
              setError(recipeError);
              setLoading(false);
              return;
            }

            createdRecipeId = userRecipeData_result?.id || null;
          } else {
            const recipeData = {
              recipe_name: recipeTitle.trim(),
              ingredients: recipeIngredients.trim(),
              instructions: recipeInstructions.trim(),
              comments: recipeNotes.trim() || undefined,
            };

            const { data: recipeData_result, error: recipeError } = await addRecipe(selectedGuestId, recipeData, groupId);
            
            if (recipeError) {
              setError(recipeError);
              setLoading(false);
              return;
            }

            createdRecipeId = recipeData_result?.id || null;
          }
          
          // Add the recipe to the group
          if (createdRecipeId) {
            // console.log removed for production
            const { error: groupError } = await addRecipeToGroup(groupId, createdRecipeId);
            if (groupError) {
              console.error('❌ Failed to add recipe to group:', groupError);
              // Plate was created but not added to group - still continue
            } else {
              // console.log removed for production
            }
          } else {
            console.error('❌ No recipe ID returned after creation!');
          }
        }

        // Note: addRecipeToGroup already adds the recipe to the group cookbook automatically
      } else {
        // Regular recipe creation (not for a group)
        if (uploadMethod === 'image') {
          // Image mode: use addRecipeWithFiles
          setUploadProgress(20);
          
          const formData = isMyOwnRecipe
            ? {
                recipeName: recipeTitle.trim(),
                ingredients: '', // Not used in image mode, but required by type
                instructions: '', // Not used in image mode, but required by type
                personalNote: recipeNotes.trim() || undefined,
              }
            : {
                recipe_name: recipeTitle.trim(),
                ingredients: '', // Not used in image mode, but required by type
                instructions: '', // Not used in image mode, but required by type
                comments: recipeNotes.trim() || undefined,
              };

          const { data: recipeResult, error: recipeError } = await addRecipeWithFiles(
            isMyOwnRecipe ? null : selectedGuestId,
            formData,
            selectedFiles,
            isMyOwnRecipe,
            groupId
          );

          setUploadProgress(100);

          if (recipeError) {
            setError(recipeError);
            setLoading(false);
            setUploadProgress(0);
            return;
          }

          createdRecipeId = recipeResult?.id || null;
        } else {
          // Text mode: use existing functions
          if (isMyOwnRecipe) {
            const userRecipeData = {
              recipeName: recipeTitle.trim(),
              ingredients: recipeIngredients.trim(),
              instructions: recipeInstructions.trim(),
              personalNote: recipeNotes.trim() || undefined,
            };

            const { data: userRecipeData_result, error: recipeError } = await addUserRecipe(userRecipeData, groupId);
            
            if (recipeError) {
              setError(recipeError);
              setLoading(false);
              return;
            }

            createdRecipeId = userRecipeData_result?.id || null;
          } else {
            const recipeData = {
              recipe_name: recipeTitle.trim(),
              ingredients: recipeIngredients.trim(),
              instructions: recipeInstructions.trim(),
              comments: recipeNotes.trim() || undefined,
            };

            const { data: recipeData_result, error: recipeError } = await addRecipe(selectedGuestId, recipeData, groupId);
            
            if (recipeError) {
              setError(recipeError);
              setLoading(false);
              return;
            }

            createdRecipeId = recipeData_result?.id || null;
          }
        }

        // If cookbookId is provided and recipe was created successfully, add it to the cookbook
        if (cookbookId && createdRecipeId) {
          const { error: addToCookbookError } = await addRecipeToCookbook(cookbookId, createdRecipeId);
          
          if (addToCookbookError) {
            console.error('Failed to add recipe to cookbook:', addToCookbookError);
          }
        }
      }

      // Success! Reset form and close modal
      resetForm();
      onClose();
      
      // Refresh the recipe list if callback provided
      if (onRecipeAdded) {
        onRecipeAdded();
      }

    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error adding recipe:', err);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const selectedGuest = guests.find(g => g.id === selectedGuestId);
  const getGuestDisplayName = (guest: Guest) => {
    if (guest.printed_name && guest.printed_name.trim()) {
      return `${guest.printed_name} (${guest.first_name} ${guest.last_name || ''})`.trim();
    }
    return `${guest.first_name} ${guest.last_name || ''}`.trim();
  };

  const guestTriggerLabel = isMyOwnRecipe
    ? 'It is mine'
    : selectedGuestId && selectedGuest
      ? getGuestDisplayName(selectedGuest)
      : guestsLoading
        ? 'Loading…'
        : 'Select';
  const guestTriggerHasValue = isMyOwnRecipe || Boolean(selectedGuestId);

  const selectMine = () => {
    setIsMyOwnRecipe(true);
    setSelectedGuestId('');
    setShowGuestDropdown(false);
  };
  const selectGuest = (guestId: string) => {
    setIsMyOwnRecipe(false);
    setSelectedGuestId(guestId);
    setShowGuestDropdown(false);
  };

  const noteLabel = groupId ? 'Add a note to the couple' : 'Add a note';

  // Desktop content component - spacious and organized
  const desktopContent = (
    <div className="flex-1 overflow-hidden flex flex-col min-w-0 pr-10 pt-6">
      {/* Main Content Grid - Controls on left, Recipe content on right */}
      <div className="flex-1 grid grid-cols-[240px_1fr] gap-10">
        {/* Left Column: Controls */}
        <div className="flex flex-col space-y-8">
          {/* Guest Selector — single control, "It is mine" lives inside the menu */}
          <div>
            <Label htmlFor="guest" className="text-sm font-medium text-gray-700 mb-3 block">
              Who&apos;s sharing this? <span className="text-[hsl(var(--brand-honey))] text-xs">*</span>
            </Label>
            <div className="relative mt-1" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                disabled={guestsLoading}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm bg-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none ${
                  showGuestDropdown || guestTriggerHasValue
                    ? 'border-brand-sand bg-brand-sand/40'
                    : 'border-gray-200 hover:border-brand-sand hover:shadow-sm'
                }`}
              >
                <span className={guestTriggerHasValue ? 'text-brand-charcoal font-medium' : 'text-gray-500'}>
                  {guestTriggerLabel}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    showGuestDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showGuestDropdown && (
                <>
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[320px] overflow-auto">
                    <button
                      type="button"
                      onClick={selectMine}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors duration-200 ${
                        isMyOwnRecipe
                          ? 'bg-brand-sand/40 text-brand-charcoal font-medium'
                          : 'text-gray-700 hover:bg-brand-warm-white-warm'
                      }`}
                    >
                      It is mine
                    </button>
                    {guests.map((guest) => (
                      <button
                        key={guest.id}
                        type="button"
                        onClick={() => selectGuest(guest.id)}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors duration-200 ${
                          !isMyOwnRecipe && selectedGuestId === guest.id
                            ? 'bg-brand-sand/40 text-brand-charcoal font-medium'
                            : 'text-gray-700 hover:bg-brand-warm-white-warm'
                        }`}
                      >
                        {getGuestDisplayName(guest)}
                      </button>
                    ))}
                    <div className="border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowGuestDropdown(false);
                          setShowAddGuestModal(true);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-brand-warm-white-warm flex items-center gap-2 transition-colors duration-200"
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

          {/* Recipe Type Toggle - Tab Style */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">How will you share it?</Label>
            <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod('text');
                    setSelectedFiles([]);
                  }}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    uploadMethod === 'text'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod('image');
                    setRecipeIngredients('');
                    setRecipeInstructions('');
                  }}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    uploadMethod === 'image'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Images
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recipe Content */}
        <div className="flex flex-col min-w-0 h-full">
          {/* Recipe Title - Fixed Height */}
          <div className="flex-shrink-0 mb-6">
            <div className="relative">
              <input
                type="text"
                value={recipeTitle}
                onChange={(e) => setRecipeTitle(e.target.value)}
                placeholder="Late Night Carbonara"
                maxLength={60}
                className="w-full font-serif text-3xl font-semibold text-gray-900 leading-tight border-0 border-b-2 border-gray-200 px-0 py-4 focus:outline-none focus:border-[hsl(var(--brand-honey))] bg-transparent placeholder:text-gray-400 placeholder:font-normal transition-all duration-200"
                required
              />
              {recipeTitle.length > 50 && (
                <span className="absolute right-0 top-4 text-xs text-gray-400">
                  {recipeTitle.length}/60
                </span>
              )}
            </div>
            {/* Subtitle - Shared by */}
            {!isMyOwnRecipe && selectedGuest && (
              <p className="font-serif italic text-base text-gray-600 mt-2">
                from {selectedGuest.printed_name || `${selectedGuest.first_name} ${selectedGuest.last_name || ''}`.trim()}
              </p>
            )}
            {isMyOwnRecipe && (userName || userPrintedName) && (
              <p className="font-serif italic text-base text-gray-600 mt-2">
                from {userPrintedName || userName}
              </p>
            )}
          </div>

          {/* Personal Note - Fixed Height */}
          <div className="flex-shrink-0 mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">{noteLabel}</Label>
            <textarea
              value={recipeNotes}
              onChange={(e) => setRecipeNotes(e.target.value)}
              placeholder="Made this at 2am more times than I will admit."
              className="w-full text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 resize-none h-16 transition-all duration-200"
            />
          </div>

          {/* Recipe Content - Takes Remaining Space */}
          <div className="flex-1 min-h-0">
            {uploadMethod === 'image' ? (
              <div className="h-full flex flex-col">
                <Label className="text-sm font-medium text-gray-700 mb-4 block flex-shrink-0">
                  Show us what you&apos;re making <span className="text-[hsl(var(--brand-honey))] text-xs">*</span>
                </Label>
                <div className="flex-1">
                  <RecipeImageUpload
                    onFilesSelected={setSelectedFiles}
                    selectedFiles={selectedFiles}
                    error={error}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-[1fr_2fr] gap-8 h-full">
                {/* Ingredients Column */}
                <div className="flex flex-col h-full">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block flex-shrink-0">Ingredients</Label>
                  <textarea
                    value={recipeIngredients}
                    onChange={(e) => setRecipeIngredients(e.target.value)}
                    placeholder="Pecorino, not parmesan. Good eggs. The real guanciale."
                    className="flex-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white border border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 resize-none transition-all duration-200"
                  />
                </div>

                {/* Instructions Column */}
                <div className="flex flex-col h-full">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block flex-shrink-0">
                    Instructions <span className="text-[hsl(var(--brand-honey))] text-xs">*</span>
                  </Label>
                  <textarea
                    value={recipeInstructions}
                    onChange={(e) => setRecipeInstructions(e.target.value)}
                    placeholder="Start with cold pan. Trust the process. Save the pasta water—you will need it."
                    className="flex-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white border border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] placeholder:text-gray-400 resize-none transition-all duration-200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50/50 border border-red-200 rounded-xl p-3 mt-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );

  // Mobile content component - keep original form layout
  const modalContent = (
    <>
      <div className="space-y-6">
        {/* Guest Selector — single control, "It is mine" lives inside the menu */}
        <div>
          <Label htmlFor="guest" className="text-sm font-medium text-gray-700">
            Who&apos;s sharing this? <span className="text-[hsl(var(--brand-honey))] text-xs">*</span>
          </Label>
          <div className="relative mt-1" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowGuestDropdown(!showGuestDropdown)}
              disabled={guestsLoading}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm bg-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none ${
                showGuestDropdown || guestTriggerHasValue
                  ? 'border-brand-sand bg-brand-sand/40'
                  : 'border-gray-200 hover:border-brand-sand hover:shadow-sm'
              }`}
            >
              <span className={guestTriggerHasValue ? 'text-brand-charcoal font-medium' : 'text-gray-500'}>
                {guestTriggerLabel}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  showGuestDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showGuestDropdown && (
              <>
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[320px] overflow-auto">
                  <button
                    type="button"
                    onClick={selectMine}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors duration-200 ${
                      isMyOwnRecipe
                        ? 'bg-brand-sand/40 text-brand-charcoal font-medium'
                        : 'text-gray-700 hover:bg-brand-warm-white-warm'
                    }`}
                  >
                    It is mine
                  </button>
                  {guests.map((guest) => (
                    <button
                      key={guest.id}
                      type="button"
                      onClick={() => selectGuest(guest.id)}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors duration-200 ${
                        !isMyOwnRecipe && selectedGuestId === guest.id
                          ? 'bg-brand-sand/40 text-brand-charcoal font-medium'
                          : 'text-gray-700 hover:bg-brand-warm-white-warm'
                      }`}
                    >
                      {getGuestDisplayName(guest)}
                    </button>
                  ))}
                  <div className="border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowGuestDropdown(false);
                        setShowAddGuestModal(true);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-brand-warm-white-warm flex items-center gap-2 transition-colors duration-200"
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

        {/* Upload Method Toggle - Tab Style */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">How will you share it?</Label>
          <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  setUploadMethod('text');
                  setSelectedFiles([]);
                }}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  uploadMethod === 'text'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-transparent text-gray-600'
                }`}
              >
                <PenTool className="w-4 h-4" />
                Text
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMethod('image');
                  setRecipeIngredients('');
                  setRecipeInstructions('');
                }}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  uploadMethod === 'image'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-transparent text-gray-600'
                }`}
              >
                <Camera className="w-4 h-4" />
                Images
              </button>
            </div>
          </div>
        </div>

        {/* Recipe Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="recipeTitle" className="text-sm font-medium text-gray-700">Recipe Name <span className="text-[hsl(var(--brand-honey))] text-xs">*</span></Label>
            <span className="text-xs text-gray-400">
              {recipeTitle.length}/60
            </span>
          </div>
          <input
            id="recipeTitle"
            type="text"
            value={recipeTitle}
            onChange={(e) => setRecipeTitle(e.target.value)}
            maxLength={60}
            placeholder="Late Night Carbonara"
            required
            className="mt-1 w-full font-serif text-2xl font-semibold text-gray-900 leading-tight border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] bg-white placeholder:text-gray-400 placeholder:font-normal placeholder:text-base transition-all duration-200"
          />
        </div>

        {/* Personal note */}
        <div>
          <Label htmlFor="recipeNotes" className="text-sm font-medium text-gray-700">{noteLabel}</Label>
          <textarea
            id="recipeNotes"
            value={recipeNotes}
            onChange={(e) => setRecipeNotes(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] resize-vertical min-h-[80px] bg-white transition-all duration-200"
            placeholder="Made this at 2am more times than I will admit."
          />
        </div>
        
        {/* Conditional Form Fields Based on Upload Method */}
        {uploadMethod === 'image' ? (
          <>
            {/* Image Mode: Image Upload only (notes moved above) */}            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Show us what you&apos;re making <span className="text-[hsl(var(--brand-honey))] text-xs">*</span></Label>
              <RecipeImageUpload
                onFilesSelected={setSelectedFiles}
                selectedFiles={selectedFiles}
                error={error}
              />
            </div>
          </>
        ) : (
          <>
            {/* Text Mode: Ingredients and Instructions only (notes moved above) */}
        <div>
          <Label htmlFor="recipeIngredients" className="text-sm font-medium text-gray-700">Ingredients</Label>
          <textarea
            id="recipeIngredients"
            value={recipeIngredients}
            onChange={(e) => setRecipeIngredients(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] resize-vertical min-h-[100px] bg-white transition-all duration-200"
            placeholder="Pecorino, not parmesan. Good eggs. The real guanciale."
          />
        </div>
        
        <div>
          <Label htmlFor="recipeInstructions" className="text-sm font-medium text-gray-700">Instructions <span className="text-[hsl(var(--brand-honey))] text-xs">*</span></Label>
          <textarea
            id="recipeInstructions"
            value={recipeInstructions}
            onChange={(e) => setRecipeInstructions(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-honey))]/20 focus:border-[hsl(var(--brand-honey))] resize-vertical min-h-[140px] bg-white transition-all duration-200"
            placeholder="Start with cold pan. Trust the process. Save the pasta water—you will need it."
          />
        </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </>
  );

  // Mobile version - Sheet that slides up from bottom
  if (isMobile) {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={onClose}>
          <SheetContent side="bottom" className="!h-[92dvh] !max-h-[92dvh] rounded-t-[20px] flex flex-col overflow-hidden p-0 bg-white">
            {/* Drag handle */}
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-300 flex-shrink-0" />

            {/* Header */}
            <SheetHeader className="flex-shrink-0 px-6 pt-4 pb-3">
              <SheetTitle className="type-modal-title">Add a new Recipe</SheetTitle>
            </SheetHeader>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {modalContent}
            </div>

            {/* Sticky action bar — always visible, respects iPhone home bar.
                Mobile: full-width side-by-side, each flex-1, large tap targets. */}
            <div
              className="flex-shrink-0 flex gap-3 border-t border-brand-sand bg-white px-6 pt-4"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            >
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
                disabled={loading || (!isMyOwnRecipe && guests.length === 0)}
                className="flex-1 rounded-full bg-brand-charcoal py-3.5 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Nested AddGuestModal */}
        <AddGuestModal
          isOpen={showAddGuestModal}
          onClose={() => setShowAddGuestModal(false)}
          onGuestAdded={handleGuestAdded}
          groupId={groupId || undefined}
        />
      </>
    );
  }

  // Desktop version - Dialog popup (centered)
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 bg-white">
          <DialogHeader className="flex-shrink-0 px-8 pt-6 pb-2">
            <DialogTitle className="type-modal-title text-gray-900">Add a new Recipe</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col pl-8 pr-8 pb-6 min-w-0">
            {desktopContent}
          </div>
          
          {/* Action Buttons - Fixed position at bottom.
              Desktop: right-aligned, auto width (modal is wide, so full-width would look off). */}
          <div className="flex justify-end gap-3 flex-shrink-0 bg-white px-8 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-full border border-[rgba(45,45,45,0.14)] px-8 py-3.5 text-[15px] font-medium text-brand-charcoal transition-colors hover:bg-[rgba(45,45,45,0.03)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.18)] focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || (!isMyOwnRecipe && guests.length === 0)}
              className="rounded-full bg-brand-charcoal px-8 py-3.5 text-[15px] font-medium text-brand-warm-white-warm transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(45,45,45,0.25)] focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Nested AddGuestModal */}
      <AddGuestModal
        isOpen={showAddGuestModal}
        onClose={() => setShowAddGuestModal(false)}
        onGuestAdded={handleGuestAdded}
        groupId={groupId || undefined}
      />
    </>
  );
}

