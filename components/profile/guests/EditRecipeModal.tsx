"use client";

import React, { useState, useEffect } from "react";
import { GuestRecipe } from "@/lib/types/database";
import { updateRecipe } from "@/lib/supabase/recipes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface EditRecipeModalProps {
  recipe: GuestRecipe | null;
  isOpen: boolean;
  onClose: () => void;
  onRecipeUpdated?: () => void;
}

export function EditRecipeModal({ recipe, isOpen, onClose, onRecipeUpdated }: EditRecipeModalProps) {
  const [recipeTitle, setRecipeTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recipe && isOpen) {
      setRecipeTitle(recipe.recipe_name || '');
      setIngredients(recipe.ingredients || '');
      setInstructions(recipe.instructions || '');
      setNotes(recipe.comments || '');
      setError(null);
    }
  }, [recipe, isOpen]);

  const handleSave = async () => {
    if (!recipe) return;
    
    // Only validate that recipe has a title
    if (!recipeTitle.trim()) {
      setError('Please add a title for the recipe');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updates = {
        recipe_name: recipeTitle.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        comments: notes.trim() || null,
      };

      const { error: updateError } = await updateRecipe(recipe.id, updates);

      if (updateError) {
        setError(updateError);
        return;
      }

      // Success!
      onClose();
      
      if (onRecipeUpdated) {
        onRecipeUpdated();
      }
    } catch (err) {
      setError('Error inesperado al actualizar la receta');
      console.error('Error updating recipe:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!recipe) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-semibold mb-4">
            Edit Recipe
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="editRecipeTitle" className="text-sm font-medium text-gray-600">
              Recipe Title
            </Label>
            <Input
              id="editRecipeTitle"
              value={recipeTitle}
              onChange={(e) => setRecipeTitle(e.target.value)}
              className="mt-1"
              placeholder="Nombre de la receta"
            />
          </div>
          
          <div>
            <Label htmlFor="editIngredients" className="text-sm font-medium text-gray-600">
              Ingredients
            </Label>
            <textarea
              id="editIngredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[100px]"
              placeholder="List the ingredients needed for this recipe"
            />
          </div>
          
          <div>
            <Label htmlFor="editInstructions" className="text-sm font-medium text-gray-600">
              Instructions
            </Label>
            <textarea
              id="editInstructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[150px]"
              placeholder="If you have the recipe all in one single piece, just paste in here"
            />
          </div>
          
          <div>
            <Label htmlFor="editNotes" className="text-sm font-medium text-gray-600">
              Notes
            </Label>
            <textarea
              id="editNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical min-h-[80px]"
              placeholder="Additional notes about this recipe"
            />
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-4 py-2 rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-full disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}