"use client";

import { useState } from "react";
import SignaturePad from "@/components/signature/SignaturePad";

interface SignatureStepProps {
  // Signature already captured (if the guest returns to this step).
  initialSignature?: string;
  // Emits the PNG (dataURL) live, or null when cleared.
  onCapture: (dataUrl: string | null) => void;
  // Skips the step without signing (clears + advances).
  onSkip: () => void;
}

export default function SignatureStep({
  initialSignature,
  onCapture,
  onSkip,
}: SignatureStepProps) {
  // Reason: only show the "existing signature" view if there was ALREADY one when
  // the step mounted (i.e. they came back). Captured strokes update initialSignature
  // live, so we must snapshot at mount — otherwise the pad freezes after one stroke.
  const [hadInitial] = useState(() => Boolean(initialSignature));
  const [replacing, setReplacing] = useState(false);
  const showExisting = hadInitial && !replacing;

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
      <div className="w-full space-y-8 px-4 md:px-6">
        <div className="space-y-2 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-brand-charcoal">
            Sign it.
          </h2>
          <p className="text-base text-gray-500">
            Your handwriting goes on the page, right under your recipe.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {showExisting ? (
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={initialSignature}
                alt="Your signature"
                className="max-h-40 rounded-lg border border-gray-200 bg-white p-2"
              />
              <button
                type="button"
                onClick={() => setReplacing(true)}
                className="mt-4 text-sm font-medium text-gray-600 hover:text-gray-900 underline"
              >
                Replace signature
              </button>
            </div>
          ) : (
            <>
              <SignaturePad height={200} onCapture={onCapture} />
              <p className="mt-3 text-xs text-gray-400 text-center md:hidden">
                Turn your phone for more room.
              </p>
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={onSkip}
                  className="text-sm font-medium text-gray-400 hover:text-gray-600"
                >
                  Skip
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
