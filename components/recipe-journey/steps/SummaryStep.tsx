"use client";

import React from 'react';

interface SummaryStepProps {
  recipeName: string;
  ingredients: string;
  instructions: string;
  personalNote?: string;
  onEditSection?: (section: 'title' | 'ingredients' | 'instructions' | 'note') => void;
}

export default function SummaryStep({ recipeName, ingredients, instructions, personalNote, onEditSection }: SummaryStepProps) {
  const EditLink = ({ section, children }: { section: 'title' | 'ingredients' | 'instructions' | 'note'; children: React.ReactNode }) => (
    <button
      type="button"
      className="text-sm text-gray-600 underline underline-offset-2 hover:text-gray-800"
      onClick={() => onEditSection?.(section)}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-8" role="region" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="font-serif text-2xl md:text-3xl font-semibold text-gray-900">Review your recipe</h2>

      <div className="space-y-6 text-left">
        <div className="border-l-4 border-gray-200 pl-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Title</h3>
            <EditLink section="title">Editar</EditLink>
          </div>
          <p className="text-gray-700 mt-1">{recipeName || '—'}</p>
        </div>

        <div className="border-l-4 border-gray-200 pl-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Ingredients</h3>
            <EditLink section="ingredients">Editar</EditLink>
          </div>
          <p className="text-gray-700 whitespace-pre-line mt-1">
            {ingredients ? ingredients : '—'}
          </p>
        </div>

        <div className="border-l-4 border-gray-200 pl-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Instructions</h3>
            <EditLink section="instructions">Editar</EditLink>
          </div>
          <p className="text-gray-700 whitespace-pre-line mt-1">
            {instructions ? instructions : '—'}
          </p>
        </div>

        {typeof personalNote === 'string' && (
          <div className="border-l-4 border-gray-200 pl-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Personal note</h3>
              <EditLink section="note">Editar</EditLink>
            </div>
            <p className="text-gray-700 whitespace-pre-line italic mt-1">
              {personalNote || '—'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


