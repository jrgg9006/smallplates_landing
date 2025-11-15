"use client";

import React, { useState, useEffect } from "react";
import { RecipeWithGuest } from "@/lib/types/database";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import Image from "next/image";
import { getGuestProfileIcon } from "@/lib/utils/profileIcons";
import { updateRecipe } from "@/lib/supabase/recipes";

interface RecipeDetailsModalProps {
  recipe: RecipeWithGuest | null;
  isOpen: boolean;
  onClose: () => void;
  onRecipeUpdated?: () => void;
}

export function RecipeDetailsModal({ recipe, isOpen, onClose, onRecipeUpdated }: RecipeDetailsModalProps) {
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

  // Reset edit mode when modal closes or recipe changes
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setError(null);
    }
  }, [isOpen]);

  // Initialize form state when entering edit mode
  useEffect(() => {
    if (recipe && isEditMode) {
      setRecipeTitle(recipe.recipe_name || '');
      setRecipeIngredients(recipe.ingredients || '');
      setRecipeInstructions(recipe.instructions || '');
      setRecipeNotes(recipe.comments || '');
      setError(null);
    }
  }, [recipe, isEditMode]);

  const handleCancel = () => {
    setIsEditMode(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!recipe) return;

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
      const updates = {
        recipe_name: recipeTitle.trim(),
        ingredients: recipeIngredients.trim(),
        instructions: recipeInstructions.trim(),
        comments: recipeNotes.trim() || null,
      };

      const { error: updateError } = await updateRecipe(recipe.id, updates);

      if (updateError) {
        setError(updateError);
        setLoading(false);
        return;
      }

      // Success!
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

  const isOwnRecipe = recipe?.guests?.is_self === true;

  if (!recipe) return null;

  const guest = recipe.guests;
  const guestName = guest 
    ? (guest.printed_name || `${guest.first_name} ${guest.last_name || ''}`.trim())
    : 'Unknown Guest';
  const guestSubtitle = guest && guest.printed_name
    ? `${guest.first_name} ${guest.last_name || ''}`.trim()
    : null;
  const guestEmail = guest?.email || null;

  // Content component for desktop - two column layout
  const desktopContent = (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Guest Info Section - Elegant top section */}
      <div className="flex-shrink-0 flex items-center gap-4 pb-8 mb-8 border-b border-gray-200">
        <div className="flex-shrink-0">
          <Image
            src={getGuestProfileIcon(recipe.guest_id, recipe.guests?.is_self === true)}
            alt="Guest profile icon"
            width={64}
            height={64}
            className="rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900 font-sans truncate">
            {guestName}
          </h3>
          {guestEmail && guestEmail.trim() && !guestEmail.startsWith('NO_EMAIL_') && (
            <p className="text-sm text-gray-500 mt-0.5 font-sans truncate">
              {guestEmail}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Added on {new Date(recipe.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
      
      {/* Recipe Title and Subtitle */}
      <div className="flex-shrink-0 mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-4xl font-semibold text-gray-900 leading-tight mb-2">
              {recipe.recipe_name || 'Untitled Recipe'}
            </h2>
            <p className="font-serif italic text-lg text-gray-700">
              Shared by {guestName}
            </p>
          </div>
          {isOwnRecipe && !isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 mt-1"
              aria-label="Edit recipe"
            >
              <Edit className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Comments/Notes - Full width above ingredients and instructions */}
      {recipe.comments && recipe.comments.trim() && (
        <div className="flex-shrink-0 mb-8">
          <pre className="whitespace-pre-wrap font-sans font-light text-base text-gray-700 leading-relaxed m-0">
            {recipe.comments}
          </pre>
        </div>
      )}

      {/* Uploaded Files Section - if document_urls exist */}
      {recipe.document_urls && recipe.document_urls.length > 0 && (
        <div className="flex-shrink-0 mb-8">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Uploaded Files</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {recipe.document_urls.map((url, index) => {
              const isPDF = url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf');
              return (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                  {isPDF ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-medium">PDF</span>
                      <span className="text-xs text-gray-500 mt-1">Click to view</span>
                    </a>
                  ) : (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-full h-full"
                    >
                      <Image
                        src={url}
                        alt={`Uploaded file ${index + 1}`}
                        fill
                        className="object-cover hover:opacity-90 transition-opacity"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two Column Layout: Ingredients (left) and Instructions (right) */}
      <div className="flex-1 grid grid-cols-[3fr_7fr] gap-8 pb-6">
        {/* Left Column - Ingredients */}
        <div className="flex flex-col min-w-0 overflow-hidden">
          {recipe.ingredients && recipe.ingredients.trim() ? (
            <pre className="whitespace-pre-wrap break-words font-sans font-light text-base text-gray-700 leading-relaxed m-0 overflow-wrap-anywhere">
              {recipe.ingredients}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic font-sans font-light m-0">No ingredients provided</p>
          )}
        </div>

        {/* Right Column - Instructions */}
        <div className="flex flex-col min-w-0 overflow-hidden">
          {recipe.instructions && recipe.instructions.trim() ? (
            <pre className="whitespace-pre-wrap break-words font-serif text-lg text-gray-700 leading-relaxed m-0 overflow-wrap-anywhere">
              {recipe.instructions}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic font-serif m-0">No instructions provided</p>
          )}
        </div>
      </div>
    </div>
  );

  // Content component for mobile - stacked layout
  const mobileContent = (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Guest Info Section */}
      <div className="flex-shrink-0 flex items-center gap-3 pb-6 mb-6 border-b border-gray-200">
        <div className="flex-shrink-0">
          <Image
            src={getGuestProfileIcon(recipe.guest_id, recipe.guests?.is_self === true)}
            alt="Guest profile icon"
            width={56}
            height={56}
            className="rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 font-sans truncate">
            {guestName}
          </h3>
          {guestEmail && guestEmail.trim() && !guestEmail.startsWith('NO_EMAIL_') && (
            <p className="text-xs text-gray-500 mt-0.5 font-sans truncate">
              {guestEmail}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Added on {new Date(recipe.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
      
      {/* Recipe Title and Subtitle */}
      <div className="flex-shrink-0 mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-3xl font-semibold text-gray-900 leading-tight mb-2">
              {recipe.recipe_name || 'Untitled Recipe'}
            </h2>
            <p className="font-serif italic text-base text-gray-700">
              Shared by {guestName}
            </p>
          </div>
          {isOwnRecipe && !isEditMode && (
            <button
              onClick={() => setIsEditMode(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 mt-1"
              aria-label="Edit recipe"
            >
              <Edit className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Comments/Notes - Above ingredients and instructions */}
      {recipe.comments && recipe.comments.trim() && (
        <div className="flex-shrink-0 mb-6">
          <pre className="whitespace-pre-wrap font-sans font-light text-base text-gray-700 leading-relaxed m-0">
            {recipe.comments}
          </pre>
        </div>
      )}

      {/* Uploaded Files Section - if document_urls exist */}
      {recipe.document_urls && recipe.document_urls.length > 0 && (
        <div className="flex-shrink-0 mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Uploaded Files</h3>
          <div className="grid grid-cols-2 gap-3">
            {recipe.document_urls.map((url, index) => {
              const isPDF = url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf');
              return (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                  {isPDF ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center h-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-medium">PDF</span>
                      <span className="text-xs text-gray-500 mt-1">Click to view</span>
                    </a>
                  ) : (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-full h-full"
                    >
                      <Image
                        src={url}
                        alt={`Uploaded file ${index + 1}`}
                        fill
                        className="object-cover hover:opacity-90 transition-opacity"
                        sizes="50vw"
                      />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stacked Layout for Mobile */}
      <div className="flex-1 space-y-6 pb-6">
        {/* Ingredients */}
        <div>
          {recipe.ingredients && recipe.ingredients.trim() ? (
            <pre className="whitespace-pre-wrap font-sans font-light text-base text-gray-700 leading-relaxed m-0">
              {recipe.ingredients}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic font-sans font-light m-0">No ingredients provided</p>
          )}
        </div>

        {/* Instructions */}
        <div>
          {recipe.instructions && recipe.instructions.trim() ? (
            <pre className="whitespace-pre-wrap font-serif text-base text-gray-700 leading-relaxed m-0">
              {recipe.instructions}
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic font-serif m-0">No instructions provided</p>
          )}
        </div>
      </div>
    </div>
  );

  // Edit content component for desktop - reusing AddRecipeModal styling patterns
  const desktopEditContent = (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Guest Info Section - Same as view mode */}
      <div className="flex-shrink-0 flex items-center gap-4 pb-8 mb-8 border-b border-gray-200">
        <div className="flex-shrink-0">
          <Image
            src={getGuestProfileIcon(recipe.guest_id, recipe.guests?.is_self === true)}
            alt="Guest profile icon"
            width={64}
            height={64}
            className="rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900 font-sans truncate">
            {guestName}
          </h3>
          {guestEmail && guestEmail.trim() && !guestEmail.startsWith('NO_EMAIL_') && (
            <p className="text-sm text-gray-500 mt-0.5 font-sans truncate">
              {guestEmail}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Added on {new Date(recipe.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Recipe Title Section - Editable */}
      <div className="flex-shrink-0 mb-8 pb-6 border-b border-gray-200">
        <input
          type="text"
          value={recipeTitle}
          onChange={(e) => setRecipeTitle(e.target.value)}
          placeholder="Recipe name"
          className="w-full font-serif text-4xl font-semibold text-gray-900 leading-tight bg-transparent border-0 border-b-2 border-gray-300 px-0 py-2 focus:outline-none focus:border-black placeholder:text-gray-400"
          required
        />
        <p className="font-serif italic text-lg text-gray-700 mt-2">
          Shared by {guestName}
        </p>
      </div>

      {/* Notes Section - Full width above ingredients and instructions */}
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
        <div className="flex flex-col min-w-0 overflow-hidden">
          <textarea
            value={recipeIngredients}
            onChange={(e) => setRecipeIngredients(e.target.value)}
            placeholder="List the ingredients needed for this recipe"
            className="w-full font-sans font-light text-base text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black placeholder:text-gray-400 resize-vertical min-h-[200px]"
          />
        </div>

        {/* Right Column - Instructions */}
        <div className="flex flex-col min-w-0 overflow-hidden">
          <textarea
            value={recipeInstructions}
            onChange={(e) => setRecipeInstructions(e.target.value)}
            placeholder="If you have the recipe all in one single piece, just paste in here"
            className="w-full font-serif text-lg text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black placeholder:text-gray-400 resize-vertical min-h-[200px]"
          />
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

  // Edit content component for mobile - reusing AddRecipeModal styling patterns
  const mobileEditContent = (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Guest Info Section */}
      <div className="flex-shrink-0 flex items-center gap-3 pb-6 mb-6 border-b border-gray-200">
        <div className="flex-shrink-0">
          <Image
            src={getGuestProfileIcon(recipe.guest_id, recipe.guests?.is_self === true)}
            alt="Guest profile icon"
            width={56}
            height={56}
            className="rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 font-sans truncate">
            {guestName}
          </h3>
          {guestEmail && guestEmail.trim() && !guestEmail.startsWith('NO_EMAIL_') && (
            <p className="text-xs text-gray-500 mt-0.5 font-sans truncate">
              {guestEmail}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Added on {new Date(recipe.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Recipe Title Section - Editable */}
      <div className="flex-shrink-0 mb-6 pb-4 border-b border-gray-200">
        <input
          type="text"
          value={recipeTitle}
          onChange={(e) => setRecipeTitle(e.target.value)}
          placeholder="Recipe name"
          className="w-full font-serif text-3xl font-semibold text-gray-900 leading-tight bg-transparent border-0 border-b-2 border-gray-300 px-0 py-2 focus:outline-none focus:border-black placeholder:text-gray-400"
          required
        />
        <p className="font-serif italic text-base text-gray-700 mt-2">
          Shared by {guestName}
        </p>
      </div>

      {/* Stacked Layout for Mobile */}
      <div className="flex-1 space-y-6 pb-6">
        {/* Notes */}
        <div>
          <textarea
            value={recipeNotes}
            onChange={(e) => setRecipeNotes(e.target.value)}
            placeholder="Any additional notes about this recipe"
            className="w-full font-sans font-light text-base text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black placeholder:text-gray-400 resize-vertical min-h-[80px]"
          />
        </div>

        {/* Ingredients */}
        <div>
          <textarea
            value={recipeIngredients}
            onChange={(e) => setRecipeIngredients(e.target.value)}
            placeholder="List the ingredients needed for this recipe"
            className="w-full font-sans font-light text-base text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black placeholder:text-gray-400 resize-vertical min-h-[100px]"
          />
        </div>

        {/* Instructions */}
        <div>
          <textarea
            value={recipeInstructions}
            onChange={(e) => setRecipeInstructions(e.target.value)}
            placeholder="If you have the recipe all in one single piece, just paste in here"
            className="w-full font-serif text-base text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black placeholder:text-gray-400 resize-vertical min-h-[150px]"
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

  // Mobile version - Sheet that slides up from bottom
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="!h-[85vh] !max-h-[85vh] rounded-t-[20px] flex flex-col overflow-hidden p-0">
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-gray-300" />
          
          <div className="px-6 pt-4 pb-6 flex flex-col h-full overflow-hidden">
            <SheetHeader className="px-0 flex-shrink-0 mb-4">
              <SheetTitle className="font-serif text-2xl font-semibold">Recipe Details</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col overflow-y-auto">
              {isEditMode ? mobileEditContent : mobileContent}
            </div>
            
            {/* Save/Cancel Buttons - Fixed bottom for mobile when in edit mode */}
            {isEditMode && (
              <div className="mt-4 pb-safe flex-shrink-0 border-t border-gray-200 pt-4 space-y-2">
                <Button 
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  onClick={handleCancel}
                  disabled={loading}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-full"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version - Sheet that slides from right
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="!w-[50%] !max-w-none h-full flex flex-col overflow-hidden p-8">
        <SheetHeader className="flex-shrink-0 mb-6">
          <SheetTitle className="font-serif text-2xl font-semibold">Recipe Details</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col relative overflow-y-auto">
          {isEditMode ? desktopEditContent : desktopContent}
          
          {/* Save/Cancel Buttons - Sticky bottom for desktop when in edit mode */}
          {isEditMode && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-auto flex-shrink-0">
              <div className="flex gap-3">
                <Button 
                  onClick={handleCancel}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-full"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

