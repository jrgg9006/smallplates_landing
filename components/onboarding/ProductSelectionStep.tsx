"use client";

import React from "react";
import { productTiers, ProductTier } from "@/lib/data/productTiers";

interface ProductSelectionStepProps {
  selectedTierId: string | null;
  onSelect: (tierId: string) => void;
}

/**
 * Product Selection Step Component
 * Editorial, compact design - Kinfolk style
 */
export function ProductSelectionStep({
  selectedTierId,
  onSelect,
}: ProductSelectionStepProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Question */}
      <div className="text-center mb-6">
        <h2 className="text-base font-medium text-[#2D2D2D] mb-1">
          Which one works?
        </h2>
      </div>

      {/* Product Cards - Compact Horizontal Stacked */}
      <div className="space-y-3 mb-8">
        {productTiers.map((tier) => (
          <ProductTierCard
            key={tier.id}
            tier={tier}
            isSelected={selectedTierId === tier.id}
            onSelect={() => onSelect(tier.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ProductTierCardProps {
  tier: ProductTier;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Individual Product Tier Card - Compact Editorial Style
 */
function ProductTierCard({ tier, isSelected, onSelect }: ProductTierCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        relative w-full text-left rounded-lg border transition-all duration-200
        hover:shadow-sm p-4
        flex items-center justify-between gap-4
        ${
          isSelected
            ? tier.popular
              ? "border-[#D4A854] bg-[#FBF6EC]/20"
              : "border-[#D4A854] bg-[#E8E0D5]/30"
            : "border-gray-200 bg-white hover:border-gray-300"
        }
      `}
    >
      {/* Left Section - Radio + Content */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Radio Button - Smaller */}
        <div className="flex-shrink-0">
          <div
            className={`w-4 h-4 rounded-full border transition-all duration-200 flex items-center justify-center ${
              isSelected
                ? "border-[#D4A854] bg-[#D4A854]"
                : "border-gray-300"
            }`}
          >
            {isSelected && (
              <svg
                className="w-2.5 h-2.5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with Name and Popular Badge */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-serif text-lg font-medium text-[#2D2D2D]">
              {tier.name}
            </h3>
            {tier.popular && (
              <span className="inline-block bg-[#FBF6EC] text-[#D4A854] text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full">
                Most popular
              </span>
            )}
          </div>

          {/* Tagline - Emotional hook, right under the name */}
          <p className="italic text-xs text-[#9A9590] mt-0.5 mb-2.5">
            {tier.tagline}
          </p>

          {/* Features - Quiet, secondary */}
          <p className="text-[12px] text-[#9A9590]/80 leading-relaxed">
            {tier.features.join(" • ")}
          </p>
        </div>
      </div>

      {/* Right Section - Price - Compact */}
      <div className="flex-shrink-0">
        <div className="font-serif text-xl text-[#2D2D2D]">
          ${tier.price}
        </div>
      </div>
    </button>
  );
}
