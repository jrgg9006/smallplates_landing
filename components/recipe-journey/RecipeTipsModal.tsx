"use client";

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, Coffee, Heart, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface RecipeTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TipCategory = 'main' | 'easy' | 'borrowed' | 'fun';

export default function RecipeTipsModal({ isOpen, onClose }: RecipeTipsModalProps) {
  const [activeCategory, setActiveCategory] = useState<TipCategory>('main');
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset to main view when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveCategory('main');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tips-modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className={`
        relative bg-white shadow-xl overflow-hidden animate-in fade-in duration-300
        ${isMobile 
          ? 'fixed bottom-0 left-0 right-0 rounded-t-2xl max-h-[90vh] animate-slide-in-bottom' 
          : 'rounded-2xl max-w-md w-full mx-4 max-h-[85vh] zoom-in-95'
        }
      `}>
        {/* Mobile visual handle */}
        {isMobile && (
          <div className="flex justify-center pt-4 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-gray-300" />
          </div>
        )}

        {/* Header */}
        <div className={`flex items-center justify-between ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
          {activeCategory !== 'main' ? (
            <button 
              onClick={() => setActiveCategory('main')}
              className="flex items-center text-[#9A9590] hover:text-[#2D2D2D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4A854] focus:ring-offset-2 rounded-md p-1 -ml-1"
              aria-label="Back to categories"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              <span className="sr-only sm:not-sr-only">Back</span>
            </button>
          ) : (
            <h2 className="font-medium text-base text-[#2D2D2D]">
              Tips
            </h2>
          )}
          <button 
            onClick={onClose}
            className="text-[#9A9590] hover:text-[#2D2D2D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4A854] focus:ring-offset-2 rounded-md p-1 -mr-1"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Content */}
        <div className={`overflow-y-auto ${isMobile ? 'px-4 pb-6 max-h-[calc(90vh-100px)]' : 'px-6 pb-8 max-h-[calc(85vh-60px)]'}`}>
          {activeCategory === 'main' && <MainView onSelectCategory={setActiveCategory} />}
          {activeCategory === 'easy' && <EasyStuffView />}
          {activeCategory === 'borrowed' && <BorrowedRecipesView />}
          {activeCategory === 'fun' && <FunStuffView />}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function MainView({ onSelectCategory }: { onSelectCategory: (cat: TipCategory) => void }) {
  return (
    <div className="space-y-5">
      {/* Hero Image */}
      <div className="w-full h-36 relative rounded-lg overflow-hidden">
        <Image
          src="/images/profile/Hero_Profile_2400.jpg"
          alt="Cooking together"
          fill
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
          priority
        />
      </div>

      {/* Title and Subheader */}
      <div className="text-center space-y-2">
        <h2 id="tips-modal-title" className="font-serif text-2xl font-medium text-[#2D2D2D]">
          What should I put?
        </h2>
        <p className="text-[#9A9590] text-sm">
          Short answer: anything.<br />
          Long answer: here&apos;s what that actually means.
        </p>
      </div>

      {/* Category Cards */}
      <div className="space-y-3">
        <CategoryCard
          title="The easy stuff"
          icon={<Coffee className="w-5 h-5" />}
          onClick={() => onSelectCategory('easy')}
        />
        <CategoryCard
          title="Borrowed recipes"
          icon={<Heart className="w-5 h-5" />}
          onClick={() => onSelectCategory('borrowed')}
        />
        <CategoryCard
          title="The fun stuff"
          icon={<Sparkles className="w-5 h-5" />}
          onClick={() => onSelectCategory('fun')}
        />
      </div>
    </div>
  );
}

function CategoryCard({ title, description, icon, onClick }: { 
  title: string; 
  description?: string;
  icon?: React.ReactNode; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 min-h-[56px] bg-[#FAF7F2] hover:bg-[#E8E0D5] active:bg-[#E8E0D5] rounded-xl transition-colors group focus:outline-none focus:ring-2 focus:ring-[#D4A854] focus:ring-offset-2 touch-manipulation flex items-center gap-3"
      role="button"
      tabIndex={0}
    >
      {icon && (
        <span className="text-[#D4A854] flex-shrink-0 opacity-70">
          {icon}
        </span>
      )}
      <h3 className="font-normal text-[#2D2D2D] text-center flex-1">
        {title}
      </h3>
      {description && (
        <p className="text-[#9A9590] text-sm mt-1">
          {description}
        </p>
      )}
    </button>
  );
}

function TipItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="pb-4 border-b border-[#E8E0D5] last:border-0">
      <p className="font-medium text-[#2D2D2D]">{title}</p>
      <p className="text-[#9A9590] text-sm mt-1">{description}</p>
    </div>
  );
}

function EasyStuffView() {
  const tips = [
    {
      title: "Your order at the taco place.",
      description: "The one you get every time. That counts."
    },
    {
      title: "The thing you make when you're tired.",
      description: "Scrambled eggs at 11pm. Pasta with whatever's in the fridge. That's real cooking."
    },
    {
      title: "The snack combo that shouldn't work.",
      description: "Peanut butter and pickles. Cheese and honey. We don't judge."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Image */}
      <div className="w-full h-36 relative rounded-lg overflow-hidden bg-white">
        <Image
          src="/images/tips/images_rectangles_1.png"
          alt="Dessert plates"
          fill
          className="object-contain"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      </div>

      <div>
        <h2 className="font-serif text-2xl font-medium text-[#2D2D2D]">
          The easy stuff
        </h2>
        <p className="text-[#9A9590] mt-2">
          You don&apos;t need a signature dish. You just need something real.
        </p>
      </div>

      <div className="space-y-4 mt-6">
        {tips.map((tip, index) => (
          <TipItem key={index} title={tip.title} description={tip.description} />
        ))}
      </div>
    </div>
  );
}

function BorrowedRecipesView() {
  const tips = [
    {
      title: "Your mom's thing.",
      description: "You know which one. Even without exact measurements—\"a handful of this, a splash of that\"—is perfect."
    },
    {
      title: "Something you watched someone make.",
      description: "Your roommate's Sunday pancakes. Your grandma's sauce. Give them credit."
    },
    {
      title: "A restaurant dish you'd die for.",
      description: "Write what you think is in it. They'll figure it out."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Image */}
      <div className="w-full h-36 relative rounded-lg overflow-hidden bg-white">
        <Image
          src="/images/tips/images_rectangles_1.png"
          alt="Shared dishes"
          fill
          className="object-contain"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      </div>

      <div>
        <h2 className="font-serif text-2xl font-medium text-[#2D2D2D]">
          Borrowed recipes
        </h2>
        <p className="text-[#9A9590] mt-2">
          Some of the best recipes aren&apos;t yours. They&apos;re your mom&apos;s. Or your roommate&apos;s. Or that restaurant you can&apos;t stop thinking about.
        </p>
      </div>

      <div className="space-y-4 mt-6">
        {tips.map((tip, index) => (
          <TipItem key={index} title={tip.title} description={tip.description} />
        ))}
      </div>
    </div>
  );
}

function FunStuffView() {
  const tips = [
    {
      title: "Your hangover cure.",
      description: "Every kitchen needs one. Yours might save their marriage."
    },
    {
      title: "A drink that matches your vibe.",
      description: "The cocktail that says \"you.\" Or the mocktail. Or the very specific way you drink your tea."
    },
    {
      title: "An inside joke, in recipe form.",
      description: "They'll know what it means."
    },
    {
      title: "The thing you bring to every party.",
      description: "That dip. That thing. You know the one."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Image */}
      <div className="w-full h-36 relative rounded-lg overflow-hidden bg-white">
        <Image
          src="/images/tips/images_rectangles_1.png"
          alt="Fun dishes"
          fill
          className="object-contain"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      </div>

      <div>
        <h2 className="font-serif text-2xl font-medium text-[#2D2D2D]">
          The fun stuff
        </h2>
        <p className="text-[#9A9590] mt-2">
          For when you want your page to be the one they laugh about. Or toast to.
        </p>
      </div>

      <div className="space-y-4 mt-6">
        {tips.map((tip, index) => (
          <TipItem key={index} title={tip.title} description={tip.description} />
        ))}
      </div>
    </div>
  );
}