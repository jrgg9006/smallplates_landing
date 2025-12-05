"use client";

import React from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { RecipeTable } from "@/components/profile/recipes/RecipeTable";
import { RecipeTableControls } from "@/components/profile/recipes/RecipeTableControls";
import { AddRecipeModal } from "@/components/profile/recipes/AddRecipeModal";
import { BulkActionsBar } from "@/components/profile/recipes/BulkActionsBar";
import { BulkAddToCookbookModal } from "@/components/profile/recipes/BulkAddToCookbookModal";
import { ShareCollectionModal } from "@/components/profile/guests/ShareCollectionModal";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { AddRecipePageDropdown } from "@/components/ui/AddRecipePageDropdown";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllRecipes } from "@/lib/supabase/recipes";
import { RecipeWithGuest } from "@/lib/types/database";

export default function RecipesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddToCookbookModalOpen, setIsBulkAddToCookbookModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [collectionUrl, setCollectionUrl] = useState<string>('');
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [clearSelectionTrigger, setClearSelectionTrigger] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedRecipes, setSelectedRecipes] = useState<RecipeWithGuest[]>([]);
  const [recipeCounts, setRecipeCounts] = useState({
    all: 0,
    myOwn: 0,
    collected: 0,
    discovered: 0,
  });

  const handleAddRecipe = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleRecipeAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSelectionChange = useCallback((recipes: RecipeWithGuest[]) => {
    setSelectedRecipes(recipes);
  }, []);

  const handleClearSelection = () => {
    setClearSelectionTrigger(prev => prev + 1);
  };

  const handleBulkAddToCookbook = () => {
    setIsBulkAddToCookbookModalOpen(true);
  };

  const handleCloseBulkAddModal = () => {
    setIsBulkAddToCookbookModalOpen(false);
  };

  const handleBulkRecipesAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    handleClearSelection();
  };

  const handleShare = () => {
    // Placeholder - will be implemented later
    setIsShareModalOpen(true);
    console.log('Share recipes:', selectedRecipes);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
  };

  const handleShareRecipes = () => {
    // Placeholder - will be implemented later
    console.log('Share recipes clicked');
  };

  const handleGetRecipesFromFriends = async () => {
    // Same logic as RecipeCollectorButton - open collection modal
    try {
      const { getUserCollectionToken } = await import("@/lib/supabase/collection");
      const { getCurrentProfile } = await import("@/lib/supabase/profiles");
      const { createShareURL } = await import("@/lib/utils/sharing");
      
      const { data: tokenData } = await getUserCollectionToken();
      const { data: profile } = await getCurrentProfile();
      
      if (tokenData && typeof window !== 'undefined') {
        const url = createShareURL(window.location.origin, tokenData);
        setCollectionUrl(url);
        setUserFullName(profile?.full_name || null);
        setIsCollectionModalOpen(true);
      }
    } catch (err) {
      console.error('Error loading collection data:', err);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Calculate recipe counts
  useEffect(() => {
    const calculateCounts = async () => {
      if (!user) return;
      
      try {
        const { data: allRecipes, error } = await getAllRecipes();
        if (error || !allRecipes) {
          return;
        }

        const all = allRecipes.length;
        const myOwn = allRecipes.filter((recipe: RecipeWithGuest) => recipe.guests?.is_self === true).length;
        const collected = allRecipes.filter((recipe: RecipeWithGuest) => recipe.guests?.is_self === false || recipe.guests?.is_self === null).length;
        const discovered = allRecipes.filter((recipe: RecipeWithGuest) => 
          recipe.comments && (
            recipe.comments.includes('[DISCOVERED_FROM_GROUP]') ||
            recipe.comments.includes('[DISCOVERED_FROM_GROUP:') ||
            recipe.comments.includes('[ORIGINAL_CHEF:')
          )
        ).length;

        setRecipeCounts({ all, myOwn, collected, discovered });
      } catch (err) {
        console.error('Error calculating recipe counts:', err);
      }
    };

    calculateCounts();
  }, [user, refreshTrigger]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-gray-700">
      <ProfileHeader />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            {/* Title section with editorial text - centered on mobile */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8 mb-4 lg:mb-0 justify-center lg:justify-start w-full lg:w-auto">
              {/* Editorial Text Version */}
              <motion.div 
                className="text-center lg:text-left w-full lg:w-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h1 className="font-serif text-5xl md:text-6xl font-medium tracking-tight text-gray-900 mb-1">
                  My Small Plates
                </h1>
                <h3 className="text-lg font-light text-gray-600 mb-4 lg:mb-0">
                  Your cookbook is cooking...
                </h3>
              </motion.div>

              {/* Mobile: Add Recipe dropdown - positioned after subtitle */}
              <div className="lg:hidden mb-4 flex justify-center">
                <AddRecipePageDropdown
                  onAddRecipe={handleAddRecipe}
                  onGetRecipesFromFriends={handleGetRecipesFromFriends}
                  title="Add Recipe"
                />
              </div>
            </div>
            
            {/* Right side - Action buttons - centered on mobile, stacked vertically */}
            <div className="flex-shrink-0 flex flex-col lg:flex-row items-center gap-3 lg:gap-4 justify-center lg:justify-end w-full lg:w-auto">
              <Button
                onClick={handleShareRecipes}
                className="hidden w-full lg:w-auto bg-purple-700 text-white hover:bg-purple-900 rounded-lg px-8 py-3 text-base font-medium items-center justify-center gap-2"
              >
                <Share2 className="h-5 w-5" />
                Share Recipes
              </Button>
              <AddRecipePageDropdown
                onAddRecipe={handleAddRecipe}
                onGetRecipesFromFriends={handleGetRecipesFromFriends}
                title="Add Recipe"
                className="hidden lg:flex"
              />
            </div>
          </div>
        </div>

        {/* Recipe Table Controls */}
        <RecipeTableControls
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          recipeCounts={recipeCounts}
        />

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedRecipes.length}
          onAddToCookbook={handleBulkAddToCookbook}
          onShare={handleShare}
          onClearSelection={handleClearSelection}
        />

        {/* Recipe Table */}
        <div>
          <RecipeTable 
            key={refreshTrigger} 
            searchValue={searchValue}
            filterType={filterType}
            onDataLoaded={() => {
              // Can add callback logic here if needed
            }}
            onSelectionChange={handleSelectionChange}
            clearSelectionTrigger={clearSelectionTrigger}
          />
        </div>

        {/* Add Recipe Modal */}
        <AddRecipeModal
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          onRecipeAdded={handleRecipeAdded}
        />

        {/* Bulk Add to Cookbook Modal */}
        <BulkAddToCookbookModal
          isOpen={isBulkAddToCookbookModalOpen}
          onClose={handleCloseBulkAddModal}
          recipes={selectedRecipes}
          onRecipesAdded={handleBulkRecipesAdded}
        />

        {/* Share Modal - Placeholder */}
        {isShareModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">Share Recipe</h2>
              <p className="text-gray-600 mb-4">
                This feature will allow you to share {selectedRecipes.length} {selectedRecipes.length === 1 ? 'recipe' : 'recipes'} with other users.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Coming soon...
              </p>
              <Button
                onClick={handleCloseShareModal}
                className="w-full bg-black text-white hover:bg-gray-800"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Collection Modal */}
        {collectionUrl && (
          <ShareCollectionModal
            isOpen={isCollectionModalOpen}
            onClose={() => setIsCollectionModalOpen(false)}
            collectionUrl={collectionUrl}
            userName={userFullName}
          />
        )}

      </div>
    </div>
  );
}

