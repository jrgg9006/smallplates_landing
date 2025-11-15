"use client";

import React from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CookbookTable } from "@/components/profile/cookbook/CookbookTable";
import { CookbookTableControls } from "@/components/profile/cookbook/CookbookTableControls";
import { CreateCookbookModal } from "@/components/profile/cookbook/CreateCookbookModal";
import { AddNoteModal } from "@/components/profile/cookbook/AddNoteModal";
import { EditCookbookNameModal } from "@/components/profile/cookbook/EditCookbookNameModal";
import { AddRecipesToCookbookModal } from "@/components/profile/cookbook/AddRecipesToCookbookModal";
import { AddRecipeModal } from "@/components/profile/recipes/AddRecipeModal";
import ProfileDropdown from "@/components/profile/ProfileDropdown";
import ProfileNavigation from "@/components/profile/ProfileNavigation";
import { getAllCookbooks, getOrCreateDefaultCookbook } from "@/lib/supabase/cookbooks";
import { Cookbook, RecipeInCookbook } from "@/lib/types/database";
import { Pencil, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CookbookPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [isAddRecipesModalOpen, setIsAddRecipesModalOpen] = useState(false);
  const [isAddNewRecipeModalOpen, setIsAddNewRecipeModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [selectedCookbookId, setSelectedCookbookId] = useState<string | null>(null);
  const [selectedRecipeForNote, setSelectedRecipeForNote] = useState<RecipeInCookbook | null>(null);
  const [cookbooksLoading, setCookbooksLoading] = useState(true);

  const handleCreateCookbook = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCookbookCreated = (newCookbook: Cookbook) => {
    setCookbooks(prev => [newCookbook, ...prev]);
    setSelectedCookbookId(newCookbook.id);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCookbookChange = (cookbookId: string) => {
    setSelectedCookbookId(cookbookId);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddNote = (recipe: RecipeInCookbook) => {
    setSelectedRecipeForNote(recipe);
    setIsNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setIsNoteModalOpen(false);
    setSelectedRecipeForNote(null);
  };

  const handleNoteUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditName = () => {
    setIsEditNameModalOpen(true);
  };

  const handleCloseEditNameModal = () => {
    setIsEditNameModalOpen(false);
  };

  const handleCookbookNameUpdated = (updatedCookbook: Cookbook) => {
    setCookbooks(prev => 
      prev.map(cb => cb.id === updatedCookbook.id ? updatedCookbook : cb)
    );
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRecipesAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddExistingRecipe = () => {
    setIsAddRecipesModalOpen(true);
  };

  const handleAddNewRecipe = () => {
    setIsAddNewRecipeModalOpen(true);
  };

  const handleCloseAddRecipesModal = () => {
    setIsAddRecipesModalOpen(false);
  };

  const handleCloseAddNewRecipeModal = () => {
    setIsAddNewRecipeModalOpen(false);
  };

  const handlePurchaseCookbook = () => {
    // TODO: Implement purchase flow
    console.log('Purchase cookbook clicked - placeholder');
    // This will navigate to purchase page in the future
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

  // Load cookbooks on mount
  useEffect(() => {
    const loadCookbooks = async () => {
      if (!user) return;

      setCookbooksLoading(true);
      try {
        // First, try to ensure default cookbook exists
        const { data: defaultCookbook, error: defaultError } = await getOrCreateDefaultCookbook();
        
        if (defaultError) {
          console.warn('Could not create default cookbook:', defaultError);
          // Continue anyway - user might not have permission or there might be a constraint issue
        }
        
        // Then load all cookbooks
        const { data: allCookbooks, error } = await getAllCookbooks();
        
        if (error) {
          console.error('Error loading cookbooks:', error);
          return;
        }
        
        setCookbooks(allCookbooks || []);
        
        // Select default cookbook if available, otherwise select first cookbook
        if (defaultCookbook) {
          setSelectedCookbookId(defaultCookbook.id);
        } else if (allCookbooks && allCookbooks.length > 0) {
          setSelectedCookbookId(allCookbooks[0].id);
        }
        // If no cookbooks exist, selectedCookbookId will remain null
        // The CookbookTable component handles this case
      } catch (err) {
        console.error('Error loading cookbooks:', err);
      } finally {
        setCookbooksLoading(false);
      }
    };

    loadCookbooks();
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || cookbooksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const selectedCookbook = selectedCookbookId 
    ? cookbooks.find(cb => cb.id === selectedCookbookId) 
    : null;

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
          
          {/* Desktop: Navigation + Profile */}
          <div className="hidden lg:flex items-center gap-6">
            <ProfileNavigation variant="desktop" />
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
          <div className="px-6 py-4">
            {/* Navigation Links */}
            <ProfileNavigation 
              variant="mobile" 
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Account Actions */}
            <div className="space-y-3">
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
                <div className="flex items-center gap-3 justify-center lg:justify-start">
                  <h1 className="font-serif text-6xl md:text-6xl font-medium tracking-tight text-gray-900 mb-1">
                    {selectedCookbook?.name || 'My Cookbook'}
                  </h1>
                  {selectedCookbookId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditName}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                      title="Edit cookbook name"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <h3 className="text-lg font-light text-gray-600">
                  {selectedCookbook?.description?.trim() || 'Organize your favorite recipes'}
                </h3>
              </motion.div>
            </div>
            
            {/* Right side - Action buttons - centered on mobile */}
            <div className="flex-shrink-0 flex items-center gap-4 justify-center lg:justify-end">
              {/* Purchase Cookbook Button */}
              <Button
                onClick={handlePurchaseCookbook}
                className="bg-teal-600 text-white hover:bg-teal-700 rounded-lg px-8 py-3 text-base font-medium flex items-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Print your Cookbook!
              </Button>
            </div>
          </div>
        </div>

        {/* Cookbook Table Controls */}
        <CookbookTableControls
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          cookbooks={cookbooks}
          selectedCookbookId={selectedCookbookId}
          onCookbookChange={handleCookbookChange}
          onCreateCookbook={handleCreateCookbook}
          onAddExistingRecipe={handleAddExistingRecipe}
          onAddNewRecipe={handleAddNewRecipe}
        />

        {/* Cookbook Table */}
        <div>
          <CookbookTable 
            key={refreshTrigger} 
            cookbookId={selectedCookbookId}
            searchValue={searchValue}
            onDataLoaded={() => {
              // Can add callback logic here if needed
            }}
            onRecipeRemoved={() => {
              setRefreshTrigger(prev => prev + 1);
            }}
            onAddNote={handleAddNote}
          />
        </div>

        {/* Create Cookbook Modal */}
        <CreateCookbookModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onCookbookCreated={handleCookbookCreated}
        />

        {/* Add Note Modal */}
        <AddNoteModal
          isOpen={isNoteModalOpen}
          onClose={handleCloseNoteModal}
          cookbookId={selectedCookbookId}
          recipeId={selectedRecipeForNote?.id || null}
          currentNote={selectedRecipeForNote?.cookbook_recipes?.note || null}
          recipeName={selectedRecipeForNote?.recipe_name}
          onNoteUpdated={handleNoteUpdated}
        />

        {/* Edit Cookbook Name Modal */}
        <EditCookbookNameModal
          isOpen={isEditNameModalOpen}
          onClose={handleCloseEditNameModal}
          cookbook={selectedCookbookId ? cookbooks.find(cb => cb.id === selectedCookbookId) || null : null}
          onCookbookUpdated={handleCookbookNameUpdated}
        />

        {/* Add Existing Recipes Modal */}
        <AddRecipesToCookbookModal
          isOpen={isAddRecipesModalOpen}
          onClose={handleCloseAddRecipesModal}
          cookbookId={selectedCookbookId}
          onRecipesAdded={handleRecipesAdded}
        />

        {/* Add New Recipe Modal */}
        <AddRecipeModal
          isOpen={isAddNewRecipeModalOpen}
          onClose={handleCloseAddNewRecipeModal}
          cookbookId={selectedCookbookId}
          onRecipeAdded={handleRecipesAdded}
        />
      </div>
    </div>
  );
}

