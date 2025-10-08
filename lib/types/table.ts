import { Guest } from './guest';

declare module '@tanstack/react-table' {
  interface TableMeta<TData> {
    onGuestClick?: (guest: Guest) => void;
    onModalClose?: () => void;
  }
}