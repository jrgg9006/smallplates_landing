"use client";

import React from 'react';

interface IntroInfoStepProps {
  onContinue: () => void;
  onBack: () => void;
}

export default function IntroInfoStep({ onContinue, onBack }: IntroInfoStepProps) {
  return (
    <div className="space-y-6" role="region" aria-labelledby="intro-heading">
      <h2 id="intro-heading" className="font-serif text-2xl md:text-3xl font-semibold text-gray-900">
        Before you share your recipe
      </h2>
      <p className="text-gray-600">Here’s what we’re looking for and how to make it easy.</p>

      <ul className="list-disc pl-6 space-y-2 text-gray-700">
        <li>Give your recipe a short, clear title.</li>
        <li>List ingredients with quantities (one per line).</li>
        <li>Write steps like you’d explain it to a friend.</li>
        <li>Optional: add a short personal note or story.</li>
      </ul>

      <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
        <p className="text-sm text-gray-600">Tip: You can always go back and edit before submitting.</p>
      </div>

      {/* Bottom nav is provided by Frame; this component only renders content */}
    </div>
  );
}


