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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addRecipe, addUserRecipe, addRecipeWithFiles } from "@/lib/supabase/recipes";
import { addRecipeToCookbook } from "@/lib/supabase/cookbooks";
import { addRecipeToGroup } from "@/lib/supabase/groupRecipes";
import { getGuests } from "@/lib/supabase/guests";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import { Guest } from "@/lib/types/database";
import { ChevronDown, Plus } from "lucide-react";
import { RecipeImageUpload } from "./RecipeImageUpload";
import { AddGuestModal } from "@/components/profile/guests/AddGuestModal";

interface AddPlateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeAdded?: () => void; // Callback to refresh the plate list
  cookbookId?: string | null; // Optional cookbook ID to auto-add plate after creation
  groupId?: string | null; // Optional group ID to create plate directly in group
  preselectedGuestId?: string | null; // Optional guest ID to pre-select
}

export function AddRecipeModal({ isOpen, onClose, onRecipeAdded, cookbookId, groupId, preselectedGuestId }: AddPlateModalProps) {
  // Debug: Log when modal opens with different contexts
  React.useEffect(() => {
    if (isOpen) {
      console.log('DEBUG: AddPlateModal opened with context:', { cookbookId, groupId });
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
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Load guests and user profile when modal opens
  useEffect(() => {
    if (isOpen) {
      loadGuests();
      loadUserProfile();
    }
  }, [isOpen]);

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
      const { data: guestsData, error: guestsError } = await getGuests(false);
      
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
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleSave = async () => {
    // Validation
    if (!isMyOwnRecipe && !selectedGuestId) {
      setError('Please select a guest or check "This is my own plate"');
      return;
    }

    if (!recipeTitle.trim()) {
      setError('Please fill in Plate Title');
      return;
    }

    // Validation based on upload method
    if (uploadMethod === 'image') {
      if (selectedFiles.length === 0) {
        setError('Please upload at least one image');
        return;
      }
    } else {
    if (!recipeIngredients.trim() || !recipeInstructions.trim()) {
      setError('Please fill in Ingredients and Instructions');
      return;
      }
    }

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      let createdRecipeId: string | null = null;

      // If groupId is provided, create plate directly in the group
      console.log('DEBUG: Recipe creation starting', { groupId, isMyOwnRecipe, uploadMethod });
      if (groupId) {
        console.log('DEBUG: Creating recipe for group', groupId);
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
            isMyOwnRecipe
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
            const { error: groupError } = await addRecipeToGroup(groupId, createdRecipeId);
            if (groupError) {
              console.error('Failed to add recipe to group:', groupError);
              // Plate was created but not added to group - still continue
            }
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

            const { data: userRecipeData_result, error: recipeError } = await addUserRecipe(userRecipeData);
            
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

            const { data: recipeData_result, error: recipeError } = await addRecipe(selectedGuestId, recipeData);
            
            if (recipeError) {
              setError(recipeError);
              setLoading(false);
              return;
            }

            createdRecipeId = recipeData_result?.id || null;
          }
          
          // Add the recipe to the group
          if (createdRecipeId) {
            const { error: groupError } = await addRecipeToGroup(groupId, createdRecipeId);
            if (groupError) {
              console.error('Failed to add recipe to group:', groupError);
              // Plate was created but not added to group - still continue
            }
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
            isMyOwnRecipe
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

            const { data: userRecipeData_result, error: recipeError } = await addUserRecipe(userRecipeData);
            
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

            const { data: recipeData_result, error: recipeError } = await addRecipe(selectedGuestId, recipeData);
            
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

  // Desktop content component - restructured to look like a recipe page
  const desktopContent = (
    <div className="flex-1 overflow-y-auto flex flex-col min-w-0">
      {/* Top Section: Split Left/Right */}
      <div className="flex-shrink-0 grid grid-cols-[1fr_4fr] gap-4 mb-8 pb-8 border-b border-gray-200">
        {/* Left Side: Guest, Checkbox, Recipe Type */}
        <div className="flex flex-col space-y-4">
          {/* Guest Selector */}
          <div>
            <Label htmlFor="guest" className="text-sm font-medium text-gray-600">
              Guest {!isMyOwnRecipe && '*'}
            </Label>
            {!isMyOwnRecipe && (
              <>
                {guestsLoading ? (
                  <div className="mt-1 text-sm text-gray-500">Loading guests...</div>
                ) : guests.length === 0 ? (
                  <div className="mt-1">
                    <p className="text-sm text-gray-500 mb-2">No guests available. Please add a guest first.</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddGuestModal(true);
                      }}
                      className="text-sm"
                    >
                      Add Guest
                    </Button>
                  </div>
                ) : (
                  <div className="relative mt-1" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 focus:outline-none focus:border-gray-500"
                    >
                      <span className={selectedGuestId ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedGuestId && selectedGuest
                          ? getGuestDisplayName(selectedGuest)
                          : 'Select a guest'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    
                    {showGuestDropdown && (
                      <>
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {guests.map((guest) => (
                            <button
                              key={guest.id}
                              type="button"
                              onClick={() => {
                                setSelectedGuestId(guest.id);
                                setShowGuestDropdown(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                                selectedGuestId === guest.id
                                  ? 'bg-gray-100 text-gray-900 font-medium'
                                  : 'text-gray-700'
                              }`}
                            >
                              {getGuestDisplayName(guest)}
                            </button>
                          ))}
                          <div className="border-t border-gray-200 mt-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setShowGuestDropdown(false);
                                setShowAddGuestModal(true);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add New Guest
                            </button>
                          </div>
                        </div>
                        {/* Overlay to close dropdown */}
                        <div 
                          className="fixed inset-0 z-[5]" 
                          onClick={() => setShowGuestDropdown(false)}
                        ></div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* "This is my own recipe" checkbox */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isMyOwnRecipe}
                onChange={(e) => {
                  setIsMyOwnRecipe(e.target.checked);
                  if (e.target.checked) {
                    setSelectedGuestId('');
                    setShowGuestDropdown(false);
                  }
                }}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-gray-400 focus:ring-1"
              />
              <span className="text-sm text-gray-700">This is my own plate</span>
            </label>
          </div>

          {/* Recipe Type Toggle */}
          <div>
            <Label className="text-sm font-medium text-gray-600 mb-2 block">Plate type</Label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setUploadMethod('text');
                  setSelectedFiles([]);
                }}
                className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  uploadMethod === 'text'
                    ? 'bg-white border-2 border-black text-black'
                    : 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Type Plate
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMethod('image');
                  setRecipeIngredients('');
                  setRecipeInstructions('');
                }}
                className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  uploadMethod === 'image'
                    ? 'bg-white border-2 border-black text-black'
                    : 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Upload Images
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Complete recipe form structure (from image) */}
        <div className="flex flex-col space-y-6 min-w-0">
          {/* Plate Name - at top, large serif */}
          <div>
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={recipeTitle}
                onChange={(e) => setRecipeTitle(e.target.value)}
                placeholder="Plate Name"
                maxLength={50}
                className="w-full font-serif text-3xl font-semibold text-gray-900 leading-tight border-0 border-b border-gray-300 px-0 py-2 focus:outline-none focus:border-gray-500 bg-transparent placeholder:text-gray-400"
                required
              />
              <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                {recipeTitle.length}/50
              </span>
            </div>
            {/* Subtitle - Shared by guest name or user name */}
            {!isMyOwnRecipe && selectedGuest && (
              <p className="font-serif italic text-lg text-gray-700 mt-2">
                Shared by {selectedGuest.printed_name || `${selectedGuest.first_name} ${selectedGuest.last_name || ''}`.trim()}
              </p>
            )}
            {isMyOwnRecipe && userName && (
              <p className="font-serif italic text-lg text-gray-700 mt-2">
                Shared by {userName}
              </p>
            )}
          </div>

          {/* Additional Notes - full width textarea */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Comments</p>
            <textarea
              value={recipeNotes}
              onChange={(e) => setRecipeNotes(e.target.value)}
              placeholder="Any additional notes about this plate (optional...but encouraged!)"
              className="w-full font-sans font-light text-base text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 placeholder:text-gray-400 resize-vertical min-h-[60px]"
            />
          </div>

          {/* Two Columns: Ingredients (left) and Steps (right) */}
          {uploadMethod === 'image' ? (
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-600 mb-3 block">Plate Images *</Label>
              <RecipeImageUpload
                onFilesSelected={setSelectedFiles}
                selectedFiles={selectedFiles}
                error={error}
              />
            </div>
          ) : (
            <div className="grid grid-cols-[3fr_7fr] gap-4">
              {/* Left Column - Ingredients */}
              <div className="flex flex-col">
                <p className="text-xs text-gray-400 mb-1">What you need to make this plate</p>
                <textarea
                  value={recipeIngredients}
                  onChange={(e) => setRecipeIngredients(e.target.value)}
                  placeholder="(Optional) List the ingredients needed for this plate"
                  className="w-full font-sans font-light text-base text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 placeholder:text-gray-400 resize-vertical min-h-[400px]"
                />
              </div>

              {/* Right Column - Steps (Instructions) */}
              <div className="flex flex-col">
                <p className="text-xs text-gray-400 mb-1">What you need to make this plate</p>
                <textarea
                  value={recipeInstructions}
                  onChange={(e) => setRecipeInstructions(e.target.value)}
                  placeholder="List the steps needed to make this plate - make it simple, easy and fun to follow!"
                  className="w-full font-serif text-lg text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 placeholder:text-gray-400 resize-vertical min-h-[400px]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );

  // Mobile content component - keep original form layout
  const modalContent = (
    <>
      <div className="space-y-6 pb-24 pr-4">
        {/* Guest Selector */}
        <div>
          <Label htmlFor="guest" className="text-sm font-medium text-gray-600">
            Guest {!isMyOwnRecipe && '*'}
          </Label>
          {!isMyOwnRecipe && (
            <>
              {guestsLoading ? (
                <div className="mt-1 text-sm text-gray-500">Loading guests...</div>
              ) : guests.length === 0 ? (
                <div className="mt-1">
                  <p className="text-sm text-gray-500 mb-2">No guests available. Please add a guest first.</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddGuestModal(true);
                    }}
                    className="text-sm"
                  >
                    Add Guest
                  </Button>
                </div>
              ) : (
                <div className="relative mt-1" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <span className={selectedGuestId ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedGuestId && selectedGuest
                        ? getGuestDisplayName(selectedGuest)
                        : 'Select a guest'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                  
                  {showGuestDropdown && (
                    <>
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {guests.map((guest) => (
                          <button
                            key={guest.id}
                            type="button"
                            onClick={() => {
                              setSelectedGuestId(guest.id);
                              setShowGuestDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                              selectedGuestId === guest.id
                                ? 'bg-gray-100 text-gray-900 font-medium'
                                : 'text-gray-700'
                            }`}
                          >
                            {getGuestDisplayName(guest)}
                          </button>
                        ))}
                        <div className="border-t border-gray-200 mt-1 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowGuestDropdown(false);
                              setShowAddGuestModal(true);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add New Guest
                          </button>
                        </div>
                      </div>
                      {/* Overlay to close dropdown */}
                      <div 
                        className="fixed inset-0 z-[5]" 
                        onClick={() => setShowGuestDropdown(false)}
                      ></div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* "This is my own recipe" checkbox */}
          <div className="mt-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isMyOwnRecipe}
                onChange={(e) => {
                  setIsMyOwnRecipe(e.target.checked);
                  if (e.target.checked) {
                    setSelectedGuestId('');
                    setShowGuestDropdown(false);
                  }
                }}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-gray-400 focus:ring-1"
              />
              <span className="text-sm text-gray-700">This is my own plate</span>
            </label>
          </div>
        </div>

        {/* Upload Method Toggle */}
        <div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setUploadMethod('text');
                setSelectedFiles([]);
              }}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                uploadMethod === 'text'
                  ? 'bg-white border-2 border-black text-black'
                  : 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Type Recipe
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMethod('image');
                setRecipeIngredients('');
                setRecipeInstructions('');
              }}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                uploadMethod === 'image'
                  ? 'bg-white border-2 border-black text-black'
                  : 'bg-gray-50 border-2 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Upload Images
            </button>
          </div>
        </div>

        {/* Recipe Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="recipeTitle" className="text-sm font-medium text-gray-600">Plate Title *</Label>
            <span className="text-xs text-gray-400">
              {recipeTitle.length}/50
            </span>
          </div>
          <Input
            id="recipeTitle"
            value={recipeTitle}
            onChange={(e) => setRecipeTitle(e.target.value)}
            maxLength={50}
            className="mt-1"
            placeholder="Plate name"
            required
          />
        </div>
        
        {/* Conditional Form Fields Based on Upload Method */}
        {uploadMethod === 'image' ? (
          <>
            {/* Image Mode: Notes and Image Upload */}
            <div>
              <Label htmlFor="recipeNotes" className="text-sm font-medium text-gray-600">Notes</Label>
              <textarea
                id="recipeNotes"
                value={recipeNotes}
                onChange={(e) => setRecipeNotes(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 resize-vertical min-h-[80px]"
                placeholder="Any additional notes about this plate (optional)"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-3 block">Plate Images *</Label>
              <RecipeImageUpload
                onFilesSelected={setSelectedFiles}
                selectedFiles={selectedFiles}
                error={error}
              />
            </div>
          </>
        ) : (
          <>
            {/* Text Mode: Ingredients, Instructions, and Notes */}
        <div>
          <Label htmlFor="recipeIngredients" className="text-sm font-medium text-gray-600">Ingredients</Label>
          <textarea
            id="recipeIngredients"
            value={recipeIngredients}
            onChange={(e) => setRecipeIngredients(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 resize-vertical min-h-[120px]"
            placeholder="(Optional) List the ingredients needed for this plate"
          />
        </div>
        
        <div>
          <Label htmlFor="recipeInstructions" className="text-sm font-medium text-gray-600">How to make this plate</Label>
          <textarea
            id="recipeInstructions"
            value={recipeInstructions}
            onChange={(e) => setRecipeInstructions(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 resize-vertical min-h-[180px]"
            placeholder="If you have the plate all in one single piece, just paste in here"
          />
        </div>
        
        <div>
          <Label htmlFor="recipeNotes" className="text-sm font-medium text-gray-600">Notes</Label>
          <textarea
            id="recipeNotes"
            value={recipeNotes}
            onChange={(e) => setRecipeNotes(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[80px]"
            placeholder="Any additional notes about this plate"
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
          <SheetContent side="bottom" className="!h-[85vh] !max-h-[85vh] rounded-t-[20px] flex flex-col overflow-hidden p-0">
            <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-gray-300" />
            
            <div className="p-6 flex flex-col h-full overflow-hidden">
              <SheetHeader className="px-0">
                <SheetTitle className="font-serif text-2xl font-semibold mb-4">Add Plate</SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-hidden flex flex-col overflow-y-auto">
                {modalContent}
              </div>
              
              {/* Save Button */}
              <div className="mt-2 pb-safe">
                <Button 
                  onClick={handleSave}
                  disabled={loading || (!isMyOwnRecipe && guests.length === 0)}
                  className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Nested AddGuestModal */}
        <AddGuestModal
          isOpen={showAddGuestModal}
          onClose={() => setShowAddGuestModal(false)}
          onGuestAdded={handleGuestAdded}
        />
      </>
    );
  }

  // Desktop version - Dialog popup (centered)
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden overflow-x-hidden p-0 gap-0">
          <DialogHeader className="flex-shrink-0 px-8 pt-6 pb-4 border-b border-gray-200">
            <DialogTitle className="font-serif text-2xl font-semibold">Add a Plate</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col px-8 py-6 min-w-0">
            {desktopContent}
          </div>
          
          {/* Save Button - Fixed position at bottom */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 px-8 py-4">
            <Button 
              onClick={handleSave}
              disabled={loading || (!isMyOwnRecipe && guests.length === 0)}
              className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Nested AddGuestModal */}
      <AddGuestModal
        isOpen={showAddGuestModal}
        onClose={() => setShowAddGuestModal(false)}
        onGuestAdded={handleGuestAdded}
      />
    </>
  );
}

