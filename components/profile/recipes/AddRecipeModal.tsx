"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addRecipe, addUserRecipe, addRecipeWithFiles } from "@/lib/supabase/recipes";
import { addRecipeToCookbook } from "@/lib/supabase/cookbooks";
import { getGuests } from "@/lib/supabase/guests";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import { Guest } from "@/lib/types/database";
import { ChevronDown } from "lucide-react";
import { RecipeImageUpload } from "./RecipeImageUpload";

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeAdded?: () => void; // Callback to refresh the recipe list
  cookbookId?: string | null; // Optional cookbook ID to auto-add recipe after creation
}

export function AddRecipeModal({ isOpen, onClose, onRecipeAdded, cookbookId }: AddRecipeModalProps) {
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
      setError('Please select a guest or check "This is my own recipe"');
      return;
    }

    if (!recipeTitle.trim()) {
      setError('Please fill in Recipe Title');
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

  // Desktop content component - styled to match RecipeDetailsModal
  const desktopContent = (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Guest Selector Section */}
      <div className="flex-shrink-0 pb-4 mb-2">
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
                      onClose();
                      // Navigate to guest list or trigger add guest modal
                      // This could be handled by parent component
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
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black focus:ring-2"
              />
              <span className="text-sm text-gray-700">This is my own recipe</span>
            </label>
          </div>
        </div>
      </div>

      {/* Upload Method Toggle */}
      <div className="flex-shrink-0 pb-2 mb-2">
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

      {/* Recipe Title Section */}
      <div className="flex-shrink-0 mb-8 pb-6 border-b border-gray-200">
        <input
          type="text"
          value={recipeTitle}
          onChange={(e) => setRecipeTitle(e.target.value)}
          placeholder="Recipe name"
          className="w-full font-serif text-4xl font-semibold text-gray-900 leading-tight bg-transparent border-0 border-b-2 border-gray-300 px-0 py-2 focus:outline-none focus:border-black placeholder:text-gray-400"
          required
        />
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

      {/* Conditional Form Fields Based on Upload Method */}
      {uploadMethod === 'image' ? (
        <>
          {/* Image Mode: Notes and Image Upload */}
          <div className="flex-shrink-0 mb-8">
            <textarea
              value={recipeNotes}
              onChange={(e) => setRecipeNotes(e.target.value)}
              placeholder="Any additional notes about this recipe (optional)"
              className="w-full font-sans font-light text-base text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black placeholder:text-gray-400 resize-vertical min-h-[80px]"
            />
          </div>

          {/* Image Upload Section */}
          <div className="flex-1 mb-8">
            <Label className="text-sm font-medium text-gray-600 mb-3 block">Recipe Images *</Label>
            <RecipeImageUpload
              onFilesSelected={setSelectedFiles}
              selectedFiles={selectedFiles}
              error={error}
            />
          </div>
        </>
      ) : (
        <>
          {/* Text Mode: Notes, Ingredients, and Instructions */}
      <div className="flex-shrink-0 mb-8">
        <textarea
          value={recipeNotes}
          onChange={(e) => setRecipeNotes(e.target.value)}
          placeholder="Any additional notes about this recipe"
          className="w-full font-sans font-light text-base text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black placeholder:text-gray-400 resize-vertical min-h-[80px]"
        />
      </div>

      {/* Two Column Layout: Ingredients (left) and Instructions (right) */}
      <div className="flex-1 grid grid-cols-[3fr_7fr] gap-8 pb-6">
        {/* Left Column - Ingredients */}
            <div className="flex flex-col">
          <textarea
            value={recipeIngredients}
            onChange={(e) => setRecipeIngredients(e.target.value)}
            placeholder="List the ingredients needed for this recipe"
                className="w-full font-sans font-light text-base text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black placeholder:text-gray-400 resize-vertical min-h-[240px]"
          />
        </div>

        {/* Right Column - Instructions */}
            <div className="flex flex-col">
          <textarea
            value={recipeInstructions}
            onChange={(e) => setRecipeInstructions(e.target.value)}
            placeholder="If you have the recipe all in one single piece, just paste in here"
                className="w-full font-serif text-lg text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black placeholder:text-gray-400 resize-vertical min-h-[240px]"
          />
        </div>
      </div>
        </>
      )}

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
                      onClose();
                      // Navigate to guest list or trigger add guest modal
                      // This could be handled by parent component
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
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black focus:ring-2"
              />
              <span className="text-sm text-gray-700">This is my own recipe</span>
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
          <Label htmlFor="recipeTitle" className="text-sm font-medium text-gray-600">Recipe Title *</Label>
          <Input
            id="recipeTitle"
            value={recipeTitle}
            onChange={(e) => setRecipeTitle(e.target.value)}
            className="mt-1"
            placeholder="Recipe name"
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
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[80px]"
                placeholder="Any additional notes about this recipe (optional)"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-3 block">Recipe Images *</Label>
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
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[120px]"
            placeholder="List the ingredients needed for this recipe"
          />
        </div>
        
        <div>
          <Label htmlFor="recipeInstructions" className="text-sm font-medium text-gray-600">Instructions</Label>
          <textarea
            id="recipeInstructions"
            value={recipeInstructions}
            onChange={(e) => setRecipeInstructions(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[180px]"
            placeholder="If you have the recipe all in one single piece, just paste in here"
          />
        </div>
        
        <div>
          <Label htmlFor="recipeNotes" className="text-sm font-medium text-gray-600">Notes</Label>
          <textarea
            id="recipeNotes"
            value={recipeNotes}
            onChange={(e) => setRecipeNotes(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[80px]"
            placeholder="Any additional notes about this recipe"
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
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="!h-[85vh] !max-h-[85vh] rounded-t-[20px] flex flex-col overflow-hidden p-0">
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-gray-300" />
          
          <div className="p-6 flex flex-col h-full overflow-hidden">
            <SheetHeader className="px-0">
              <SheetTitle className="font-serif text-2xl font-semibold mb-4">Add Recipe</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col overflow-y-auto">
              {modalContent}
            </div>
            
            {/* Save Button */}
            <div className="mt-4 pb-safe">
              <Button 
                onClick={handleSave}
                disabled={loading || guests.length === 0}
                className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version - Sheet that slides from right
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="!w-[70%] !max-w-none h-full flex flex-col overflow-hidden p-10">
        <SheetHeader className="flex-shrink-0 mb-6">
          <SheetTitle className="font-serif text-2xl font-semibold">Add Recipe</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col relative overflow-y-auto">
          {desktopContent}
          
          {/* Save Button - Fixed position in bottom right */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 mt-auto">
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
  );
}

