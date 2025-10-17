import { Guest } from './database';

declare module '@tanstack/react-table' {
  interface TableMeta<TData> {
    onGuestClick?: (guest: Guest) => void;
    onModalClose?: () => void;
    onGuestDeleted?: () => void;
    onAddRecipe?: (guest: Guest) => void;
  }
}