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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllCookbooks, createCookbook, addRecipeToCookbook } from "@/lib/supabase/cookbooks";
import { addRecipeToGroup } from "@/lib/supabase/groupRecipes";
import { Cookbook } from "@/lib/types/database";
import { ChevronDown, Plus } from "lucide-react";
import { RecipeWithGuest } from "@/lib/types/database";

interface AddToCookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: RecipeWithGuest | null;
  onRecipeAdded?: () => void;
}

export function AddToCookbookModal({ 
  isOpen, 
  onClose, 
  recipe,
  onRecipeAdded 
}: AddToCookbookModalProps) {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [loading, setLoading] = useState(false);
  const [cookbooksLoading, setCookbooksLoading] = useState(false);
  const [selectedCookbookId, setSelectedCookbookId] = useState<string>('');
  const [showCookbookDropdown, setShowCookbookDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCookbookName, setNewCookbookName] = useState('');
  const [creatingCookbook, setCreatingCookbook] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);
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
    setShowCreateForm(false);
    setNewCookbookName('');
    setError(null);
    setIsAdded(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleCreateCookbook = async () => {
    if (!newCookbookName.trim()) {
      setError('Please enter a cookbook name');
      return;
    }

    setCreatingCookbook(true);
    setError(null);

    try {
      const { data, error: createError } = await createCookbook(newCookbookName.trim());
      
      if (createError) {
        setError(createError);
        setCreatingCookbook(false);
        return;
      }

      // Add the new cookbook to the list and select it
      if (data) {
        setCookbooks(prev => [data, ...prev]);
        setSelectedCookbookId(data.id);
        setShowCreateForm(false);
        setNewCookbookName('');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error creating cookbook:', err);
    } finally {
      setCreatingCookbook(false);
    }
  };

  const handleAddToCookbook = async () => {
    if (!recipe) {
      setError('No recipe selected');
      return;
    }

    if (!selectedCookbookId) {
      setError('Please select a cookbook');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Since we're now showing Groups as "Cookbooks", use addRecipeToGroup
      const { error: addError } = await addRecipeToGroup(selectedCookbookId, recipe.id);
      
      if (addError) {
        setError(addError);
        setLoading(false);
        return;
      }

      // Success! Show confirmation state
      setIsAdded(true);
      setLoading(false);
      
      // Close modal after a brief delay to show confirmation
      setTimeout(() => {
        resetForm();
        handleClose();
        
        if (onRecipeAdded) {
          onRecipeAdded();
        }
      }, 1000); // 1 second delay to show "Added" state
      
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error adding recipe to group (cookbook):', err);
      setLoading(false);
    }
  };

  const selectedCookbook = cookbooks.find(cb => cb.id === selectedCookbookId);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Use setTimeout to prevent event propagation after modal closes
        setTimeout(() => {
          handleClose();
        }, 0);
      }
    }}>
      <DialogContent 
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-semibold">
            Add to Cookbook
          </DialogTitle>
          {recipe && (
            <DialogDescription>
              Add &quot;{recipe.recipe_name}&quot; to a cookbook
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipe Info */}
          {recipe && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-1">Adding recipe:</p>
              <p className="font-medium text-gray-900">{recipe.recipe_name}</p>
              {recipe.guests && (
                <p className="text-sm text-gray-500 mt-1">
                  by {recipe.guests.first_name} {recipe.guests.last_name}
                </p>
              )}
            </div>
          )}

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

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              if (!isAdded) {
                handleAddToCookbook();
              }
            }}
            disabled={loading || !selectedCookbookId || !recipe}
            className={
              isAdded 
                ? "bg-green-600 text-white hover:bg-green-600" 
                : "bg-black text-white hover:bg-gray-800"
            }
          >
            {loading ? 'Adding...' : isAdded ? 'Added' : 'Add to Cookbook'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

