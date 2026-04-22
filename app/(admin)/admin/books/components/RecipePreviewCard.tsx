'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

interface RecipeData {
  id: string;
  recipe_name: string;
  ingredients: string;
  instructions: string;
  comments: string | null;
  guest_name: string;
  guest_id: string;
  image_url: string | null;
  generated_image_url: string | null;
  generated_image_url_print: string | null;
  image_upscale_status: string | null;
  has_print_ready: boolean;
  print_ready: {
    recipe_name_clean: string;
    ingredients_clean: string;
    instructions_clean: string;
    note_clean: string | null;
    cleaning_version: number;
  } | null;
  needs_review: boolean;
  book_review_status: string;
  book_review_notes: string | null;
}

interface RecipePreviewCardProps {
  recipe: RecipeData;
  groupId: string;
  onReview?: () => void;
}

export default function RecipePreviewCard({ recipe, groupId, onReview }: RecipePreviewCardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasBaseImage = !!recipe.generated_image_url;
  const hasPrintImage = !!recipe.generated_image_url_print;

  // Prioritize clean version
  const displayName = recipe.print_ready?.recipe_name_clean || recipe.recipe_name;
  const displayIngredients = recipe.print_ready?.ingredients_clean || recipe.ingredients;
  const displayInstructions = recipe.print_ready?.instructions_clean || recipe.instructions;

  return (
    <div className="border rounded-lg bg-gray-50">
      {/* Collapsed row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-100 transition-colors"
      >
        {expanded
          ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        }

        <span className="text-sm font-medium text-gray-900 truncate flex-1">
          {displayName}
          <span className="ml-2 text-[10px] font-mono text-gray-400">{recipe.id.slice(0, 8)}</span>
          {onReview && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onReview(); }}
              className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer"
            >
              Review
            </span>
          )}
        </span>

        {recipe.needs_review && (
          <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0 bg-amber-100 text-amber-700">
            Ops. Review
          </span>
        )}

        <span className="text-secondary-sm text-gray-500 shrink-0">
          by {recipe.guest_name}
        </span>

        {/* Reason: Fixed-width badge columns so they align vertically across all recipe rows */}
        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 w-[62px] text-center ${
          recipe.has_print_ready ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {recipe.has_print_ready ? 'Clean' : 'No clean'}
        </span>

        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 w-[72px] text-center ${
          hasPrintImage ? 'bg-green-100 text-green-700' :
          hasBaseImage ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {hasPrintImage ? 'Print img' : hasBaseImage ? 'No print img' : 'No img'}
        </span>

        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 w-[80px] text-center font-medium ${
          recipe.book_review_status === 'approved'
            ? 'bg-green-600 text-white'
            : recipe.book_review_status === 'needs_revision'
            ? 'bg-red-100 text-red-700'
            : ''
        }`}>
          {recipe.book_review_status === 'approved'
            ? 'Approved'
            : recipe.book_review_status === 'needs_revision'
            ? 'Needs Revision'
            : ''}
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Ingredients</h4>
            <p className="text-sm text-gray-700 whitespace-pre-line">{displayIngredients}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Instructions</h4>
            <p className="text-sm text-gray-700 whitespace-pre-line">{displayInstructions}</p>
          </div>
          {recipe.comments && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Comments</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">{recipe.comments}</p>
            </div>
          )}
          <div className="pt-2">
            <a
              href={`/admin/content?group=${groupId}&recipe=${recipe.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
            >
              Edit in Content <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
