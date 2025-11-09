"use client";

import React from 'react';

interface PersonalNoteStepProps {
  personalNote: string;
  onChange: (value: string) => void;
  userName: string;
}

export default function PersonalNoteStep({ personalNote, onChange, userName }: PersonalNoteStepProps) {
  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
      <div className="w-full space-y-8 px-4 md:px-6">
        <div className="space-y-2 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-gray-900">
            Add a Personal Note
          </h2>
          <p className="mt-3 text-base text-gray-600">
            Add a note to {userName} to be added to this recipe! Can be anything!
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <textarea
            value={personalNote}
            onChange={(e) => onChange(e.target.value)}
            placeholder="This recipe always reminds me of Sunday mornings with family..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
          />
          <p className="mt-2 text-xs text-gray-500 text-center">
            This note will be included with your recipe in the cookbook
          </p>
        </div>
      </div>
    </div>
  );
}