"use client";

import { forwardRef } from "react";
import Image from "next/image";
import type { RecipeData } from "@/lib/data/cookbookPreviewData";

interface BookPageProps {
  recipe: RecipeData;
}

const BookPage = forwardRef<HTMLDivElement, BookPageProps>(
  ({ recipe }, ref) => {
    return (
      <div 
        className="page" 
        ref={ref}
        role="article"
        aria-label={`Recipe page: ${recipe.name}`}
      >
        <div className="page-content">
          <div className="page-header">
            <h2 className="page-title">{recipe.name}</h2>
            <span className="page-category">{recipe.category}</span>
          </div>

          <div className="page-image">
            <Image
              src={recipe.image}
              alt={recipe.name}
              width={240}
              height={160}
              className="recipe-image"
              priority={false}
            />
          </div>

          <div className="page-text">
            <div className="ingredients-section">
              <h3 className="section-title">Ingredients</h3>
              <pre className="ingredients-text">{recipe.ingredients}</pre>
            </div>

            <div className="instructions-section">
              <h3 className="section-title">Instructions</h3>
              <pre className="instructions-text">{recipe.instructions}</pre>
            </div>
          </div>

          <div className="page-footer">
            <span className="page-number">{recipe.pageNumber}</span>
          </div>
        </div>
      </div>
    );
  }
);

BookPage.displayName = "BookPage";

export default BookPage;

