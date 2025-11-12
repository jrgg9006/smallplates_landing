'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface EmptyStateBannerProps {
  hasFirstRecipe: boolean;
  onUploadRecipe: () => void;
}

export function EmptyStateBanner({ hasFirstRecipe, onUploadRecipe }: EmptyStateBannerProps) {
  if (hasFirstRecipe) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-6"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-1">⭐</span>
          <div>
            <p className="font-medium text-gray-800">
              Upload your first recipe to receive a special preview
            </p>
            <p className="text-sm text-gray-600">
              We&apos;ll show you how it will look printed in your book
            </p>
          </div>
        </div>
        <Button
          onClick={onUploadRecipe}
          className="bg-black text-white hover:bg-gray-800 shrink-0"
          size="sm"
        >
          Upload my first recipe
        </Button>
      </div>
    </motion.div>
  );
}