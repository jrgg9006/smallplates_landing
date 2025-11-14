"use client";

import React, { useState, useEffect } from "react";
import { RecipeWithGuest } from "@/lib/types/database";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";
import { getGuestProfileIcon } from "@/lib/utils/profileIcons";

interface RecipeDetailsModalProps {
  recipe: RecipeWithGuest | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeDetailsModal({ recipe, isOpen, onClose }: RecipeDetailsModalProps) {
  // Responsive hook to detect mobile
  const [isMobile, setIsMobile] = useState(false);

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

  if (!recipe) return null;

  const guest = recipe.guests;
  const guestName = guest 
    ? (guest.printed_name || `${guest.first_name} ${guest.last_name || ''}`.trim())
    : 'Unknown Guest';
  const guestSubtitle = guest && guest.printed_name
    ? `${guest.first_name} ${guest.last_name || ''}`.trim()
    : null;
  const guestEmail = guest?.email || null;

  // Content component to be reused in both mobile and desktop versions
  const modalContent = (
    <>
      {/* Guest Profile Section */}
      <div className="flex-shrink-0 flex items-center gap-4 pt-0 pb-6 border-b border-gray-200">
        <div className="flex-shrink-0">
          <Image
            src={getGuestProfileIcon(recipe.guest_id, recipe.guests?.is_self === true)}
            alt="Guest profile icon"
            width={96}
            height={96}
            className="rounded-full"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-medium text-gray-900">
            {guestName}
          </h3>
          {guestSubtitle && (
            <p className="text-sm text-gray-500 mt-1">
              {guestSubtitle}
            </p>
          )}
          {guestEmail && guestEmail.trim() && !guestEmail.startsWith('NO_EMAIL_') && (
            <p className="text-sm text-gray-500 mt-1">
              {guestEmail}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1 italic">
            Added on {new Date(recipe.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
      
      {/* Recipe Content Section */}
      <div className="flex-1 overflow-y-auto mt-6 space-y-8 pb-6 pr-2">
        {/* Recipe Title */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="font-serif text-4xl font-semibold text-gray-900 leading-tight">
            {recipe.recipe_name || 'Untitled Recipe'}
          </h2>
        </div>

        {/* Ingredients */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingredients</h3>
          {recipe.ingredients && recipe.ingredients.trim() ? (
            <pre className="whitespace-pre-wrap font-sans text-base text-gray-600 leading-relaxed m-0">
              {recipe.ingredients}
            </pre>
          ) : (
            <p className="text-sm text-gray-500 italic m-0">No ingredients provided</p>
          )}
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
          {recipe.instructions && recipe.instructions.trim() ? (
            <pre className="whitespace-pre-wrap font-sans text-base text-gray-600 leading-relaxed m-0">
              {recipe.instructions}
            </pre>
          ) : (
            <p className="text-sm text-gray-500 italic m-0">No instructions provided</p>
          )}
        </div>

        {/* Comments/Notes */}
        {recipe.comments && recipe.comments.trim() && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
              <pre className="whitespace-pre-wrap font-sans text-base text-yellow-900 leading-relaxed m-0">
                {recipe.comments}
              </pre>
            </div>
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
            <SheetHeader className="px-0 flex-shrink-0">
              <SheetTitle className="font-serif text-2xl font-semibold mb-4">Recipe Details</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              {modalContent}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version - Sheet that slides from right
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="!w-[45%] !max-w-none h-full flex flex-col overflow-hidden">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="font-serif text-2xl font-semibold mb-4">Recipe Details</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {modalContent}
        </div>
      </SheetContent>
    </Sheet>
  );
}

