"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addGuest, checkGuestExists } from "@/lib/supabase/guests";
import { addRecipe } from "@/lib/supabase/recipes";
import type { GuestFormData } from "@/lib/types/database";
import Image from "next/image";
import { OnboardingBadge } from "@/components/onboarding/OnboardingBadge";

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestAdded?: () => void; // Callback to refresh the guest list
  isFirstGuest?: boolean; // Show onboarding badge for first guest
}

export function AddGuestModal({ isOpen, onClose, onGuestAdded, isFirstGuest = false }: AddGuestModalProps) {
  // Responsive hook to detect mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640); // sm breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [printedName, setPrintedName] = useState('');
  const [email, setEmail] = useState('');
  // const [phone, setPhone] = useState('');
  const [hasPlusOne, setHasPlusOne] = useState(false);
  const [plusOneFirstName, setPlusOneFirstName] = useState('');
  const [plusOneLastName, setPlusOneLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Recipe state
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeSteps, setRecipeSteps] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  const [recipeNotes, setRecipeNotes] = useState('');
  
  // Profile icon state - always show chef0 as default
  const [previewIcon, setPreviewIcon] = useState('/images/icons_profile/chef0.png');

  const resetForm = () => {
    console.log('AddGuestModal: Resetting form');
    setFirstName('');
    setLastName('');
    setPrintedName('');
    setEmail('');
    // setPhone('');
    setHasPlusOne(false);
    setPlusOneFirstName('');
    setPlusOneLastName('');
    setError(null);
    setRecipeTitle('');
    setRecipeSteps('');
    setRecipeInstructions('');
    setRecipeNotes('');
    setPreviewIcon('/images/icons_profile/chef0.png');
  };

  // Log when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('AddGuestModal: Modal opened');
    } else {
      console.log('AddGuestModal: Modal closed');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      setError('Please fill in First Name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if guest email already exists (only if email is provided)
      if (email.trim()) {
        console.log('AddGuestModal: About to check if email exists:', email);
        console.log('AddGuestModal: Check timestamp:', new Date().toISOString());
        
        const emailExists = await checkGuestExists(email);
        
        console.log('AddGuestModal: Email exists check result:', emailExists);
        
        if (emailExists) {
          console.log('AddGuestModal: Email already exists, showing error');
          setError('A guest with this email already exists');
          setLoading(false);
          return;
        } else {
          console.log('AddGuestModal: Email is available, proceeding with guest creation');
        }
      }

      // Prepare guest data
      const guestData: GuestFormData = {
        first_name: firstName.trim(),
        last_name: lastName.trim() || '',
        printed_name: printedName.trim() || undefined,
        email: email.trim() || undefined,
        // phone: phone.trim() || undefined,
        significant_other_name: hasPlusOne ? `${plusOneFirstName} ${plusOneLastName}`.trim() : undefined,
      };

      // Add the guest to the database
      const { data: newGuest, error } = await addGuest(guestData);

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      // If recipe data is provided, add the recipe for the guest
      if (newGuest && (recipeTitle || recipeInstructions || recipeSteps)) {
        const recipeData = {
          recipe_name: recipeTitle || 'Untitled Recipe',
          ingredients: recipeSteps || '',
          instructions: recipeInstructions || '',
          comments: recipeNotes || ''
        };

        const { error: recipeError } = await addRecipe(newGuest.id, recipeData);
        
        if (recipeError) {
          // Log the error but don't fail the whole operation
          console.error('Error adding recipe:', recipeError);
        }
      }

      // Success! Reset form and close modal
      resetForm();
      onClose();
      
      // Refresh the guest list if callback provided
      if (onGuestAdded) {
        onGuestAdded();
      }

    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error adding guest:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlusOne = () => {
    setHasPlusOne(true);
  };

  const handleRemovePlusOne = () => {
    setHasPlusOne(false);
    setPlusOneFirstName('');
    setPlusOneLastName('');
  };

  // Content component to be reused in both mobile and desktop versions
  const modalContent = (
    <>
      {/* Guest Profile Preview Section */}
      <div className="flex items-center gap-4 pt-0 pb-4 border-b border-gray-200">
        <div className="flex-shrink-0">
          <Image
            src={previewIcon}
            alt="Guest profile icon preview"
            width={80}
            height={80}
            className="rounded-full"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">
            {printedName || `${firstName} ${lastName}`.trim() || 'New Guest'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            A unique chef icon will be assigned to this guest when saved
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="guest-info" className="w-full flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto border-b border-gray-200">
          <TabsTrigger value="guest-info" className="bg-transparent border-0 rounded-none pb-2 px-0 text-gray-600 font-normal data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium">
            Guest Information
          </TabsTrigger>
          <TabsTrigger value="recipe" className="bg-transparent border-0 rounded-none pb-2 px-0 text-gray-600 font-normal data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium">
            Recipe
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="guest-info" className="flex-1 overflow-y-auto mt-6 px-2">
          <div className="space-y-6 pb-24 pr-4">
            {/* Onboarding Badge - Show only for first guest */}
            {isFirstGuest && (
              <OnboardingBadge
                stepNumber={2}
                title="Step 2 of Onboarding"
                message="Your first guest! Nothing will be sent yet. Just add their name and click save to continue your journey."
              />
            )}
            
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-600">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1"
                placeholder="First Name"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-600">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1"
                placeholder="Last Name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="printedName" className="text-sm font-medium text-gray-600">Printed Name</Label>
            <Input
              id="printedName"
              value={printedName}
              onChange={(e) => setPrintedName(e.target.value)}
              className="mt-1"
              placeholder="How this person's name should appear in the book (e.g., 'Jaime y Nana', 'Chef Rodriguez')"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use first and last name. This is how the name will appear in the printed cookbook.
            </p>
          </div>

          {/* Hidden temporarily - Add Plus One Section 
          <div>
            {!hasPlusOne ? (
              <button 
                onClick={handleAddPlusOne}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add Plus One
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Plus One Information</span>
                  <button 
                    onClick={handleRemovePlusOne}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plusOneFirstName" className="text-sm font-medium text-gray-600">First Name</Label>
                    <Input
                      id="plusOneFirstName"
                      value={plusOneFirstName}
                      onChange={(e) => setPlusOneFirstName(e.target.value)}
                      className="mt-1"
                      placeholder="Plus One First Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="plusOneLastName" className="text-sm font-medium text-gray-600">Last Name</Label>
                    <Input
                      id="plusOneLastName"
                      value={plusOneLastName}
                      onChange={(e) => setPlusOneLastName(e.target.value)}
                      className="mt-1"
                      placeholder="Plus One Last Name"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          */}

          {/* Contact Information */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-600">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                placeholder="Email address"
              />
            </div>
          </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="recipe" className="flex-1 overflow-y-auto mt-6 px-2">
          <div className="space-y-6 pb-24 pr-4">
            <div className="space-y-4">
            <div>
              <Label htmlFor="recipeTitle" className="text-sm font-medium text-gray-600">Recipe Title</Label>
              <Input
                id="recipeTitle"
                value={recipeTitle}
                onChange={(e) => setRecipeTitle(e.target.value)}
                className="mt-1"
                placeholder="Recipe name"
              />
            </div>
            
            <div>
              <Label htmlFor="recipeSteps" className="text-sm font-medium text-gray-600">Ingredients</Label>
              <textarea
                id="recipeSteps"
                value={recipeSteps}
                onChange={(e) => setRecipeSteps(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[100px]"
                placeholder="List the ingredients needed for this recipe"
              />
            </div>
            
            <div>
              <Label htmlFor="recipeInstructions" className="text-sm font-medium text-gray-600">Instructions</Label>
              <textarea
                id="recipeInstructions"
                value={recipeInstructions}
                onChange={(e) => setRecipeInstructions(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[150px]"
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
            
            <div className="pt-2">
              <Label className="text-sm font-medium text-gray-600 mb-2 block">Recipe Image</Label>
              <Button 
                type="button"
                onClick={() => console.log('Add image placeholder')}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md px-4 py-2"
              >
                Add Image
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                This image will serve as inspiration to our image generator algorithms.
              </p>
            </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
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
              <SheetTitle className="font-serif text-2xl font-semibold mb-4">Add Guest</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              {modalContent}
            </div>
            
            {/* Save Button */}
            <div className="mt-4 pb-safe">
              <Button 
                onClick={handleSave}
                disabled={loading}
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
      <SheetContent side="right" className="!w-[45%] !max-w-none h-full flex flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl font-semibold mb-4">Add Guest</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {modalContent}
          
          {/* Save Button - Fixed position in bottom right */}
          <div className="absolute bottom-6 right-6">
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-full disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}