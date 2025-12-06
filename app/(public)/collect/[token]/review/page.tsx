"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Check } from 'lucide-react';
import { validateCollectionToken, submitGuestRecipe } from '@/lib/supabase/collection';
import type { CollectionTokenInfo, CollectionGuestSubmission } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GuestData {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  existing: boolean;
}

interface RecipeData {
  recipeName: string;
  ingredients: string;
  instructions: string;
  personalNote?: string;
}

interface SubmissionData {
  guestData: GuestData;
  recipe: RecipeData;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  // State management
  const [tokenInfo, setTokenInfo] = useState<CollectionTokenInfo | null>(null);
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Get submission data from session storage
      const storedSubmissionData = sessionStorage.getItem('collectionSubmissionData');
      if (!storedSubmissionData) {
        // Redirect back to landing if no submission data
        router.push(`/collect/${token}`);
        return;
      }

      const parsedSubmissionData = JSON.parse(storedSubmissionData) as SubmissionData;
      setSubmissionData(parsedSubmissionData);
      setLoading(false);
    }

    initialize();
  }, [token, router]);

  // Handle back navigation
  const handleBack = () => {
    router.push(`/collect/${token}/recipe`);
  };

  // Handle recipe submission
  const handleSubmit = async () => {
    if (!submissionData || !tokenInfo) return;

    setSubmitting(true);
    setError(null);

    try {
      const guestSubmission: CollectionGuestSubmission = {
        first_name: submissionData.guestData.firstName,
        last_name: submissionData.guestData.lastName,
        email: submissionData.guestData.email,
        phone: submissionData.guestData.phone,
        recipe_name: submissionData.recipe.recipeName,
        ingredients: submissionData.recipe.ingredients,
        instructions: submissionData.recipe.instructions,
        comments: submissionData.recipe.personalNote,
      };

      const { data, error } = await submitGuestRecipe(token, guestSubmission);

      if (error) {
        setError(error);
        setSubmitting(false);
        return;
      }

      // Success! Clear session storage and show success state
      sessionStorage.removeItem('collectionGuestData');
      sessionStorage.removeItem('collectionSubmissionData');
      setSubmitted(true);
      setSubmitting(false);

    } catch (err) {
      setError('An unexpected error occurred while submitting your recipe');
      setSubmitting(false);
      console.error('Submission error:', err);
    }
  };

  // Handle submit another recipe
  const handleSubmitAnother = () => {
    // Clear any existing data and go back to landing
    sessionStorage.removeItem('collectionGuestData');
    sessionStorage.removeItem('collectionSubmissionData');
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
  if (error && !submissionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push(`/collect/${token}`)} variant="outline">
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Small Plate Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for sharing your <strong>{submissionData?.recipe.recipeName}</strong> Small Plate 
                with {tokenInfo?.user_name}. It has been added to their collection.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={handleSubmitAnother}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  Send Another Small Plate
                </Button>
                <p className="text-sm text-gray-500">
                  Want to share more plates? Click above to submit another one.
                </p>
              </div>
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
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleBack}
              className="rounded-full"
              disabled={submitting}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-light">
                Review Your Small Plate
              </h1>
              <p className="text-gray-600">
                Double-check everything before submitting
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Guest Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {submissionData?.guestData.firstName} {submissionData?.guestData.lastName}</p>
                {submissionData?.guestData.email && (
                  <p><strong>Email:</strong> {submissionData.guestData.email}</p>
                )}
                {submissionData?.guestData.phone && (
                  <p><strong>Phone:</strong> {submissionData.guestData.phone}</p>
                )}
                <p className="text-sm text-gray-600">
                  {submissionData?.guestData.existing ? "Found in guest list" : "New guest - will be added"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recipe Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Small Plate: {submissionData?.recipe.recipeName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ingredients */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">What you need to make this plate</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {submissionData?.recipe.ingredients}
                  </pre>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">How to make this plate</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {submissionData?.recipe.instructions}
                  </pre>
                </div>
              </div>

              {/* Personal Note */}
              {submissionData?.recipe.personalNote && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Personal Note</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <pre className="text-sm text-blue-800 whitespace-pre-wrap font-sans">
                      {submissionData.recipe.personalNote}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex-1"
              disabled={submitting}
            >
              Edit my Small Plate
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-black text-white hover:bg-gray-800"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit my Small Plate'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}