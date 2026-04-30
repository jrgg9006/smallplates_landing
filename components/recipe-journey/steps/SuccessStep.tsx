"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface SuccessStepProps {
  defaultName?: string;
  defaultEmail?: string;
  hasGuestOptIn?: boolean;
  guestOptInEmail?: string;
  onSavePrefs: (name: string | undefined, email: string | undefined, optedIn: boolean) => Promise<void> | void;
  coupleImageUrl?: string | null;
  recipeName?: string;
  coupleNames?: string | null;
}

const EASE_OUT_QUART: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SPARK_ANGLES = [30, 90, 150, 210, 270, 330];

export default function SuccessStep({
  defaultEmail,
  hasGuestOptIn = false,
  guestOptInEmail,
  onSavePrefs,
  recipeName,
  coupleNames,
}: SuccessStepProps) {
  const [email, setEmail] = useState(defaultEmail || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sparkling, setSparkling] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (saved) {
      setSparkling(true);
      const t = setTimeout(() => setSparkling(false), 350);
      return () => clearTimeout(t);
    }
  }, [saved]);

  const alreadyIn = hasGuestOptIn && guestOptInEmail;

  const handleSave = async () => {
    if (!email.trim() || !email.includes('@')) return;
    setSaving(true);
    try {
      await onSavePrefs(undefined, email.trim(), true);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : delay, ease: EASE_OUT_QUART },
  });

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center" role="region" aria-labelledby="thanks-heading">
      <div className="text-center max-w-md mx-auto px-4">

        {/* Animated SVG checkmark — circle draws first, then the check */}
        <motion.div
          className="flex justify-center mb-6 mt-8 text-brand-honey"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: EASE_OUT_QUART }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true" overflow="visible">
            <motion.circle
              cx="20" cy="20" r="16"
              stroke="currentColor"
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.55, ease: EASE_OUT_QUART }}
            />
            <motion.path
              d="M 12 20.5 L 17 25.5 L 28 14.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT_QUART, delay: reduceMotion ? 0 : 0.45 }}
            />
            {!reduceMotion && SPARK_ANGLES.map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <motion.line
                  key={deg}
                  x1={20 + 19 * Math.cos(rad)} y1={20 + 19 * Math.sin(rad)}
                  x2={20 + 26 * Math.cos(rad)} y2={20 + 26 * Math.sin(rad)}
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: sparkling ? 1 : 0, opacity: sparkling ? 1 : 0 }}
                  transition={{ duration: 0.2, delay: i * 0.025, ease: EASE_OUT_QUART }}
                />
              );
            })}
          </svg>
        </motion.div>

        <motion.h2
          id="thanks-heading"
          className="font-serif text-4xl md:text-[2.5rem] font-semibold text-brand-charcoal tracking-tight"
          {...fadeUp(0.2)}
        >
          {recipeName ? (
            <>Your <em className="text-[#4a4a4a]">{recipeName}</em> is in the book.</>
          ) : (
            <>You&apos;re in the book.</>
          )}
        </motion.h2>

        {coupleNames && (
          <motion.p
            className="text-xs tracking-[0.25em] uppercase text-brand-honey/70 mt-5 font-medium"
            {...fadeUp(0.38)}
          >
            {coupleNames}
          </motion.p>
        )}

        <motion.div
          className="w-8 h-[2px] bg-brand-charcoal mx-auto my-8"
          {...fadeUp(0.38)}
        />

        <motion.div {...fadeUp(0.52)}>
          <AnimatePresence mode="wait">
            {alreadyIn || saved ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT_QUART }}
              >
                <p className="font-serif text-xl text-brand-charcoal">You&apos;re on the list.</p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                className="space-y-2"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_OUT_QUART }}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && email.trim()) void handleSave(); }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-brand-honey transition-colors"
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !email.trim() || !email.includes('@')}
                    className="px-4 py-2.5 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
                  >
                    {saving ? 'Saving...' : 'Send it to me'}
                  </button>
                </div>
                <p className="text-sm text-gray-400 text-center leading-relaxed mt-1">
                  Get the complete PDF version of the book when it&apos;s ready. Your recipe, inside. Plus a 15% referral discount code.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
}
