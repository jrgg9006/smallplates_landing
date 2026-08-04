"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import type { CollectionTokenInfo, CollectionGuestSubmission } from '@/lib/types/database';
import { submitGuestRecipe, submitGuestRecipeWithFiles, updateGuestRecipeNotification, updateGuestNotification, checkStagedPhotoForRecipe } from '@/lib/supabase/collection';
import Frame from './Frame';
import IntroInfoStep from './steps/IntroInfoStep';
// inline simple hero step to avoid import resolution issues
import RecipeFormStep, { type RecipeData as FormRecipeData } from './steps/RecipeFormStep';
import SummaryStep from './steps/SummaryStep';
import SuccessStep from './steps/SuccessStep';
import WelcomeStep from './steps/WelcomeStep';
import RecipeTypeStep, { RecipeTypeOption } from './steps/RecipeTypeStep';
import UploadMethodStep from './steps/UploadMethodStep';
import ImageUploadStep from './steps/ImageUploadStep';
import RecipeTitleStep from './steps/RecipeTitleStep';
import PersonalNoteStep from './steps/PersonalNoteStep';
import SignatureStep from './steps/SignatureStep';
import PhotoRecipeWarningModal from './PhotoRecipeWarningModal';
import { checkPhotoHasRecipe } from '@/lib/recipe-journey/photoRecipeCheck';
import { journeySteps } from '@/lib/recipe-journey/recipeJourneySteps';
import { trackEvent, getAttribution } from '@/lib/analytics';

interface GuestData {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  printedName?: string;
  signatureUrl?: string;
  existing: boolean;
}

type RecipeData = FormRecipeData;

interface RecipeJourneyWrapperProps {
  tokenInfo: CollectionTokenInfo;
  guestData: GuestData;
  token: string;
  cookbookId?: string | null;
  groupId?: string | null;
}

