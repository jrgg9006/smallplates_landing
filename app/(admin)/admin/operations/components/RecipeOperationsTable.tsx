"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface RecipeWithProductionStatus {
  id: string;
  recipe_name: string;
  ingredients: string;
  instructions: string;
  comments: string | null;
  image_url: string | null;
  document_urls: string[] | null;
  upload_method: 'text' | 'image' | 'audio' | null;
  submission_status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
  submitted_at: string | null;
  updated_at: string;
  guests: {
    id: string;
    first_name: string;
    last_name: string;
    printed_name: string | null;
    email: string | null;
    is_self: boolean | null;
    source: string | null;
  } | null;
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  production_status: {
    id: string;
    text_finalized_in_indesign: boolean;
    image_generated: boolean;
    image_placed_in_indesign: boolean;
    operations_notes: string | null;
    production_completed_at: string | null;
    needs_review: boolean;
  } | null;
  calculated_status: 'no_action' | 'in_progress' | 'ready_to_print';
  group: {
    id: string;
    name: string;
  } | null;
  midjourney_prompts: {
    generated_prompt: string;
  } | null;
}

interface RecipeOperationsTableProps {
  recipes: RecipeWithProductionStatus[];
  onRecipeClick?: (recipe: RecipeWithProductionStatus) => void;
  onStatusUpdate?: () => void;
}

export function RecipeOperationsTable({ 
  recipes, 
  onRecipeClick,
  onStatusUpdate 
}: RecipeOperationsTableProps) {
  const [updatingRecipeId, setUpdatingRecipeId] = useState<string | null>(null);

  const handleCheckboxChange = async (
    recipeId: string,
    field: 'text_finalized_in_indesign' | 'image_generated' | 'image_placed_in_indesign',
    checked: boolean
  ) => {
    setUpdatingRecipeId(recipeId);
    
    try {
      const response = await fetch(`/api/v1/admin/operations/recipes/${recipeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: checked }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error updating: ${error.error}`);
        return;
      }

      // Trigger refresh
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error updating checkbox:', error);
      alert('Failed to update checkbox');
    } finally {
      setUpdatingRecipeId(null);
    }
  };


  const handleMarkAsReviewed = async (recipeId: string) => {
    if (!confirm('Mark this recipe as reviewed? This will clear the needs review flag.')) {
      return;
    }

    setUpdatingRecipeId(recipeId);
    
    try {
      const response = await fetch(`/api/v1/admin/operations/recipes/${recipeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return;
      }

      // Trigger refresh
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Error marking as reviewed:', error);
      alert('Failed to mark as reviewed');
    } finally {
      setUpdatingRecipeId(null);
    }
  };

  const getStatusBadge = (status: 'no_action' | 'in_progress' | 'ready_to_print', needsReview: boolean) => {
    if (needsReview) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
          ⚠️ Needs Review
        </span>
      );
    }

    switch (status) {
      case 'ready_to_print':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            Ready to Print
          </span>
        );
      case 'in_progress':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
            In Progress
          </span>
        );
      default:
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
            No Action
          </span>
        );
    }
  };

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No recipes found matching the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recipe
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[250px]">
              Guest
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[250px]">
              Group
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Text Finalized
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Image Generated
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Image Placed
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {recipes.map((recipe) => {
            const productionStatus = recipe.production_status;
            const isUpdating = updatingRecipeId === recipe.id;

            return (
              <tr
                key={recipe.id}
                onClick={() => onRecipeClick?.(recipe)}
                className={`hover:bg-gray-50 cursor-pointer ${isUpdating ? 'opacity-50' : ''} ${!recipe.group ? 'bg-orange-50' : ''}`}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {(() => {
                      // Normalize image_url - handle both string and array formats
                      let imageUrl: string | null = null;
                      
                      if (recipe.image_url) {
                        if (Array.isArray(recipe.image_url)) {
                          // If it's an array, take the first element and ensure it's a string
                          const firstItem = recipe.image_url[0];
                          if (typeof firstItem === 'string') {
                            imageUrl = firstItem;
                          } else if (Array.isArray(firstItem)) {
                            // Nested array - take first element
                            imageUrl = firstItem[0] || null;
                          }
                        } else if (typeof recipe.image_url === 'string') {
                          // Check if it's a JSON string that looks like an array
                          const trimmed = recipe.image_url.trim();
                          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                            try {
                              const parsed = JSON.parse(trimmed);
                              if (Array.isArray(parsed) && parsed.length > 0) {
                                imageUrl = typeof parsed[0] === 'string' ? parsed[0] : null;
                              }
                            } catch {
                              // If parsing fails, use the string as-is
                              imageUrl = recipe.image_url;
                            }
                          } else {
                            imageUrl = recipe.image_url;
                          }
                        }
                      }
                      
                      // Fallback to document_urls if image_url is not available
                      if (!imageUrl && recipe.document_urls && recipe.document_urls.length > 0) {
                        const docUrl = recipe.document_urls[0];
                        imageUrl = typeof docUrl === 'string' ? docUrl : null;
                      }
                      
                      // Final validation - ensure it's a valid URL string
                      if (imageUrl && typeof imageUrl !== 'string') {
                        imageUrl = null;
                      }
                      
                      return imageUrl ? (
                        <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={imageUrl}
                            alt={recipe.recipe_name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : null;
                    })()}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {recipe.recipe_name || 'Untitled Recipe'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[250px]">
                  <div className="text-sm text-gray-900 break-words">
                    {recipe.guests?.printed_name || 
                     `${recipe.guests?.first_name || ''} ${recipe.guests?.last_name || ''}`.trim() || 
                     'Unknown'}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {recipe.profiles?.full_name || recipe.profiles?.email || 'Unknown'}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[250px]">
                  <div className="text-sm text-gray-500 break-words">
                    {recipe.group ? (
                      <span>{recipe.group.name}</span>
                    ) : (
                      <span className="text-orange-600 font-medium">Archived</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    checked={productionStatus?.text_finalized_in_indesign || false}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCheckboxChange(recipe.id, 'text_finalized_in_indesign', e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isUpdating}
                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    checked={productionStatus?.image_generated || false}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCheckboxChange(recipe.id, 'image_generated', e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isUpdating}
                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    checked={productionStatus?.image_placed_in_indesign || false}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCheckboxChange(recipe.id, 'image_placed_in_indesign', e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={isUpdating}
                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(recipe.calculated_status, productionStatus?.needs_review || false)}
                    {productionStatus?.needs_review && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsReviewed(recipe.id);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                        disabled={isUpdating}
                      >
                        Mark Reviewed
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {new Date(recipe.created_at).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

