"use client";

import React, { useState } from "react";
import { Guest } from "@/lib/types/database";
import { updateGuest } from "@/lib/supabase/guests";
import { addRecipe, getRecipesByGuest } from "@/lib/supabase/recipes";
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
import { EditRecipeModal } from "./EditRecipeModal";

interface GuestDetailsModalProps {
  guest: Guest | null;
  isOpen: boolean;
  onClose: () => void;
  onGuestUpdated?: () => void; // Callback to refresh the guest list
  defaultTab?: string; // Optional default tab to open
}

export function GuestDetailsModal({ guest, isOpen, onClose, onGuestUpdated, defaultTab = "guest-info" }: GuestDetailsModalProps) {
  const [firstName, setFirstName] = useState(guest?.first_name || '');
  const [lastName, setLastName] = useState(guest?.last_name || '');
  const [printedName, setPrintedName] = useState(guest?.printed_name || '');
  const [email, setEmail] = useState(guest?.email || '');
  // const [phone, setPhone] = useState(guest?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Recipe state
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeSteps, setRecipeSteps] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  const [recipeNotes, setRecipeNotes] = useState('');
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Helper function to check if a recipe is complete
  const isRecipeComplete = (recipe: any) => {
    return recipe.recipe_name && (recipe.ingredients || recipe.instructions);
  };

  // Function to fetch recipes for this guest
  const fetchRecipes = React.useCallback(async () => {
    if (!guest) return;
    
    try {
      const { data, error } = await getRecipesByGuest(guest.id);
      if (error) {
        console.error('Error fetching recipes:', error);
      } else {
        setRecipes(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching recipes:', err);
    }
  }, [guest]);

  // Handle edit recipe
  const handleEditRecipe = (recipe: any) => {
    setEditingRecipe(recipe);
    setIsEditModalOpen(true);
  };

  // Handle recipe updated from edit modal
  const handleRecipeUpdated = () => {
    fetchRecipes();
    if (onGuestUpdated) {
      onGuestUpdated();
    }
  };

  // Update state when guest changes or modal opens
  React.useEffect(() => {
    if (guest && isOpen) {
      setFirstName(guest.first_name);
      setLastName(guest.last_name);
      setPrintedName(guest.printed_name || '');
      setEmail(guest.email?.startsWith('NO_EMAIL_') ? '' : guest.email);
      // setPhone(guest.phone || '');
      setError(null); // Clear any previous errors
      setSuccessMessage(null); // Clear any previous success messages
      setLoading(false);
      setSavingRecipe(false);
      // Reset recipe form
      setRecipeTitle('');
      setRecipeSteps('');
      setRecipeInstructions('');
      setRecipeNotes('');
      // Fetch recipes for this guest
      fetchRecipes();
    }
  }, [guest, isOpen, fetchRecipes]);

  const handleSave = async () => {
    if (!guest) return;
    
    // Validate required fields
    if (!firstName.trim()) {
      setError('Please fill in First Name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare update data
      const updates = {
        first_name: firstName.trim(),
        last_name: lastName.trim() || '',
        printed_name: printedName.trim() || null,
        email: email.trim() || 'NO_EMAIL_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11),
        // phone: phone.trim() || null,
      };

      // Update the guest in the database
      const { error } = await updateGuest(guest.id, updates);

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      // If recipe data is provided, add the recipe for the guest
      if (recipeTitle || recipeInstructions || recipeSteps) {
        const recipeData = {
          recipe_name: recipeTitle || 'Untitled Recipe',
          ingredients: recipeSteps || '',
          instructions: recipeInstructions || '',
          comments: recipeNotes || ''
        };

        const { error: recipeError } = await addRecipe(guest.id, recipeData);
        
        if (recipeError) {
          console.error('Error adding recipe:', recipeError);
          setError(recipeError);
          setLoading(false);
          return;
        }
      }

      // Success! Close modal and refresh the guest list
      onClose();
      
      // Refresh the guest list if callback provided
      if (onGuestUpdated) {
        onGuestUpdated();
      }

    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating guest:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipe = async () => {
    if (!guest) return;
    
    if (!recipeTitle && !recipeInstructions && !recipeSteps) {
      setError('Please add at least some recipe information');
      return;
    }

    setSavingRecipe(true);
    setError(null); // Clear any previous errors

    try {
      const recipeData = {
        recipe_name: recipeTitle || 'Untitled Recipe',
        ingredients: recipeSteps || '',
        instructions: recipeInstructions || '',
        comments: recipeNotes || ''
      };

      const { data, error: recipeError } = await addRecipe(guest.id, recipeData);
      
      if (recipeError) {
        console.error('Recipe error:', recipeError);
        setError(recipeError);
        setSavingRecipe(false);
        return;
      }

      // Success! Reset recipe form
      setRecipeTitle('');
      setRecipeSteps('');
      setRecipeInstructions('');
      setRecipeNotes('');
      
      // Clear any lingering errors and show success
      setError(null);
      setSuccessMessage('Recipe added successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Refresh the guest data and recipes after a short delay to ensure database is updated
      setTimeout(() => {
        if (onGuestUpdated) {
          onGuestUpdated();
        }
        fetchRecipes(); // Refresh the recipes list
      }, 500);
      
    } catch (err) {
      console.error('Unexpected error adding recipe:', err);
      setError('An unexpected error occurred');
    } finally {
      setSavingRecipe(false);
    }
  };

  if (!guest) return null;

  // Map status to user-friendly labels
  const getStatusLabel = (status: Guest["status"]) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'submitted':
        return 'Received';
      case 'reached_out':
        return 'Reached Out';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadgeStyle = (status: Guest["status"]) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'submitted':
        return 'bg-green-100 text-green-700';
      case 'reached_out':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-serif text-2xl font-semibold mb-4">Edit Guest</DialogTitle>
        </DialogHeader>
        
        <Tabs 
          defaultValue={defaultTab} 
          className="w-full flex-1 flex flex-col overflow-hidden"
          onValueChange={() => {
          setError(null); // Clear errors when switching tabs
          setSuccessMessage(null); // Clear success messages when switching tabs
        }}
        >
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto border-b border-gray-200 flex-shrink-0">
            <TabsTrigger value="guest-info" className="bg-transparent border-0 rounded-none pb-2 px-0 text-gray-600 font-normal data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium">
              Guest Info
            </TabsTrigger>
            <TabsTrigger value="contact-info" className="bg-transparent border-0 rounded-none pb-2 px-0 text-gray-600 font-normal data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium">
              Contact Info
            </TabsTrigger>
            <TabsTrigger value="recipe-status" className="bg-transparent border-0 rounded-none pb-2 px-0 text-gray-600 font-normal data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:font-medium">
              Recipe Status
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="guest-info" className="flex-1 overflow-y-auto mt-6 px-1">
            <div className="space-y-4 pb-24 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-600">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-600">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1"
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
            
            {/* Hidden temporarily - Plus One section */}
            {/* <div>
              <button className="text-sm text-blue-600 hover:underline">+ Add Plus One</button>
            </div> */}
            
            <div>
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(guest.status)}`}
                >
                  {getStatusLabel(guest.status)}
                </span>
              </div>
              {guest.date_message_sent && (
                <div className="mt-2 text-xs text-gray-500">
                  Message sent on {new Date(guest.date_message_sent).toLocaleDateString()}
                </div>
              )}
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Recipes Received</Label>
              <div className="mt-1 text-2xl font-semibold">
                {guest.recipes_received || 0}
              </div>
              
              {/* Recipe Titles List */}
              {recipes.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">Recipe Titles</div>
                  <div className="space-y-2">
                    {recipes.map((recipe) => {
                      const isComplete = isRecipeComplete(recipe);
                      return (
                        <div 
                          key={recipe.id} 
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-700 flex-1">
                            {recipe.recipe_name || 'Untitled Recipe'}
                          </span>
                          {!isComplete && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                              Incomplete
                            </span>
                          )}
                          <button
                            onClick={() => handleEditRecipe(recipe)}
                            className="text-xs text-gray-600 hover:text-gray-800 underline"
                          >
                            Edit
                          </button>
                          <span className="text-xs text-gray-400">
                            ({new Date(recipe.created_at).toLocaleDateString()})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {recipes.length === 0 && guest.recipes_received > 0 && (
                <div className="mt-4 text-xs text-gray-400 italic">
                  Loading recipes...
                </div>
              )}
            </div>
            </div>
          </TabsContent>
          
          <TabsContent value="contact-info" className="flex-1 overflow-y-auto mt-6 px-1">
            <div className="space-y-4 pb-24 pr-2">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-600">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            </div>
          </TabsContent>
          
          <TabsContent value="recipe-status" className="flex-1 overflow-y-auto mt-6 px-1">
            <div className="space-y-6 pb-24 pr-2">
              <div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-600">Guest Status</label>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(guest.status)}`}
                  >
                    {getStatusLabel(guest.status)}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Recipes received:</span>
                    <span className="ml-2">{guest.recipes_received || 0}</span>
                  </div>
                  {guest.notes && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-600">Notes:</span>
                      <div className="mt-1 text-gray-700">{guest.notes}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Recipe Form */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Add Recipe</h3>
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
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}
        
        {/* Save Button - Fixed position in bottom right */}
        <div className="absolute bottom-6 right-6">
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-full disabled:opacity-50"
          >
            {loading ? 'Saving...' : 
             (recipeTitle || recipeInstructions || recipeSteps) ? 'Save Recipe & Guest' : 'Save Guest'}
          </Button>
        </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Recipe Modal */}
      <EditRecipeModal
        recipe={editingRecipe}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRecipe(null);
        }}
        onRecipeUpdated={handleRecipeUpdated}
      />
    </>
  );
}