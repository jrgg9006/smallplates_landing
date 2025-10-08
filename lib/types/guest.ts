export type RecipeStatus = 'not_invited' | 'invited' | 'submitted';

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  recipeStatus: RecipeStatus;
  invitedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestFormData {
  name: string;
  email: string;
  phone?: string;
}

export interface GuestStatistics {
  totalGuests: number;
  invitesSent: number;
  recipesReceived: number;
}