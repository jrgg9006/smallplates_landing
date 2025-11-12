'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { OnboardingSteps } from '@/lib/contexts/ProfileOnboardingContext';
import { successPulse, modalBackdrop, modalContent } from '@/lib/animations';

interface StepSuccessProps {
  stepName: OnboardingSteps;
  isVisible: boolean;
  onContinue: () => void;
}

const getSuccessMessage = (stepName: OnboardingSteps) => {
  const messages = {
    [OnboardingSteps.FIRST_RECIPE]: {
      title: 'Recipe Saved! ✨',
      message: 'Your first recipe is saved! We\'ll send you a preview soon.',
      emoji: '📝'
    },
    [OnboardingSteps.FIRST_GUEST]: {
      title: 'Great! 👥',
      message: 'You\'ve added your first guest. You can invite them anytime!',
      emoji: '👥'
    },
    [OnboardingSteps.CUSTOMIZE_COLLECTOR]: {
      title: 'Perfect! 🔗',
      message: 'Your Recipe Collector is ready to share with friends and family.',
      emoji: '🔗'
    }
  };
  
  return messages[stepName] || {
    title: 'Success!',
    message: 'Step completed successfully!',
    emoji: '🎉'
  };
};

export function StepSuccess({ stepName, isVisible, onContinue }: StepSuccessProps) {
  const { title, message, emoji } = getSuccessMessage(stepName);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          {...modalBackdrop}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
        >
          <motion.div
            {...modalContent}
            className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4"
          >
            <motion.div
              {...successPulse}
              className="text-6xl text-center mb-4"
            >
              {emoji}
            </motion.div>
            
            <h3 className="text-2xl font-light text-center mb-2 text-gray-900">
              {title}
            </h3>
            
            <p className="text-gray-600 text-center mb-6 leading-relaxed">
              {message}
            </p>
            
            <Button
              onClick={onContinue}
              className="w-full bg-black text-white hover:bg-gray-800 py-3"
            >
              Continue
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}