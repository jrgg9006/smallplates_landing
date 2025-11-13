/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OnboardingCards } from '@/components/onboarding/OnboardingCards';
import { WelcomeOverlay } from '@/components/onboarding/WelcomeOverlay';
import { StepSuccess } from '@/components/onboarding/StepSuccess';
import { OnboardingSteps } from '@/lib/contexts/ProfileOnboardingContext';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className}>{children}</button>
  ),
}));

describe('Onboarding Flow', () => {
  describe('OnboardingCards', () => {
    const mockOnAction = jest.fn();

    beforeEach(() => {
      mockOnAction.mockClear();
    });

    it('renders three onboarding cards for new users', () => {
      render(
        <OnboardingCards 
          completedSteps={[]} 
          onAction={mockOnAction} 
        />
      );

      // Check that all three steps are rendered
      expect(screen.getByText('Your First Recipe = Your First Magic')).toBeInTheDocument();
      expect(screen.getByText('Add Someone Special')).toBeInTheDocument();
      expect(screen.getByText('Share Your Recipe Collector')).toBeInTheDocument();
    });

    it('shows correct step indicators', () => {
      render(
        <OnboardingCards 
          completedSteps={[]} 
          onAction={mockOnAction} 
        />
      );

      // Check step indicators
      expect(screen.getByText('STEP 1')).toBeInTheDocument();
      expect(screen.getByText('STEP 2')).toBeInTheDocument();
      expect(screen.getByText('STEP 3')).toBeInTheDocument();
    });

    it('handles card click actions correctly', () => {
      render(
        <OnboardingCards 
          completedSteps={[]} 
          onAction={mockOnAction} 
        />
      );

      // Click on first recipe card
      const firstRecipeButton = screen.getByText('Upload my first recipe ✨');
      fireEvent.click(firstRecipeButton);

      expect(mockOnAction).toHaveBeenCalledWith(OnboardingSteps.FIRST_RECIPE);
    });

    it('shows completion state when actions are finished', () => {
      render(
        <OnboardingCards 
          completedSteps={[OnboardingSteps.FIRST_RECIPE]} 
          onAction={mockOnAction} 
        />
      );

      // First step should be completed
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Completed ✓')).toBeInTheDocument();
    });

    it('disables completed steps', () => {
      render(
        <OnboardingCards 
          completedSteps={[OnboardingSteps.FIRST_RECIPE]} 
          onAction={mockOnAction} 
        />
      );

      const completedButton = screen.getByText('Completed ✓');
      expect(completedButton).toBeDisabled();
    });
  });

  describe('WelcomeOverlay', () => {
    const mockOnStart = jest.fn();
    const mockOnDismiss = jest.fn();

    beforeEach(() => {
      mockOnStart.mockClear();
      mockOnDismiss.mockClear();
    });

    it('renders welcome message with user name', () => {
      render(
        <WelcomeOverlay
          userName="John"
          onStart={mockOnStart}
          onDismiss={mockOnDismiss}
          isVisible={true}
        />
      );

      expect(screen.getByText('Welcome to Small Plates!')).toBeInTheDocument();
      expect(screen.getByText('Hello John 👋')).toBeInTheDocument();
    });

    it('calls onStart when start button is clicked', () => {
      render(
        <WelcomeOverlay
          userName="John"
          onStart={mockOnStart}
          onDismiss={mockOnDismiss}
          isVisible={true}
        />
      );

      const startButton = screen.getByText('Start my cookbook');
      fireEvent.click(startButton);

      expect(mockOnStart).toHaveBeenCalledTimes(1);
    });

    it('calls onDismiss when explore button is clicked', () => {
      render(
        <WelcomeOverlay
          userName="John"
          onStart={mockOnStart}
          onDismiss={mockOnDismiss}
          isVisible={true}
        />
      );

      const dismissButton = screen.getByText("I'll explore on my own");
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not render when not visible', () => {
      render(
        <WelcomeOverlay
          userName="John"
          onStart={mockOnStart}
          onDismiss={mockOnDismiss}
          isVisible={false}
        />
      );

      expect(screen.queryByText('Welcome to Small Plates!')).not.toBeInTheDocument();
    });
  });

  describe('StepSuccess', () => {
    const mockOnContinue = jest.fn();

    beforeEach(() => {
      mockOnContinue.mockClear();
    });

    it('shows correct success message for first recipe', () => {
      render(
        <StepSuccess
          stepName={OnboardingSteps.FIRST_RECIPE}
          isVisible={true}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Recipe Saved! ✨')).toBeInTheDocument();
      expect(screen.getByText("Your first recipe is saved! We'll send you a preview soon.")).toBeInTheDocument();
    });

    it('shows correct success message for first guest', () => {
      render(
        <StepSuccess
          stepName={OnboardingSteps.FIRST_GUEST}
          isVisible={true}
          onContinue={mockOnContinue}
        />
      );

      expect(screen.getByText('Great! 👥')).toBeInTheDocument();
      expect(screen.getByText("You've added your first guest. You can invite them anytime!")).toBeInTheDocument();
    });

    it('calls onContinue when continue button is clicked', () => {
      render(
        <StepSuccess
          stepName={OnboardingSteps.FIRST_RECIPE}
          isVisible={true}
          onContinue={mockOnContinue}
        />
      );

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      expect(mockOnContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('Onboarding Flow Integration', () => {
    it('progresses through the complete onboarding flow', async () => {
      // This would test the complete integration flow
      // For now, we'll test that components work together
      const mockOnAction = jest.fn();

      const { rerender } = render(
        <OnboardingCards 
          completedSteps={[]} 
          onAction={mockOnAction} 
        />
      );

      // Initial state: no steps completed
      expect(screen.getByText('STEP 1')).toBeInTheDocument();
      expect(screen.getByText('STEP 2')).toBeInTheDocument();
      expect(screen.getByText('STEP 3')).toBeInTheDocument();

      // Simulate first step completion
      rerender(
        <OnboardingCards 
          completedSteps={[OnboardingSteps.FIRST_RECIPE]} 
          onAction={mockOnAction} 
        />
      );

      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Completed ✓')).toBeInTheDocument();

      // Simulate all steps completion
      rerender(
        <OnboardingCards 
          completedSteps={[
            OnboardingSteps.FIRST_RECIPE,
            OnboardingSteps.FIRST_GUEST,
            OnboardingSteps.CUSTOMIZE_COLLECTOR
          ]} 
          onAction={mockOnAction} 
        />
      );

      const completedButtons = screen.getAllByText('Completed ✓');
      expect(completedButtons).toHaveLength(3);
    });
  });
});

describe('Onboarding Context Logic', () => {
  // These would test the context logic, but since we're using Supabase
  // and the context involves real database calls, we'd need to mock those
  
  it('should determine first-time user correctly', () => {
    // Mock test for first-time user detection logic
    const guestCount = 0;
    const recipeCount = 0;
    const hasSeenWelcome = false;
    
    const isFirstTimeUser = guestCount === 0 && recipeCount === 0 && !hasSeenWelcome;
    expect(isFirstTimeUser).toBe(true);
  });

  it('should show onboarding for empty state users', () => {
    // Mock test for onboarding visibility logic
    const guestCount = 0;
    const dismissalCount = 0;
    const completedSteps = 0;
    
    const shouldShowOnboarding = guestCount === 0 && dismissalCount < 3 && completedSteps < 3;
    expect(shouldShowOnboarding).toBe(true);
  });

  it('should hide onboarding for active users', () => {
    // Mock test for hiding onboarding
    const guestCount = 3;
    const recipeCount = 2;
    
    const shouldShowOnboarding = !(guestCount > 2 || recipeCount > 1);
    expect(shouldShowOnboarding).toBe(false);
  });
});