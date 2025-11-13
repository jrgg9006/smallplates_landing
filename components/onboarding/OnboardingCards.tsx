'use client';

import React from 'react';
import Image from 'next/image';
import { ImageActionCard } from '@/components/ui/ImageActionCard';
import { OnboardingSteps } from '@/lib/contexts/ProfileOnboardingContext';

interface CardConfig {
  id: OnboardingSteps;
  icon: string;
  title: string;
  description: string;
  examples?: string[];
  benefit?: string;
  reassurance?: string;
  cta: string;
  ctaIcon?: string;
  image?: string;
  backgroundGradient?: string;
}

const CARD_CONFIGS: CardConfig[] = [
  {
    id: OnboardingSteps.FIRST_RECIPE,
    icon: '📝',
    title: 'YOUR FIRST RECIPE',
    description: 'This cookbook is yours. Start with a recipe you love. In 24 hours we\'ll show you how it will look printed in your book.',
    examples: ['Grandma\'s soup', 'Your favorite breakfast', 'That dessert you always make'],
    benefit: 'In 24 hours we\'ll show you how it will look printed in your book. It\'s magical!',
    cta: 'Upload my first recipe',
    ctaIcon: '✨',
    image: '/images/profile_onboarding/first_recipe.png'
  },
  {
    id: OnboardingSteps.FIRST_GUEST,
    icon: '👥',
    title: 'ADD SOMEONE SPECIAL',
    description: 'Add an important person in your life. Just add their name - you won\'t send anything yet.',
    reassurance: 'Just add their name - you won\'t send anything yet',
    cta: '+ Add my first guest',
    image: '/images/profile_onboarding/first_guest.png'
  },
  {
    id: OnboardingSteps.CUSTOMIZE_COLLECTOR,
    icon: '🔗',
    title: 'PERSONALIZE YOUR LINK',
    description: 'This is your main tool to gather recipes. Make it your style and share it with friends.',
    cta: 'Personalize my link',
    image: '/images/profile_onboarding/first_recipe_collector.png'
  }
];

interface OnboardingCardsProps {
  completedSteps: OnboardingSteps[];
  onAction: (stepId: OnboardingSteps) => void;
  onExit?: () => void;
}

export function OnboardingCards({ completedSteps, onAction, onExit }: OnboardingCardsProps) {
  return (
    <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full py-8 px-4 flex items-center justify-center">
        <div className="max-w-6xl mx-auto w-full">
          {/* Logo */}
          <div className="mb-4 text-center">
            <Image 
              src="/images/SmallPlates_logo_horizontal.png" 
              alt="Small Plates"
              width={120} 
              height={24} 
              className="mx-auto opacity-80" 
            />
          </div>
          
          {/* Main title */}
          <div className="text-center mb-3">
            <h1 className="font-light text-4xl md:text-5xl tracking-tight">
              Onboarding
            </h1>
          </div>
          
          {/* Elegant header */}
          <div className="text-center mb-8">
            <h3 className="text-lg font-light text-gray-600">
              Let&apos;s start with these 3 simple steps:
            </h3>
          </div>
          
          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CARD_CONFIGS.map((card, index) => (
              <OnboardingCard
                key={card.id}
                {...card}
                stepNumber={index + 1}
                isCompleted={completedSteps.includes(card.id)}
                onAction={() => onAction(card.id)}
              />
            ))}
          </div>
          
          {/* Subtle exit option */}
          <div className="text-center mt-8">
            <button 
              onClick={onExit}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors border-b border-transparent hover:border-gray-400"
            >
              Exit onboarding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface OnboardingCardProps extends CardConfig {
  stepNumber: number;
  isCompleted: boolean;
  onAction: () => void;
}

function OnboardingCard({ 
  stepNumber, 
  icon, 
  title, 
  description, 
  examples, 
  benefit,
  reassurance,
  cta, 
  ctaIcon,
  image,
  backgroundGradient,
  isCompleted, 
  onAction 
}: OnboardingCardProps) {
  // Use the reusable ImageActionCard for all cards
  return (
    <ImageActionCard
      imageSrc={image}
      backgroundGradient={backgroundGradient}
      buttonText={cta}
      buttonIcon={ctaIcon}
      onButtonClick={onAction}
      stepNumber={stepNumber}
      title={title}
      description={description}
      isCompleted={isCompleted}
      gradientOpacity={40}
      textColor="text-gray-800"
    />
  );
}