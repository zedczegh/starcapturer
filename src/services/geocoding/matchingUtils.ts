
// This file is now just a simple re-export wrapper to maintain compatibility
// while the actual implementation has been moved to the matching/ directory
import { Location } from './types';
import { 
  containsChineseCharacters,
  generatePinyinVariations,
  soundex,
  getMatchScore,
  findBestMatches 
} from './matching';
import { checkAlternativeSpellings as checkSpellings } from './chineseCityData';

export { 
  containsChineseCharacters,
  generatePinyinVariations,
  soundex,
  getMatchScore,
  findBestMatches 
};

// Re-export the checkAlternativeSpellings function with the same signature
export function checkAlternativeSpellings(query: string): Location[] {
  return checkSpellings(query);
}
