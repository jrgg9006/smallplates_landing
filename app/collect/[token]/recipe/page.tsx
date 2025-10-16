"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { validateCollectionToken } from '@/lib/supabase/collection';
import type { CollectionTokenInfo } from '@/lib/types/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface GuestData {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  existing: boolean;
}

export default function RecipeFormPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  // State management
  const [tokenInfo, setTokenInfo] = useState<CollectionTokenInfo | null>(null);
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  
  // Additional guest info (for new guests)
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Initialize component
  useEffect(() => {
    async function initialize() {
      // Validate token
      const { data, error } = await validateCollectionToken(token);
      if (error || !data) {
        setError(error || 'Invalid collection link');
        setLoading(false);
        return;
      }
      setTokenInfo(data);

      // Get guest data from session storage
      const storedGuestData = sessionStorage.getItem('collectionGuestData');
      if (!storedGuestData) {
        // Redirect back to landing if no guest data
        router.push(`/collect/${token}`);
        return;
      }

      const parsedGuestData = JSON.parse(storedGuestData) as GuestData;
      setGuestData(parsedGuestData);
      
      // Pre-populate email/phone if existing guest
      if (parsedGuestData.existing && parsedGuestData.email) {
        setEmail(parsedGuestData.email);
      }
      if (parsedGuestData.existing && parsedGuestData.phone) {
        setPhone(parsedGuestData.phone);
      }
      
      setLoading(false);
    }

    initialize();
  }, [token, router]);

  // Handle form submission
  const handleSubmit = () => {
    if (!recipeName.trim() || !ingredients.trim() || !instructions.trim()) {
      setError('Please fill in all required recipe fields');
      return;
    }

    // Prepare submission data
    const submissionData = {
      guestData: {
        ...guestData!,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      },
      recipe: {
        recipeName: recipeName.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        personalNote: personalNote.trim() || undefined,
      }
    };

    // Store in session storage for review page
    sessionStorage.setItem('collectionSubmissionData', JSON.stringify(submissionData));
    
    // Navigate to review page
    router.push(`/collect/${token}/review`);
  };

  // Handle back navigation
  const handleBack = () => {
    router.push(`/collect/${token}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleBack} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBack}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Image
            src="/images/SmallPlates_logo_horizontal.png"
            alt="Small Plates & Co"
            width={200}
            height={40}
            priority
          />
          <div className="w-10"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">

          {/* Recipe Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recipe Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recipe Name */}
              <div>
                <Label htmlFor="recipeName">Recipe Name *</Label>
                <Input
                  id="recipeName"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="e.g., Grandma's Chocolate Chip Cookies"
                  required
                  className="mt-1"
                />
              </div>

              {/* Ingredients */}
              <div>
                <Label htmlFor="ingredients">Ingredients *</Label>
                <textarea
                  id="ingredients"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="List all ingredients with measurements&#10;e.g.,&#10;• 2 cups all-purpose flour&#10;• 1 cup brown sugar&#10;• 1/2 cup butter, softened"
                  required
                  rows={8}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include measurements and any special notes about ingredients
                </p>
              </div>

              {/* Instructions */}
              <div>
                <Label htmlFor="instructions">Instructions *</Label>
                <textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Step-by-step cooking instructions&#10;e.g.,&#10;1. Preheat oven to 375°F&#10;2. Mix dry ingredients in a large bowl&#10;3. In separate bowl, cream butter and sugar..."
                  required
                  rows={10}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be as detailed as possible so others can recreate your recipe
                </p>
              </div>

              {/* Personal Note */}
              <div>
                <Label htmlFor="personalNote">Personal Note for {tokenInfo?.user_name} (optional)</Label>
                <textarea
                  id="personalNote"
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                  placeholder="Share a memory, story, or special tip about this recipe..."
                  rows={4}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This could be a family story, when you learned the recipe, or cooking tips
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-black text-white hover:bg-gray-800"
            >
              Review Recipe
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}