export type JourneyStepKey = 'welcome' | 'introInfo' | 'recipeForm' | 'summary' | 'success';

export interface JourneyStepConfig {
  key: JourneyStepKey;
  title?: string;
}

export const journeySteps: JourneyStepConfig[] = [
  { key: 'welcome', title: 'Welcome' },
  { key: 'introInfo', title: 'How it works' },
  { key: 'recipeForm', title: 'Your recipe' },
  { key: 'summary', title: 'Review' },
  { key: 'success', title: 'Thanks' },
];


