"use client";

import React from "react";
import { BookOpen, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface BulkActionsBarProps {
  selectedCount: number;
  onAddToCookbook: () => void;
  onShare: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onAddToCookbook,
  onShare,
  onClearSelection,
}: BulkActionsBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            {selectedCount} {selectedCount === 1 ? 'recipe' : 'recipes'} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            onClick={onAddToCookbook}
            variant="outline"
            className="flex items-center gap-2 flex-1 sm:flex-initial text-sm"
            size="sm"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Add to Cookbook</span>
            <span className="sm:hidden">Add to Cookbook</span>
          </Button>
          <Button
            onClick={onShare}
            variant="outline"
            className="flex items-center gap-2 flex-1 sm:flex-initial text-sm"
            size="sm"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share Recipe</span>
            <span className="sm:hidden">Share</span>
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

