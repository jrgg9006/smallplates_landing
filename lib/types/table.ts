import { Guest } from './database';
import { RecipeWithGuest, RecipeInCookbook } from './database';

declare module '@tanstack/react-table' {
  interface TableMeta<TData> {
    onGuestClick?: (guest: Guest) => void;
    onModalClose?: () => void;
    onGuestDeleted?: () => void;
    onAddRecipe?: (guest: Guest) => void;
    onRecipeDeleted?: () => void;
    onRecipeClick?: (recipe: RecipeWithGuest) => void;
    onRecipeRemoved?: () => void;
    onRecipeCopied?: () => void;
    onAddNote?: (recipe: RecipeInCookbook) => void;
    onRecipeAddedToCookbook?: () => void;
  }
}