
// Refactored: src/utils/astronomyTips.ts

import ASTRONOMY_TIPS_A from './astronomyTipsA';
import ASTRONOMY_TIPS_B from './astronomyTipsB';

// Combine all facts in one place
export const ASTRONOMY_STORIES: Array<[string, string]> = [
  ...ASTRONOMY_TIPS_A,
  ...ASTRONOMY_TIPS_B
];

// Function to get a random astronomy tip
export const getRandomAstronomyTip = (): [string, string] => {
  const randomIndex = Math.floor(Math.random() * ASTRONOMY_STORIES.length);
  return ASTRONOMY_STORIES[randomIndex];
};
