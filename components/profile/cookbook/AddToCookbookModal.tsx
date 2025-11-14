"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllCookbooks, createCookbook, addRecipeToCookbook } from "@/lib/supabase/cookbooks";
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
  const [isMobile, setIsMobile] = useState(false);
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [loading, setLoading] = useState(false);
  const [cookbooksLoading, setCookbooksLoading] = useState(false);
  const [selectedCookbookId, setSelectedCookbookId] = useState<string>('');
  const [showCookbookDropdown, setShowCookbookDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCookbookName, setNewCookbookName] = useState('');
  const [creatingCookbook, setCreatingCookbook] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      const { error: addError } = await addRecipeToCookbook(selectedCookbookId, recipe.id);
      
      if (addError) {
        setError(addError);
        setLoading(false);
        return;
      }

      // Success! Close modal and refresh
      resetForm();
      onClose();
      
      if (onRecipeAdded) {
        onRecipeAdded();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error adding recipe to cookbook:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCookbook = cookbooks.find(cb => cb.id === selectedCookbookId);

  const modalContent = (
    <>
      <div className="space-y-6 pb-24 pr-4">
        {/* Recipe Info */}
        {recipe && (
          <div className="bg-gray-50 rounded-lg p-4">
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
          <Label htmlFor="cookbook" className="text-sm font-medium text-gray-600">
            Select Cookbook *
          </Label>
          {cookbooksLoading ? (
            <div className="mt-1 text-sm text-gray-500">Loading cookbooks...</div>
          ) : (
            <div className="relative mt-1" ref={dropdownRef}>
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

          {/* Create New Cookbook Button */}
          <div className="mt-3">
            {!showCreateForm ? (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <Plus className="h-4 w-4" />
                Create New Cookbook
              </button>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Cookbook name"
                  value={newCookbookName}
                  onChange={(e) => setNewCookbookName(e.target.value)}
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateCookbook();
                    } else if (e.key === 'Escape') {
                      setShowCreateForm(false);
                      setNewCookbookName('');
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleCreateCookbook}
                    disabled={creatingCookbook || !newCookbookName.trim()}
                    className="text-sm py-1 px-3 h-auto"
                    size="sm"
                  >
                    {creatingCookbook ? 'Creating...' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewCookbookName('');
                    }}
                    className="text-sm py-1 px-3 h-auto"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </>
  );

  // Mobile version
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="!h-[85vh] !max-h-[85vh] rounded-t-[20px] flex flex-col overflow-hidden p-0">
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-gray-300" />
          
          <div className="p-6 flex flex-col h-full overflow-hidden">
            <SheetHeader className="px-0">
              <SheetTitle className="font-serif text-2xl font-semibold mb-4">Add to Cookbook</SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col overflow-y-auto">
              {modalContent}
            </div>
            
            {/* Add Button */}
            <div className="mt-4 pb-safe">
              <Button 
                onClick={handleAddToCookbook}
                disabled={loading || !selectedCookbookId || !recipe}
                className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add to Cookbook'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="!w-[45%] !max-w-none h-full flex flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl font-semibold mb-4">Add to Cookbook</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col relative overflow-y-auto">
          {modalContent}
          
          {/* Add Button - Fixed position in bottom right */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-auto">
            <Button 
              onClick={handleAddToCookbook}
              disabled={loading || !selectedCookbookId || !recipe}
              className="w-full bg-black text-white hover:bg-gray-800 py-3 rounded-full disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add to Cookbook'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

