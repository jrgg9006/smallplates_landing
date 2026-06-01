// Reason: stores onboarding answers in localStorage so the user can refresh without
// losing progress. Only used pre-account-creation (Steps 1-3). After Step 4
// (about-you), state lives in DB on groups table.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OccasionType = "bridal_shower" | "wedding" | "anniversary" | "birthday" | "unsure" | null;

interface OnboardingState {
  occasion: OccasionType;
  bookDate: string | null;
  bookDateUndecided: boolean;
  setOccasion: (val: OccasionType) => void;
  setBookDate: (val: string | null) => void;
  setBookDateUndecided: (val: boolean) => void;
  reset: () => void;
}

export const useOnboardingState = create<OnboardingState>()(
  persist(
    (set) => ({
      occasion: null,
      bookDate: null,
      bookDateUndecided: false,
      setOccasion: (val) => set({ occasion: val }),
      setBookDate: (val) => set({ bookDate: val }),
      setBookDateUndecided: (val) => set({ bookDateUndecided: val }),
      reset: () => set({ occasion: null, bookDate: null, bookDateUndecided: false }),
    }),
    { name: "sp-onboarding" }
  )
);