export default function RecipeJourneyWrapper({ tokenInfo, guestData, token, cookbookId, groupId }: RecipeJourneyWrapperProps) {
  const router = useRouter();
  // steps: 0=welcome, 1=introInfo, 2=recipeForm, 3=summary
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [recipeData, setRecipeData] = useState<RecipeData>({
    recipeName: '',
    ingredients: '',
    instructions: '',
    personalNote: '',
    rawRecipeText: undefined,
    uploadMethod: 'text',
    documentUrls: [],
    audioUrl: undefined
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [checkingPhoto, setCheckingPhoto] = useState(false);
  const [photoWarningOpen, setPhotoWarningOpen] = useState(false);
  const [imageUploadKey, setImageUploadKey] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Reason: the warning modal is rendered outside the submit call, so we park the
  // promise resolver here and settle it when the guest picks an action.
  const photoDecisionRef = useRef<((decision: 'proceed' | 'cancel') => void) | null>(null);
  const [selectedRecipeType, setSelectedRecipeType] = useState<RecipeTypeOption | null>(null);
  const isDirtyRef = useRef(false);
  const lastRecipeIdRef = useRef<string | null>(null);
  const lastGuestIdRef = useRef<string | null>(null);
  const guestOptInRef = useRef<boolean>(false);
  const guestOptInEmailRef = useRef<string | null>(null);
  const totalSteps = journeySteps.length;

  // Reason: per-book gate for the signature feature. When off (existing books not yet
  // opted in), the journey never shows the "Sign it." step and each flow submits at its
  // pre-signature terminal: text → review, image → imageUpload, raw-paste → on paste.
  const signatureEnabled = tokenInfo.signature_enabled ?? true;

  // Reset journey: go to form
  const resetJourney = () => {
    setCurrentStepIndex(1);
    // Reason: keep the signature across "Submit another recipe" so the next recipe
    // pre-fills it (same person, same session). Everything else is cleared.
    setRecipeData(prev => ({
      recipeName: '',
      ingredients: '',
      instructions: '',
      personalNote: '',
      rawRecipeText: undefined,
      uploadMethod: 'text',
      documentUrls: [],
      audioUrl: undefined,
      signatureDataUrl: prev.signatureDataUrl
    }));
    setSubmitSuccess(false);
    setSubmitError(null);
    setSubmitting(false);
    setSelectedFiles([]);
    setUploadingImages(false);
    setUploadProgress(0);
    setSelectedRecipeType(null);
    // Clear localStorage
    localStorage.removeItem('recipeJourneyData');
    isDirtyRef.current = false;
  };

  // Get the cookbook creator's name for personalization
  const isPreviewMode = typeof window !== 'undefined' && sessionStorage?.getItem('isPreviewMode') === 'true';
  const creatorName = isPreviewMode
    ? '[Your Name]'
    : (tokenInfo.custom_share_signature || tokenInfo.user_name.split(' ')[0] || 'the cookbook creator');

  // Reason: occasion-aware note recipient, mirrors CollectionForm. Weddings/bridal
  // showers (and legacy null-occasion groups with people names) say "the couple";
  // other occasions use the recipient's first name; book-title groups (e.g.
  // "Grandma's recipes") get no recipient at all.
  const namesArePeople = Boolean(tokenInfo.couple_first_name || tokenInfo.partner_first_name);
  const isWeddingOccasion = tokenInfo.occasion === 'wedding' || tokenInfo.occasion === 'bridal_shower';
  const treatAsWedding = isWeddingOccasion || (!tokenInfo.occasion && namesArePeople);
  const noteRecipient = treatAsWedding
    ? 'the couple'
    : (tokenInfo.couple_first_name || tokenInfo.partner_first_name || null);

  const getImageUrl = () => {
    // Use couple image if available, otherwise use lemon image for all steps
    if (tokenInfo.couple_image_url) {
      return tokenInfo.couple_image_url;
    }
    // For all steps, use lemon as fallback when no couple image exists
    return '/images/onboarding/onboarding_lemon.png';
  };

  const focusFirstHeading = useCallback(() => {
    // move focus to the first heading in content for a11y
    const h = document.querySelector('main h2, main h1');
    if (h instanceof HTMLElement) h.focus();
  }, []);

  // Navigation functions
  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      const currentStep = journeySteps[currentStepIndex];
      
      // Special handling for welcome step - go to recipeType
      if (currentStep?.key === 'welcome') {
        const recipeTypeIndex = journeySteps.findIndex(s => s.key === 'recipeType');
        setCurrentStepIndex(recipeTypeIndex);
        setTimeout(focusFirstHeading, 0);
        // Scroll to top on mobile for better UX
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }
        return;
      }

      // Special handling for recipeType step - go to uploadMethod
      if (currentStep?.key === 'recipeType') {
        const uploadMethodIndex = journeySteps.findIndex(s => s.key === 'uploadMethod');
        setCurrentStepIndex(uploadMethodIndex);
        setTimeout(focusFirstHeading, 0);
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }
        return;
      }
      
      // Special handling for upload method selection
      if (currentStep?.key === 'uploadMethod') {
        // This is handled by handleUploadMethodSelect, don't advance here
        return;
      } else if (currentStep?.key === 'recipeForm') {
        // Text flow: signature step when enabled, else straight to review.
        const nextKey = signatureEnabled ? 'signature' : 'summary';
        setCurrentStepIndex(journeySteps.findIndex(s => s.key === nextKey));
      } else if (currentStep?.key === 'signature') {
        // After signature, go to review
        const summaryIndex = journeySteps.findIndex(s => s.key === 'summary');
        setCurrentStepIndex(summaryIndex);
      } else if (currentStep?.key === 'recipeTitle') {
        if (recipeData.rawRecipeText) {
          // Raw-paste flow: signature step when enabled, else submit now.
          if (signatureEnabled) {
            setCurrentStepIndex(journeySteps.findIndex(s => s.key === 'signature'));
          } else {
            handleSubmitWithRawText();
          }
        } else {
          const personalNoteIndex = journeySteps.findIndex(s => s.key === 'personalNote');
          setCurrentStepIndex(personalNoteIndex);
        }
      } else if (currentStep?.key === 'imageUpload') {
        // Image flow: check the photo here (right after upload), then go to signature.
        // Signatures off: submit now — the check runs inside that submit (same step).
        if (signatureEnabled) {
          advanceFromImageUpload(); // owns navigation; may stay here if the guest backs out
          return;
        } else {
          handleSubmitWithImages();
        }
      } else if (currentStep?.key === 'personalNote') {
        // From personal note, check which flow we need to continue with
        if (recipeData.rawRecipeText) {
          // Raw-paste flow: signature step when enabled, else submit now.
          if (signatureEnabled) {
            setCurrentStepIndex(journeySteps.findIndex(s => s.key === 'signature'));
          } else {
            handleSubmitWithRawText();
          }
        } else if (recipeData.uploadMethod === 'text') {
          // Text flow: go to recipe form
          const recipeFormIndex = journeySteps.findIndex(s => s.key === 'recipeForm');
          setCurrentStepIndex(recipeFormIndex);
        } else if (recipeData.uploadMethod === 'image') {
          // Image flow: go to image upload
          const imageUploadIndex = journeySteps.findIndex(s => s.key === 'imageUpload');
          setCurrentStepIndex(imageUploadIndex);
        }
      } else {
        // Normal navigation
        setCurrentStepIndex(currentStepIndex + 1);
      }
      
      setTimeout(focusFirstHeading, 0);
      
      // Scroll to top on mobile for better UX
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const currentStep = journeySteps[currentStepIndex];
      
      // Special handling for recipeType - go back to welcome
      if (currentStep?.key === 'recipeType') {
        const welcomeIndex = journeySteps.findIndex(s => s.key === 'welcome');
        setCurrentStepIndex(welcomeIndex);
        setTimeout(focusFirstHeading, 0);
        // Scroll to top on mobile for better UX
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }
        return;
      }

      // Special handling for uploadMethod - go back to recipeType
      if (currentStep?.key === 'uploadMethod') {
        const recipeTypeIndex = journeySteps.findIndex(s => s.key === 'recipeType');
        setCurrentStepIndex(recipeTypeIndex);
        setTimeout(focusFirstHeading, 0);
        // Scroll to top on mobile for better UX
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }
        return;
      }
      
      // Special handling for back navigation
      if (currentStep?.key === 'recipeTitle') {
        // From recipe title, go back to upload method selection
        const uploadMethodIndex = journeySteps.findIndex(s => s.key === 'uploadMethod');
        setCurrentStepIndex(uploadMethodIndex);
      } else if (currentStep?.key === 'imageUpload') {
        // From image upload, go back to personal note
        const personalNoteIndex = journeySteps.findIndex(s => s.key === 'personalNote');
        setCurrentStepIndex(personalNoteIndex);
      } else if (currentStep?.key === 'personalNote') {
        // From personal note, ALWAYS go back to recipe title
        const recipeTitleIndex = journeySteps.findIndex(s => s.key === 'recipeTitle');
        setCurrentStepIndex(recipeTitleIndex);
      } else if (currentStep?.key === 'recipeForm') {
        // From recipe form, go back to personal note
        const personalNoteIndex = journeySteps.findIndex(s => s.key === 'personalNote');
        setCurrentStepIndex(personalNoteIndex);
      } else if (currentStep?.key === 'signature') {
        // From signature, go back to the last content step. Text and raw-paste both
        // come from recipeForm; image comes from imageUpload.
        const backKey = recipeData.uploadMethod === 'image' ? 'imageUpload' : 'recipeForm';
        setCurrentStepIndex(journeySteps.findIndex(s => s.key === backKey));
      } else if (currentStep?.key === 'summary') {
        // From summary, go back to the signature step (or recipe form when signatures are off).
        const backKey = signatureEnabled ? 'signature' : 'recipeForm';
        setCurrentStepIndex(journeySteps.findIndex(s => s.key === backKey));
      } else {
        // Normal navigation
        setCurrentStepIndex(currentStepIndex - 1);
      }
      
      setTimeout(focusFirstHeading, 0);
      
      // Scroll to top on mobile for better UX
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    } else {
      // Check if we're in preview mode
      const isPreviewMode = typeof window !== 'undefined' && sessionStorage.getItem('isPreviewMode') === 'true';
      
      if (isPreviewMode) {
        // In preview mode, go back to the preview search page
        window.history.back();
      } else {
        // Normal mode - go back to the name search landing for this token, preserving query parameters
        const queryString = cookbookId ? `?cookbook=${cookbookId}` : groupId ? `?group=${groupId}` : '';
        router.push(`/collect/${token}${queryString}`);
      }
    }
  };

  const handleFormFieldChange = (field: keyof RecipeData, value: string) => {
    isDirtyRef.current = true;
    setRecipeData(prev => ({ ...prev, [field]: value }));
  };

  const handleUploadMethodSelect = (method: 'text' | 'audio' | 'image') => {
    setRecipeData(prev => ({ ...prev, uploadMethod: method }));
    
    if (method === 'text') {
      // Go to recipe title step first (same as image flow)
      const recipeTitleIndex = journeySteps.findIndex(s => s.key === 'recipeTitle');
      setCurrentStepIndex(recipeTitleIndex);
    } else if (method === 'image') {
      // Go to recipe title step first
      const recipeTitleIndex = journeySteps.findIndex(s => s.key === 'recipeTitle');
      setCurrentStepIndex(recipeTitleIndex);
    }
    
    setTimeout(focusFirstHeading, 0);
    
    // Scroll to top on mobile for better UX
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleRecipeTypeSelect = (type: RecipeTypeOption | null) => {
    setSelectedRecipeType(type);
    // Auto-advance to next step after selection
    const uploadMethodIndex = journeySteps.findIndex(s => s.key === 'uploadMethod');
    setCurrentStepIndex(uploadMethodIndex);
    setTimeout(focusFirstHeading, 0);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    // Clear any previous errors when files are selected
    setSubmitError(null);
  };

  const stopProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Runs once the files are staged in Storage, before anything is persisted.
  // Advisory only: any failure returns 'proceed' so the submission is untouched.
  // Reason: pass the batch through untouched, PDFs included. Filtering them out
  // would break the single-PDF case, and judging a subset inverts the batch rule:
  // the real recipe may live in the file you dropped. Not warning is the cheap
  // error; warning a valid submission is the expensive one.
  const handleStagedFiles = async (publicUrls: string[]): Promise<'proceed' | 'cancel'> => {
    setCheckingPhoto(true);
    const result = await checkPhotoHasRecipe(publicUrls);
    setCheckingPhoto(false);

    // Reason: null means the check failed or timed out. Fail open: indistinguishable
    // from has_recipe true. The `reason` is logged server-side, in the proxy route.
    if (!result || result.has_recipe) return 'proceed';

    // Reason: the fake progress bar would keep ticking behind the modal.
    stopProgressInterval();
    setPhotoWarningOpen(true);

    return new Promise<'proceed' | 'cancel'>((resolve) => {
      photoDecisionRef.current = resolve;
    });
  };

  const settlePhotoWarning = (decision: 'proceed' | 'cancel') => {
    setPhotoWarningOpen(false);
    const resolve = photoDecisionRef.current;
    photoDecisionRef.current = null;
    resolve?.(decision);
  };

  const handlePickAnotherPhoto = () => {
    settlePhotoWarning('cancel');
    setSelectedFiles([]);
    // Reason: submission happens ON the upload step, so there is no navigation to
    // reset it. ImageUploadStep keeps its own file list in local state, so bumping
    // the key remounts it empty and keeps it in sync with the cleared parent state.
    setImageUploadKey(key => key + 1);
  };

  // Signatures ON only: run the photo check when leaving the upload step (right after
  // the guest picks their images), NOT at final submit. If the check says "no recipe",
  // the warning shows while they are still on the upload step, so "Pick another photo"
  // lands them exactly where they need to be. On proceed (or any check failure), advance
  // to the signature step. Advisory: never blocks. The signature-step submit skips the
  // check since it already ran here.
  const advanceFromImageUpload = async () => {
    if (selectedFiles.length > 0) {
      setCheckingPhoto(true);
      const result = await checkStagedPhotoForRecipe(selectedFiles);
      setCheckingPhoto(false);
      if (result && !result.has_recipe) {
        setPhotoWarningOpen(true);
        const decision = await new Promise<'proceed' | 'cancel'>((resolve) => {
          photoDecisionRef.current = resolve;
        });
        if (decision === 'cancel') return; // stay on the upload step
      }
    }
    setCurrentStepIndex(journeySteps.findIndex(s => s.key === 'signature'));
    setTimeout(focusFirstHeading, 0);
  };

  // This function is called when user clicks "Submit Recipe" from personal note step with images
  const handleSubmitWithImages = async () => {
    if (selectedFiles.length === 0) {
      setSubmitError('Please select at least one image');
      return;
    }
    
    setUploadingImages(true);
    setUploadProgress(20);
    
    try {
      // Prepare submission data with current form state including personal note
      const submission: CollectionGuestSubmission = {
        first_name: guestData.firstName,
        last_name: guestData.lastName,
        email: guestData.email,
        phone: guestData.phone,
        recipe_name: recipeData.recipeName.trim() || 'Recipe Images',
        ingredients: 'See uploaded images',
        instructions: `${selectedFiles.length} images uploaded`,
        comments: recipeData.personalNote.trim() || undefined, // Now includes personal note from the step
        raw_recipe_text: undefined,
        upload_method: 'image',
        document_urls: [], // Will be populated by the new function
        audio_url: undefined,
        printed_name: guestData.printedName || undefined,
        signature_data_url: signatureEnabled ? recipeData.signatureDataUrl : undefined
      };

      // Simulate progress during submission
      progressIntervalRef.current = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90));
      }, 300);


      // Use the new improved submission function with cookbook/group context.
      // Reason: with signatures ON the photo check already ran when leaving the upload
      // step, so don't re-run it here (pass no callback). With signatures OFF this IS
      // the upload-step submit, so run the check inline via handleStagedFiles.
      const { data, error, cancelled } = await submitGuestRecipeWithFiles(
        token,
        submission,
        selectedFiles,
        { cookbookId, groupId },
        signatureEnabled ? undefined : handleStagedFiles
      );

      stopProgressInterval();

      // Guest chose "Pick another photo": nothing was persisted, no error to show.
      if (cancelled) {
        setUploadingImages(false);
        setUploadProgress(0);
        return;
      }

      setUploadProgress(100);

      if (error) {
        setSubmitError(error);
        setUploadingImages(false);
        setUploadProgress(0);
        return;
      }

      if (!data) {
        setSubmitError('No data returned from submission');
        setUploadingImages(false);
        setUploadProgress(0);
        return;
      }

      
      // Store the successful submission data
      lastRecipeIdRef.current = data.recipe_id;
      lastGuestIdRef.current = data.guest_id;
      guestOptInRef.current = !!data.guest_notify_opt_in;
      guestOptInEmailRef.current = data.guest_notify_email || null;
      
      // Update recipe data with final URLs for display
      if (data.file_urls) {
        setRecipeData(prev => ({ ...prev, documentUrls: data.file_urls! }));
      }
      
      // Show success and navigate
      setSubmitSuccess(true);
      isDirtyRef.current = false;

      trackEvent('submit_recipe', { book_id: token, ...getAttribution(token) });

      // Small delay to show 100% completion
      setTimeout(() => {
        setUploadingImages(false);
        setUploadProgress(0);
        // Navigation to success will be handled by useEffect
      }, 500);
      
    } catch (err) {
      console.error('Error in new image upload flow:', err);
      stopProgressInterval();
      setCheckingPhoto(false);
      setSubmitError('Failed to submit recipe with images. Please try again.');
      setUploadingImages(false);
      setUploadProgress(0);
    }
  };

  const handlePasteRecipe = async (rawText: string) => {
    // When user pastes a recipe, store it and go to recipe title step
    isDirtyRef.current = true;
    
    // Store the raw text in recipe data
    setRecipeData(prev => ({
      ...prev,
      rawRecipeText: rawText,
      uploadMethod: 'text'  // Ensure it's marked as text method
    }));

    // Reason: the title was already set before recipeForm (where paste lives), and the
    // note was collected earlier too. With signatures on, go to the signature step before
    // submit; with signatures off, everything is already captured, so submit right away
    // (pass rawText since the state update above is async).
    if (signatureEnabled) {
      const signatureIndex = journeySteps.findIndex(s => s.key === 'signature');
      setCurrentStepIndex(signatureIndex);
    } else {
      await handleSubmitWithRawText(rawText);
    }
  };

  // Wrapper function for submitting raw text from button click
  const handleSubmitRawTextFromButton = async () => {
    await handleSubmitWithRawText();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    // Check if we're in preview mode
    const isPreviewMode = typeof window !== 'undefined' && sessionStorage.getItem('isPreviewMode') === 'true';
    
    if (isPreviewMode) {
      // In preview mode, just redirect back to landing page
      setSubmitting(true);
      setTimeout(() => {
        // Clean up preview session storage
        sessionStorage.removeItem('collectionGuestData');
        sessionStorage.removeItem('isPreviewMode');
        // Redirect to landing page
        window.location.href = '/';
      }, 500);
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare submission data
      const submission: CollectionGuestSubmission = {
        first_name: guestData.firstName,
        last_name: guestData.lastName,
        email: guestData.email,
        phone: guestData.phone,
        recipe_name: recipeData.recipeName.trim() || (recipeData.uploadMethod === 'image' ? 'Recipe Images' : 'Untitled Recipe'),
        ingredients: recipeData.rawRecipeText ? '' : recipeData.ingredients.trim(),
        instructions: recipeData.rawRecipeText ? '' : recipeData.instructions.trim(),
        comments: recipeData.personalNote.trim() || undefined,
        raw_recipe_text: recipeData.rawRecipeText,
        upload_method: recipeData.uploadMethod,
        document_urls: recipeData.documentUrls,
        audio_url: recipeData.audioUrl,
        printed_name: guestData.printedName || undefined,
        signature_data_url: signatureEnabled ? recipeData.signatureDataUrl : undefined
      };

      // Submit the recipe with cookbook/group context
      const { data, error } = await submitGuestRecipe(token, submission, { cookbookId, groupId });

      if (error) {
        setSubmitError(error);
        setSubmitting(false);
        return;
      }

      // Success! Show success state
      setSubmitSuccess(true);
      setSubmitting(false);
      isDirtyRef.current = false;
      lastRecipeIdRef.current = data?.recipe_id || null;
      lastGuestIdRef.current = data?.guest_id || null;
      guestOptInRef.current = !!data?.guest_notify_opt_in;
      guestOptInEmailRef.current = (data?.guest_notify_email as string | null) || null;

      trackEvent('submit_recipe', { book_id: token, ...getAttribution(token) });

      // Clean up localStorage
      localStorage.removeItem('recipeJourneyData');

    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSubmitWithRawText = async (rawText?: string) => {
    if (submitting) return;
    
    // Use passed rawText or get it from recipeData
    const textToSubmit = rawText || recipeData.rawRecipeText;
    if (!textToSubmit) {
      setSubmitError('No recipe text found');
      return;
    }
    
    // Check if we're in preview mode
    const isPreviewMode = typeof window !== 'undefined' && sessionStorage.getItem('isPreviewMode') === 'true';
    
    if (isPreviewMode) {
      // In preview mode, just redirect back to landing page
      setSubmitting(true);
      setTimeout(() => {
        // Clean up preview session storage
        sessionStorage.removeItem('collectionGuestData');
        sessionStorage.removeItem('isPreviewMode');
        // Redirect to landing page
        window.location.href = '/';
      }, 500);
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare submission data with raw text
      const submission: CollectionGuestSubmission = {
        first_name: guestData.firstName,
        last_name: guestData.lastName,
        email: guestData.email,
        phone: guestData.phone,
        recipe_name: recipeData.recipeName.trim() || 'Full Recipe Received', // Better default for raw mode
        ingredients: '', // Empty for raw mode
        instructions: '', // Empty for raw mode
        comments: recipeData.personalNote.trim() || undefined, // Now includes personal note
        raw_recipe_text: textToSubmit, // Use the raw text
        printed_name: guestData.printedName || undefined,
        signature_data_url: signatureEnabled ? recipeData.signatureDataUrl : undefined
      };

      // Submit the recipe with cookbook/group context
      const { data, error } = await submitGuestRecipe(token, submission, { cookbookId, groupId });

      if (error) {
        setSubmitError(error);
        setSubmitting(false);
        return;
      }

      // Success! Show success state
      setSubmitSuccess(true);
      setSubmitting(false);
      isDirtyRef.current = false;
      lastRecipeIdRef.current = data?.recipe_id || null;
      lastGuestIdRef.current = data?.guest_id || null;
      guestOptInRef.current = !!data?.guest_notify_opt_in;
      guestOptInEmailRef.current = (data?.guest_notify_email as string | null) || null;

      trackEvent('submit_recipe', { book_id: token, ...getAttribution(token) });

      // Clean up localStorage
      localStorage.removeItem('recipeJourneyData');

    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  // Auto-save to localStorage with lightweight feedback
  useEffect(() => {
    setAutosaveState('saving');
    localStorage.setItem('recipeJourneyData', JSON.stringify({
      currentStepIndex,
      recipeData
    }));
    const t = setTimeout(() => setAutosaveState('saved'), 250);
    return () => clearTimeout(t);
  }, [currentStepIndex, recipeData]);

  // Load from localStorage on mount + seed the guest's canonical signature.
  useEffect(() => {
    const saved = localStorage.getItem('recipeJourneyData');
    if (saved) {
      try {
        const { currentStepIndex: savedStep, recipeData: savedData } = JSON.parse(saved);
        if (typeof savedStep === 'number' && savedData) {
          setCurrentStepIndex(savedStep);
          // Reason: pre-fill the guest's canonical signature when the draft has none,
          // so an existing/returning guest sees their signature already there. Only when
          // signatures are enabled for this book (else the step is never shown/submitted).
          setRecipeData(
            (signatureEnabled && !savedData.signatureDataUrl && guestData.signatureUrl)
              ? { ...savedData, signatureDataUrl: guestData.signatureUrl }
              : savedData
          );
          return;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    // No saved draft: seed the guest's canonical signature if we have one (feature on).
    if (signatureEnabled && guestData.signatureUrl) {
      setRecipeData(prev => ({ ...prev, signatureDataUrl: guestData.signatureUrl }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Confirm before unload if dirty and not submitted
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current && !submitSuccess) {
        e.preventDefault();
        // Modern browsers show a generic message
        return '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [submitSuccess]);

  const onEditSection = (section: 'title' | 'ingredients' | 'instructions' | 'note' | 'signature') => {
    // Signature lives on its own step, not the recipe form
    if (section === 'signature') {
      const signatureIndex = journeySteps.findIndex(s => s.key === 'signature');
      setCurrentStepIndex(signatureIndex);
      return;
    }
    // Go to the recipe form step where all fields are editable
    const recipeFormIndex = journeySteps.findIndex(s => s.key === 'recipeForm');
    setCurrentStepIndex(recipeFormIndex);
    setTimeout(() => {
      const map: Record<typeof section, string> = {
        title: 'recipeName',
        ingredients: 'ingredients-input',
        instructions: 'instructions-input',
        note: 'note',
      };
      const el = document.getElementById(map[section]);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleAddAnother = () => {
    resetJourney();
    const idx = journeySteps.findIndex(s => s.key === 'uploadMethod');
    if (idx !== -1) setCurrentStepIndex(idx);
  };

  const handleDone = () => {
    router.push(`/`);
  };

  const canContinueFromForm = () => {
    if (recipeData.uploadMethod === 'image' && recipeData.documentUrls && recipeData.documentUrls.length > 0) {
      // For image uploads, just need a name (can be auto-generated)
      return true;
    }
    // For text uploads, need all fields filled
    return recipeData.recipeName.trim().length > 0 &&
           recipeData.ingredients.trim().length > 0 &&
           recipeData.instructions.trim().length > 0;
  };

  const current = journeySteps[currentStepIndex]?.key;

  // Reason: Show legal notice only on steps where actual submission happens.
  // Submission happens at 'summary' (text), at 'signature' for image/raw-paste flows
  // (which have no review step), and at 'imageUpload' when signatures are off (its
  // pre-signature terminal). Raw-paste with signatures off submits on paste (no screen).
  const isSubmitStep = current === 'summary' ||
    (current === 'signature' && (recipeData.uploadMethod === 'image' || !!recipeData.rawRecipeText)) ||
    (!signatureEnabled && current === 'imageUpload');

  const bottomNav = (
    <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      {current !== 'success' ? (
        <button
          type="button"
          onClick={handlePrevious}
          disabled={submitting}
          className="px-5 py-3 rounded-full border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
      ) : null}

      {current === 'success' ? (
        <>
          <button
            type="button"
            onClick={handleAddAnother}
            className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-full bg-brand-honey text-white hover:bg-brand-honey-dark text-sm sm:text-base"
          >
            <span className="sm:hidden">Got another?</span>
            <span className="hidden sm:inline">Got another recipe?</span>
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
          >
            <span className="sm:hidden">Done</span>
            <span className="hidden sm:inline">Done for now</span>
          </button>
        </>
      ) : currentStepIndex < totalSteps - 2 && current !== 'summary' ? (
        <button
          type="button"
          onClick={
            current === 'signature'
              ? (recipeData.uploadMethod === 'image'
                  ? handleSubmitWithImages
                  : recipeData.rawRecipeText
                    ? handleSubmitRawTextFromButton
                    : handleNext)
              : (!signatureEnabled && current === 'imageUpload')
                // Signatures off: image flow submits here instead of continuing to signature.
                ? handleSubmitWithImages
                : handleNext
          }
          disabled={
            (current === 'recipeForm' && !canContinueFromForm()) ||
            (current === 'recipeTitle' && !recipeData.recipeName.trim()) ||
            (current === 'imageUpload' && selectedFiles.length === 0) ||
            (current === 'imageUpload' && (uploadingImages || checkingPhoto)) ||
            (current === 'signature' && (submitting || uploadingImages)) ||
            submitting
          }
          className="px-8 py-3 rounded-full bg-brand-honey text-white hover:bg-brand-honey-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {current === 'signature'
            ? (recipeData.uploadMethod === 'image'
                ? (checkingPhoto
                    ? 'Checking your photo…'
                    : uploadingImages ? `Submitting... ${uploadProgress}%` : 'Submit Small Plate')
                : recipeData.rawRecipeText
                  ? (submitting ? 'Submitting...' : 'Submit Small Plate')
                  : (
                      <>
                        <span className="md:hidden">Continue</span>
                        <span className="hidden md:inline">Continue to Review</span>
                      </>
                    ))
            : current === 'imageUpload'
              ? (!signatureEnabled
                  ? (checkingPhoto
                      ? 'Checking your photo…'
                      : uploadingImages ? `Submitting... ${uploadProgress}%` : 'Submit Small Plate')
                  : (checkingPhoto ? 'Checking your photo…' : 'Continue'))
              : (current === 'recipeTitle' && recipeData.rawRecipeText)
                ? 'Continue'
                : (journeySteps[currentStepIndex]?.ctaLabel ?? 'Continue')
          }
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || submitSuccess}
          className="px-8 py-3 rounded-full bg-brand-honey text-white hover:bg-brand-honey-dark disabled:opacity-50 disabled:cursor-not-allowed"
          aria-busy={submitting}
        >
          {submitting ? 'Submitting…' : submitSuccess ? 'Submitted!' : 'Add my creation'}
        </button>
      )}
    </div>
    {isSubmitStep && (
      <p className="text-[11px] text-gray-400 text-center leading-relaxed">
        By submitting, you agree to our{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500">Terms</a>
        {' '}and{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500">Privacy Policy</a>.
      </p>
    )}
    </div>
  );

  // After submit, move to success screen
  useEffect(() => {
    if (submitSuccess) {
      const idx = journeySteps.findIndex(s => s.key === 'success');
      if (idx !== -1) setCurrentStepIndex(idx);
    }
  }, [submitSuccess]);

  const handleSavePrefs = async (_name?: string, email?: string, optedIn?: boolean) => {
    const recipeId = lastRecipeIdRef.current;
    const guestId = lastGuestIdRef.current;
    // Keep recipe-level update for completeness
    if (recipeId) {
      await updateGuestRecipeNotification(recipeId, {
        notify_opt_in: !!optedIn,
        notify_email: email || guestData.email || null,
      });
    }
    // Update guest-level preference so we don't ask again
    if (guestId) {
      await updateGuestNotification(guestId, {
        notify_opt_in: !!optedIn,
        notify_email: email || guestData.email || null,
      });
    }
  };

  return (
    <Frame title={submitError ? 'There was an error' : undefined} bottomNav={bottomNav} showHeaderLogo leftImageSrc={getImageUrl()}>
      <AnimatePresence mode="wait">
        {current === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <WelcomeStep creatorName={creatorName} />
          </motion.div>
        )}
        {current === 'recipeType' && (
          <motion.div
            key="recipeType"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <RecipeTypeStep 
              onSelectType={handleRecipeTypeSelect}
              selectedType={selectedRecipeType}
            />
          </motion.div>
        )}
        {current === 'introInfo' && (
          <motion.div
            key="introInfo"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <IntroInfoStep onContinue={handleNext} onBack={handlePrevious} />
          </motion.div>
        )}
        {current === 'realBook' && (
          <motion.div
            key="realBook"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="printed-book-heading">
              <div className="text-center px-4 md:px-6">
                <h2 id="printed-book-heading" className="font-serif text-3xl md:text-4xl font-semibold text-gray-900">
                  Your recipe will be printed in a real book —<br />
                  write it your way, make it yours.<br /> <span className="opacity-100">Have fun!</span>
                </h2>
              </div>
            </div>
          </motion.div>
        )}
        {current === 'uploadMethod' && (
          <motion.div
            key="uploadMethod"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <UploadMethodStep onSelectMethod={handleUploadMethodSelect} />
          </motion.div>
        )}
        {current === 'recipeForm' && (
          <motion.div
            key="recipeForm"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <RecipeFormStep data={recipeData} onChange={handleFormFieldChange} onContinue={handleNext} onBack={handlePrevious} onPasteRecipe={handlePasteRecipe} autosaveState={autosaveState} />
          </motion.div>
        )}
        {current === 'signature' && (
          <motion.div
            key="signature"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <SignatureStep
              initialSignature={recipeData.signatureDataUrl}
              onCapture={(dataUrl) => setRecipeData(prev => ({ ...prev, signatureDataUrl: dataUrl || undefined }))}
              onSkip={() => {
                setRecipeData(prev => ({ ...prev, signatureDataUrl: undefined }));
                handleNext();
              }}
            />
          </motion.div>
        )}
        {current === 'recipeTitle' && (
          <motion.div
            key="recipeTitle"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <RecipeTitleStep 
              recipeName={recipeData.recipeName}
              onChange={(value) => setRecipeData(prev => ({ ...prev, recipeName: value }))}
              recipeTypeHint={selectedRecipeType?.hint}
            />
          </motion.div>
        )}
        {current === 'imageUpload' && (
          <motion.div
            key="imageUpload"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <ImageUploadStep
              key={imageUploadKey}
              onImagesReady={() => {}}  // Not used anymore, submit happens from personal note
              onFilesSelected={handleFilesSelected}
            />
          </motion.div>
        )}
        {current === 'personalNote' && (
          <motion.div
            key="personalNote"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <PersonalNoteStep 
              personalNote={recipeData.personalNote}
              onChange={(value) => setRecipeData(prev => ({ ...prev, personalNote: value }))}
              userName={creatorName}
              coupleImageUrl={tokenInfo.couple_image_url}
              noteRecipient={noteRecipient}
            />
          </motion.div>
        )}
        {current === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <SummaryStep
              recipeName={recipeData.recipeName || (recipeData.uploadMethod === 'image' ? 'Recipe Images' : 'Untitled Recipe')}
              ingredients={recipeData.uploadMethod === 'image' ? 'Images uploaded' : recipeData.ingredients}
              instructions={recipeData.uploadMethod === 'image' ? `${recipeData.documentUrls?.length || 0} images uploaded` : recipeData.instructions}
              personalNote={recipeData.personalNote}
              guestName={guestData.printedName || `${guestData.firstName} ${guestData.lastName}`.trim()}
              signatureDataUrl={signatureEnabled ? recipeData.signatureDataUrl : undefined}
              onEditSection={onEditSection}
            />
          </motion.div>
        )}
        {current === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <SuccessStep
              defaultName={`${guestData.firstName} ${guestData.lastName}`.trim()}
              defaultEmail={guestData.email}
              hasGuestOptIn={guestOptInRef.current}
              guestOptInEmail={guestOptInEmailRef.current || undefined}
              onSavePrefs={handleSavePrefs}
              coupleImageUrl={tokenInfo.couple_image_url}
              recipeName={recipeData.recipeName || undefined}
              coupleNames={tokenInfo.couple_names}
            />
          </motion.div>
        )}
        {submitError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="mt-6 text-center text-red-600" role="alert" aria-live="assertive">{submitError}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <PhotoRecipeWarningModal
        isOpen={photoWarningOpen}
        onPickAnother={handlePickAnotherPhoto}
        onSubmitAnyway={() => settlePhotoWarning('proceed')}
      />
    </Frame>
  );
}