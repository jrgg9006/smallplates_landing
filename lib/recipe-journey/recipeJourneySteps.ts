export type JourneyStepKey = 'welcome' | 'introInfo' | 'realBook' | 'uploadMethod' | 'recipeForm' | 'recipeTitle' | 'imageUpload' | 'personalNote' | 'summary' | 'success';

export interface JourneyStepConfig {
  key: JourneyStepKey;
  title?: string;
  ctaLabel?: string;
}

export const journeySteps: JourneyStepConfig[] = [
  { key: 'welcome', title: 'Welcome', ctaLabel: "Let's do it!" },
  { key: 'introInfo', title: 'How it works', ctaLabel: 'Got it!' },
  { key: 'realBook', title: 'Printed book', ctaLabel: 'Start writing' },
  { key: 'uploadMethod', title: 'Choose format', ctaLabel: 'Continue' },
  { key: 'recipeForm', title: 'Your recipe', ctaLabel: 'Add my recipe' },
  { key: 'recipeTitle', title: 'Recipe name', ctaLabel: 'Next' },
  { key: 'imageUpload', title: 'Upload images', ctaLabel: 'Continue' },
  { key: 'personalNote', title: 'Personal note', ctaLabel: 'Submit Recipe' },
  { key: 'summary', title: 'Review' },
  { key: 'success', title: 'Thanks' },
];


