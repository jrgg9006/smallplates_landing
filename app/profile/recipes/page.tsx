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
import ProfileDropdown from "@/components/profile/ProfileDropdown";
import { Plus, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllRecipes } from "@/lib/supabase/recipes";
import { RecipeWithGuest } from "@/lib/types/database";
import { getUserCollectionToken } from "@/lib/supabase/collection";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import { createShareURL } from "@/lib/utils/sharing";

export default function RecipesPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddToCookbookModalOpen, setIsBulkAddToCookbookModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isShareCollectionModalOpen, setIsShareCollectionModalOpen] = useState(false);
  const [collectionUrl, setCollectionUrl] = useState<string>('');
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const handleShareCollectionLink = async () => {
    try {
      const { data: tokenData } = await getUserCollectionToken();
      const { data: profile } = await getCurrentProfile();
      
      if (tokenData && typeof window !== 'undefined') {
        const url = createShareURL(window.location.origin, tokenData);
        setCollectionUrl(url);
        setUserFullName(profile?.full_name || null);
        setIsShareCollectionModalOpen(true);
      }
    } catch (err) {
      console.error('Error loading collection data:', err);
    }
  };

  const handleCloseShareCollectionModal = () => {
    setIsShareCollectionModalOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await signOut();
  };

  const handleAccount = () => {
    setIsMobileMenuOpen(false);
    router.push('/profile/account');
  };

  const handleOrders = () => {
    setIsMobileMenuOpen(false);
    router.push('/profile/orders');
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
        const discovered = 0; // Placeholder - will be implemented later

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo - Aligned with content */}
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/images/SmallPlates_logo_horizontal.png"
              alt="Small Plates & Co."
              width={200}
              height={40}
              className="cursor-pointer"
              priority
            />
          </Link>
          
          {/* Desktop: Notification Bell + Profile */}
          <div className="hidden lg:flex items-center gap-3">
            <ProfileDropdown />
          </div>

          {/* Mobile: Burger Menu */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <svg 
                className="h-6 w-6 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-gray-50">
          <div className="px-6 py-4 space-y-3">
            <button
              onClick={handleAccount}
              className="block w-full text-center py-3 px-5 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Account Settings
            </button>
            <button
              onClick={handleOrders}
              className="block w-full text-center py-3 px-5 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Orders & Shipping
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-center py-3 px-5 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            {/* Title section with editorial text - centered on mobile */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8 mb-4 lg:mb-0 justify-center lg:justify-start">
              {/* Editorial Text Version */}
              <motion.div 
                className="text-center lg:text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h1 className="font-serif text-6xl md:text-6xl font-medium tracking-tight text-gray-900 mb-1">
                  My Recipes
                </h1>
                <h3 className="text-lg font-light text-gray-600">
                  Your cookbook is cooking...
                </h3>
              </motion.div>
            </div>
            
            {/* Right side - Action buttons - centered on mobile */}
            <div className="flex-shrink-0 flex items-center gap-4 justify-center lg:justify-end">
              <Button
                onClick={handleShareRecipes}
                className="bg-purple-700 text-white hover:bg-purple-900 rounded-lg px-8 py-3 text-base font-medium flex items-center gap-2"
              >
                <Share2 className="h-5 w-5" />
                Share Recipes
              </Button>
              <Button
                onClick={handleShareCollectionLink}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-8 py-3 text-base font-medium flex items-center gap-2"
              >
                <Link2 className="h-5 w-5" />
                Get Recipes from Friends
              </Button>
              <Button
                onClick={handleAddRecipe}
                className="bg-teal-600 text-white hover:bg-teal-700 rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow p-0"
              >
                <Plus className="h-12 w-12" />
              </Button>
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

        {/* Share Collection Modal */}
        {collectionUrl && (
          <ShareCollectionModal
            isOpen={isShareCollectionModalOpen}
            onClose={handleCloseShareCollectionModal}
            collectionUrl={collectionUrl}
            userName={userFullName}
          />
        )}
      </div>
    </div>
  );
}

