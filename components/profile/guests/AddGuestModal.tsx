"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestAdded?: () => void; // Callback to refresh the guest list
}

export function AddGuestModal({ isOpen, onClose, onGuestAdded }: AddGuestModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setHasPlusOne(false);
    setPlusOneFirstName('');
    setPlusOneLastName('');
    setError(null);
    setRecipeTitle('');
    setRecipeSteps('');
    setRecipeInstructions('');
    setRecipeNotes('');
  };

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
        const emailExists = await checkGuestExists(email);
        if (emailExists) {
          setError('A guest with this email already exists');
          setLoading(false);
          return;
        }
      }

      // Prepare guest data
      const guestData: GuestFormData = {
        first_name: firstName.trim(),
        last_name: lastName.trim() || '',
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-serif text-2xl font-semibold mb-4">Add Guest</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="guest-info" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto border-b border-gray-200 flex-shrink-0">
            <TabsTrigger value="guest-info" className="bg-transparent border-0 rounded-none pb-2 px-0 text-gray-600 font-normal data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium">
              Guest Information
            </TabsTrigger>
            <TabsTrigger value="recipe" className="bg-transparent border-0 rounded-none pb-2 px-0 text-gray-600 font-normal data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium">
              Recipe
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="guest-info" className="flex-1 overflow-y-auto mt-6 px-1">
            <div className="space-y-6 pb-24 pr-2">
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

            {/* Add Plus One Section */}
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
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-600">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                  placeholder="Phone number"
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
          
          <TabsContent value="recipe" className="flex-1 overflow-y-auto mt-6 px-1">
            <div className="space-y-6 pb-24 pr-2">
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
                <Label htmlFor="recipeSteps" className="text-sm font-medium text-gray-600">Steps</Label>
                <textarea
                  id="recipeSteps"
                  value={recipeSteps}
                  onChange={(e) => setRecipeSteps(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[100px]"
                  placeholder="List the ingredients or steps"
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
      </DialogContent>
    </Dialog>
  );
}