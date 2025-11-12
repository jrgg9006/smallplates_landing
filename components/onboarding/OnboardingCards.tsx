'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
}

const CARD_CONFIGS: CardConfig[] = [
  {
    id: OnboardingSteps.FIRST_RECIPE,
    icon: '📝',
    title: 'Your First Recipe = Your First Magic',
    description: 'This cookbook is YOURS! Start with a recipe you love.',
    examples: ['Grandma\'s soup', 'Your favorite breakfast', 'That dessert you always make'],
    benefit: 'In 24 hours we\'ll show you how it will look printed in your book. It\'s magical!',
    cta: 'Upload my first recipe',
    ctaIcon: '✨',
    image: '/images/profile_onboarding/first_recipe.png'
  },
  {
    id: OnboardingSteps.FIRST_GUEST,
    icon: '👥',
    title: 'Add Someone Special',
    description: 'Add an important person in your life.',
    reassurance: 'Just add their name - you won\'t send anything yet',
    cta: '+ Add my first guest',
    image: '/images/profile_onboarding/add_guest.png' // You'll need to add this image
  },
  {
    id: OnboardingSteps.CUSTOMIZE_COLLECTOR,
    icon: '🔗',
    title: 'Personalize Your Recipe Collector',
    description: 'This is your main tool to gather recipes. Make it your style.',
    cta: 'Personalize my link',
    image: '/images/profile_onboarding/customize_link.png' // You'll need to add this image
  }
];

interface OnboardingCardsProps {
  completedSteps: OnboardingSteps[];
  onAction: (stepId: OnboardingSteps) => void;
  onExit?: () => void;
}

export function OnboardingCards({ completedSteps, onAction, onExit }: OnboardingCardsProps) {
  return (
    <div className="py-8">
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
          Exit tutorial
        </button>
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
  isCompleted, 
  onAction 
}: OnboardingCardProps) {
  // Use the reusable ImageActionCard for image-based cards
  if (image) {
    // Determine text based on which card this is
    let cardTitle = '';
    let cardDescription = '';
    
    if (stepNumber === 1) {
      cardTitle = "YOUR FIRST RECIPE";
      cardDescription = "This cookbook is yours. Start with a recipe you love.\nIn 24 hours we'll show you how it will look printed in your book. It's magical!";
    } else if (stepNumber === 2) {
      cardTitle = "ADD SOMEONE SPECIAL";
      cardDescription = "Add an important person in your life.\nJust add their name - you won't send anything yet.";
    } else if (stepNumber === 3) {
      cardTitle = "PERSONALIZE YOUR LINK";
      cardDescription = "This is your main tool to gather recipes.\nMake it your style and share it with friends.";
    }
    
    return (
      <ImageActionCard
        imageSrc={image}
        buttonText={cta}
        buttonIcon={ctaIcon}
        onButtonClick={onAction}
        stepNumber={stepNumber}
        title={cardTitle}
        description={cardDescription}
        isCompleted={isCompleted}
        gradientOpacity={40}
      />
    );
  }

  // Default layout for other cards
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`
        relative bg-white rounded-xl p-6 transition-all duration-300
        ${isCompleted 
          ? 'border-2 border-green-200 bg-green-50/50' 
          : 'border border-gray-200 hover:border-gray-300 hover:shadow-lg'
        }
      `}
    >
      {/* Step indicator */}
      <div className="absolute -top-3 left-6 bg-white px-2">
        <span className="text-xs font-medium text-gray-500">
          {isCompleted ? '✅' : `STEP ${stepNumber}`}
        </span>
      </div>
      
      {/* Content */}
      <div className="text-center">
        {/* Large expressive icon */}
        <div className="text-4xl mb-4">{icon}</div>
        
        {/* Weighted title */}
        <h4 className="font-medium text-lg mb-3">{title}</h4>
        
        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {description}
        </p>
        
        {/* Examples if they exist */}
        {examples && (
          <ul className="text-xs text-gray-500 mb-4 space-y-1">
            {examples.map((ex, i) => (
              <li key={i}>• {ex}</li>
            ))}
          </ul>
        )}
        
        {/* Highlighted benefit */}
        {benefit && (
          <p className="text-sm text-indigo-600 mb-4 font-medium">
            {benefit}
          </p>
        )}
        
        {/* Reassurance if exists */}
        {reassurance && (
          <p className="text-xs text-gray-500 mb-4 italic">
            {reassurance}
          </p>
        )}
        
        {/* CTA Button */}
        <Button
          onClick={onAction}
          disabled={isCompleted}
          className={`
            w-full py-3 font-medium transition-all
            ${isCompleted 
              ? 'bg-green-100 text-green-700 cursor-default' 
              : 'bg-black text-white hover:bg-gray-800'
            }
          `}
        >
          {isCompleted ? 'Completed ✓' : (
            <span className="flex items-center justify-center gap-2">
              {cta} {ctaIcon}
            </span>
          )}
        </Button>
      </div>
    </motion.div>
  );
}