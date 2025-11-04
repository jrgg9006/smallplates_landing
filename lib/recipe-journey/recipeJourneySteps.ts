export type JourneyStepKey = 'welcome' | 'introInfo' | 'realBook' | 'recipeForm' | 'summary' | 'success';

export interface JourneyStepConfig {
  key: JourneyStepKey;
  title?: string;
  ctaLabel?: string;
}

export const journeySteps: JourneyStepConfig[] = [
  { key: 'welcome', title: 'Welcome', ctaLabel: "Let's do it!" },
  { key: 'introInfo', title: 'How it works', ctaLabel: 'Got it!' },
  { key: 'realBook', title: 'Printed book', ctaLabel: 'Start writting' },
  { key: 'recipeForm', title: 'Your recipe', ctaLabel: 'Add my recipe' },
  { key: 'summary', title: 'Review' },
  { key: 'success', title: 'Thanks' },
];


