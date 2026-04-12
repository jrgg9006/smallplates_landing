'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface WelcomeOverlayProps {
  userName: string;
  onStart: () => void;
  onDismiss: () => void;
  isVisible: boolean;
}

export function WelcomeOverlay({ userName, onStart, onDismiss, isVisible }: WelcomeOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex h-full items-center justify-center p-8"
          >
            <div className="max-w-2xl text-center">
              {/* Subtle logo */}
              <div className="mb-8">
                <Image 
                  src="/images/SmallPlates_logo_horizontal.png" 
                  alt="Small Plates"
                  width={120} 
                  height={24} 
                  className="mx-auto opacity-80" 
                />
              </div>
              
              {/* Main message with editorial typography */}
              <h1 className="font-light text-4xl md:text-5xl mb-6 tracking-tight">
                You&apos;re about to be the MVP of this wedding.
              </h1>

              <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-10 max-w-xl mx-auto">
                Here&apos;s your playbook. Five small things and the book starts filling itself.
              </p>

              {/* Single CTA */}
              <div className="flex justify-center">
                <Button
                  onClick={onStart}
                  className="bg-black text-white px-8 py-4 text-lg hover:bg-gray-800 transition-colors"
                >
                  Show me
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}