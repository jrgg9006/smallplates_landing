export type JourneyStepKey = 'welcome' | 'recipeType' | 'introInfo' | 'realBook' | 'uploadMethod' | 'recipeForm' | 'recipeTitle' | 'imageUpload' | 'personalNote' | 'summary' | 'success';

export interface JourneyStepConfig {
  key: JourneyStepKey;
  title?: string;
  ctaLabel?: string;
}

export const journeySteps: JourneyStepConfig[] = [
  { key: 'welcome', title: 'Welcome', ctaLabel: "Add your Small Plate" },
  { key: 'recipeType', title: 'Recipe type', ctaLabel: 'Continue' },
  { key: 'introInfo', title: 'How it works', ctaLabel: 'Got it!' },
  { key: 'realBook', title: 'Printed book', ctaLabel: 'Start writing' },
  { key: 'uploadMethod', title: 'Choose format', ctaLabel: 'Continue' },
  { key: 'recipeForm', title: 'Your recipe', ctaLabel: 'Add my creation' },
  { key: 'recipeTitle', title: 'Recipe name', ctaLabel: 'Next' },
  { key: 'imageUpload', title: 'Upload images', ctaLabel: 'Continue' },
  { key: 'personalNote', title: 'Personal note', ctaLabel: 'Submit Plate' },
  { key: 'summary', title: 'Review' },
  { key: 'success', title: 'Thanks' },
];


