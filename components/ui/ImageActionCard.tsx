'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ImageActionCardProps {
  // Required props
  buttonText: string;
  onButtonClick: () => void;
  
  // Optional props for customization
  imageSrc?: string;
  backgroundColor?: string; // For cards without images (e.g., "bg-gray-100")
  backgroundGradient?: string; // For custom gradients (e.g., "from-gray-200 to-gray-100")
  stepNumber?: number;
  title?: string;
  description?: string;
  buttonIcon?: string;
  isCompleted?: boolean;
  gradientOpacity?: number; // 0-100 (only used when imageSrc is provided)
  textColor?: string; // Text color when no image (default: "text-gray-800")
  className?: string;
  disableHoverEffect?: boolean;
}

export function ImageActionCard({
  imageSrc,
  backgroundColor,
  backgroundGradient,
  buttonText,
  onButtonClick,
  stepNumber,
  title,
  description,
  buttonIcon,
  isCompleted = false,
  gradientOpacity = 40,
  textColor = 'text-gray-800',
  className = '',
  disableHoverEffect = false,
}: ImageActionCardProps) {
  const CardWrapper = disableHoverEffect ? 'div' : motion.div;
  const hoverProps = disableHoverEffect ? {} : { whileHover: { y: -4 } };

  // Determine background style - gradient from bottom to top
  const bgStyle = imageSrc 
    ? '' 
    : backgroundGradient 
      ? `bg-gradient-to-t ${backgroundGradient}`
      : backgroundColor || 'bg-gray-100';

  // Text color - white for image cards OR cards with gradient, custom for solid color cards
  const finalTextColor = (imageSrc || backgroundGradient) ? 'text-white' : textColor;

  return (
    <CardWrapper
      {...hoverProps}
      className={`
        relative bg-white rounded-xl overflow-hidden transition-all duration-300
        ${isCompleted 
          ? 'border-2 border-green-200 bg-green-50/50' 
          : 'border border-gray-200 hover:border-gray-300 hover:shadow-lg'
        }
        ${className}
      `}
    >
      {/* Image or color background with text and button overlay */}
      <div className="relative">
        <div className={`relative aspect-square w-full ${bgStyle}`}>
          {imageSrc && (
            <>
              <Image
                src={imageSrc}
                alt={title || 'Card image'}
                fill
                className="object-cover"
                priority
              />
              
              {/* Gradient overlay for images */}
              <div 
                className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent" 
                style={{ background: `linear-gradient(to top, rgba(0,0,0,${gradientOpacity/100}) 0%, transparent 50%, transparent 100%)` }}
              />
            </>
          )}
          
          {/* Add dark gradient overlay for cards with backgroundGradient (no image) */}
          {!imageSrc && backgroundGradient && (
            <div 
              className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent" 
              style={{ background: `linear-gradient(to top, rgba(0,0,0,${gradientOpacity/100}) 0%, transparent 50%, transparent 100%)` }}
            />
          )}
          
          {/* Text and button overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            {/* Text above button - only show if provided */}
            {(stepNumber || title || description) && (
              <div className={`${finalTextColor} mb-4`}>
                {stepNumber && (
                  <p className={`text-sm font-medium mb-1 ${imageSrc ? 'opacity-90' : 'opacity-70'}`}>
                    STEP {stepNumber}
                  </p>
                )}
                {title && (
                  <h3 className="text-2xl font-bold mb-2">{title}</h3>
                )}
                {description && (
                  <p className="text-sm leading-relaxed">{description}</p>
                )}
              </div>
            )}
            
            {/* Button */}
            <Button
              onClick={onButtonClick}
              disabled={isCompleted}
              className={`
                w-full py-3 font-medium transition-all shadow-lg
                ${isCompleted 
                  ? 'bg-green-100 text-green-700 cursor-default' 
                  : 'bg-white text-black hover:bg-gray-100'
                }
              `}
            >
              {isCompleted ? 'Completed ✓' : (
                <span className="flex items-center justify-center gap-2">
                  {buttonText} {buttonIcon}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
}