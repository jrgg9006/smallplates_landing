"use client";

import React from "react";
import { RecipeWithGuest } from "@/lib/types/database";

interface RecipeCardGridProps {
  recipes: RecipeWithGuest[];
  onRecipeClick: (recipe: RecipeWithGuest) => void;
  onEditRecipe: (recipe: RecipeWithGuest) => void;
  onRemoveRecipe: (recipe: RecipeWithGuest) => void;
  searchValue?: string;
}

export function RecipeCardGrid({ 
  recipes, 
  onRecipeClick, 
  onEditRecipe, 
  onRemoveRecipe,
  searchValue = ""
}: RecipeCardGridProps) {
  // Filter recipes based on search
  const filteredRecipes = searchValue 
    ? recipes.filter(recipe => 
        recipe.recipe_name.toLowerCase().includes(searchValue.toLowerCase()) ||
        recipe.guests?.first_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        recipe.guests?.last_name?.toLowerCase().includes(searchValue.toLowerCase())
      )
    : recipes;

  if (filteredRecipes.length === 0 && searchValue) {
    return (
      <div className="text-center py-12">
        <p className="text-[hsl(var(--brand-warm-gray))] text-lg">
          No recipes found for &ldquo;{searchValue}&rdquo;
        </p>
      </div>
    );
  }

  if (filteredRecipes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-base text-[hsl(var(--brand-warm-gray))]">
          No recipes yet. That&rsquo;s about to change.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {filteredRecipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onClick={() => onRecipeClick(recipe)}
          onEdit={() => onEditRecipe(recipe)}
          onRemove={() => onRemoveRecipe(recipe)}
        />
      ))}
    </div>
  );
}

interface RecipeCardProps {
  recipe: RecipeWithGuest;
  onClick: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

function RecipeCard({ recipe, onClick, onEdit, onRemove }: RecipeCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // Get contributor info
  const contributorName = recipe.guests 
    ? `${recipe.guests.first_name} ${recipe.guests.last_name}`.trim()
    : 'You';

  return (
    <div 
      className="recipe-card group relative"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Recipe Name with quotes and italic */}
      <h3 className="recipe-card__title">
        &ldquo;{recipe.recipe_name}&rdquo;
      </h3>
      
      {/* Decorative line */}
      <div className="recipe-card__decorative-line" />
      
      {/* Attribution */}
      <p className="recipe-card__contributor">
        From {contributorName}
      </p>

      {/* Action Buttons - Shown on hover */}
      {isHovered && (
        <div className="recipe-card__actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="recipe-card__action-btn text-[hsl(var(--brand-warm-gray))] hover:text-[hsl(var(--brand-charcoal))]"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="recipe-card__action-btn text-[#B5A89A] hover:text-[hsl(var(--brand-terracotta))]"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}