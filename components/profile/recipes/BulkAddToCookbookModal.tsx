"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getAllCookbooks, addRecipeToCookbook } from "@/lib/supabase/cookbooks";
import { Cookbook, RecipeWithGuest } from "@/lib/types/database";
import { ChevronDown } from "lucide-react";

interface BulkAddToCookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: RecipeWithGuest[];
  onRecipesAdded?: () => void;
}

export function BulkAddToCookbookModal({ 
  isOpen, 
  onClose, 
  recipes,
  onRecipesAdded 
}: BulkAddToCookbookModalProps) {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [loading, setLoading] = useState(false);
  const [cookbooksLoading, setCookbooksLoading] = useState(false);
  const [selectedCookbookId, setSelectedCookbookId] = useState<string>('');
  const [showCookbookDropdown, setShowCookbookDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Load cookbooks when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCookbooks();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCookbookDropdown(false);
      }
    };

    if (showCookbookDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCookbookDropdown]);

  const loadCookbooks = async () => {
    setCookbooksLoading(true);
    try {
      const { data, error: cookbooksError } = await getAllCookbooks();
      
      if (cookbooksError) {
        console.error('Error loading cookbooks:', cookbooksError);
        setError('Failed to load cookbooks');
        return;
      }
      
      setCookbooks(data || []);
      
      // Auto-select default cookbook if exists
      const defaultCookbook = data?.find(cb => cb.is_default);
      if (defaultCookbook) {
        setSelectedCookbookId(defaultCookbook.id);
      } else if (data && data.length > 0) {
        setSelectedCookbookId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading cookbooks:', err);
      setError('Failed to load cookbooks');
    } finally {
      setCookbooksLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCookbookId('');
    setError(null);
    setSuccessCount(0);
    setFailedCount(0);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleAddToCookbook = async () => {
    if (recipes.length === 0) {
      setError('No recipes selected');
      return;
    }

    if (!selectedCookbookId) {
      setError('Please select a cookbook');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessCount(0);
    setFailedCount(0);

    try {
      let success = 0;
      let failed = 0;

      // Add each recipe to the cookbook
      for (const recipe of recipes) {
        const { error: addError } = await addRecipeToCookbook(selectedCookbookId, recipe.id);
        
        if (addError) {
          // If recipe is already in cookbook, count as success (idempotent)
          if (addError.includes('already in this cookbook')) {
            success++;
          } else {
            failed++;
            console.error(`Failed to add recipe ${recipe.recipe_name}:`, addError);
          }
        } else {
          success++;
        }
      }

      setSuccessCount(success);
      setFailedCount(failed);

      // If all succeeded or some succeeded, show success message
      if (success > 0) {
        // Wait a moment to show the success message
        setTimeout(() => {
          resetForm();
          onClose();
          
          if (onRecipesAdded) {
            onRecipesAdded();
          }
        }, 1000);
      } else {
        setError('Failed to add recipes to cookbook');
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error adding recipes to cookbook:', err);
      setLoading(false);
    }
  };

  const selectedCookbook = cookbooks.find(cb => cb.id === selectedCookbookId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold">
            Add to Cookbook
          </DialogTitle>
          <DialogDescription>
            Add {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} to a cookbook
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipes Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-2">Adding recipes:</p>
            <div className="max-h-24 overflow-y-auto">
              <ul className="text-sm text-gray-700 space-y-1">
                {recipes.slice(0, 5).map((recipe) => (
                  <li key={recipe.id}>• {recipe.recipe_name}</li>
                ))}
                {recipes.length > 5 && (
                  <li className="text-gray-500">...and {recipes.length - 5} more</li>
                )}
              </ul>
            </div>
          </div>

          {/* Cookbook Selector */}
          <div>
            <Label htmlFor="cookbook" className="text-sm font-medium text-gray-700">
              Select Cookbook *
            </Label>
            {cookbooksLoading ? (
              <div className="mt-1 text-sm text-gray-500">Loading cookbooks...</div>
            ) : (
              <div className="relative mt-2" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCookbookDropdown(!showCookbookDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <span className={selectedCookbookId ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedCookbookId && selectedCookbook
                      ? selectedCookbook.name
                      : 'Select a cookbook'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
                {showCookbookDropdown && (
                  <>
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {cookbooks.map((cookbook) => (
                        <button
                          key={cookbook.id}
                          type="button"
                          onClick={() => {
                            setSelectedCookbookId(cookbook.id);
                            setShowCookbookDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                            selectedCookbookId === cookbook.id
                              ? 'bg-gray-100 text-gray-900 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {cookbook.name}
                          {cookbook.is_default && (
                            <span className="ml-2 text-xs text-gray-500">(Default)</span>
                          )}
                        </button>
                      ))}
                    </div>
                    {/* Overlay to close dropdown */}
                    <div 
                      className="fixed inset-0 z-[5]" 
                      onClick={() => setShowCookbookDropdown(false)}
                    ></div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Success/Error Messages */}
          {successCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-600">
                Successfully added {successCount} {successCount === 1 ? 'recipe' : 'recipes'} to cookbook
                {failedCount > 0 && ` (${failedCount} failed)`}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddToCookbook}
            disabled={loading || !selectedCookbookId || recipes.length === 0}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading ? `Adding ${recipes.length} recipes...` : `Add ${recipes.length === 1 ? 'Recipe' : 'Recipes'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
