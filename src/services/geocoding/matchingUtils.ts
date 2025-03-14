
// This file re-exports functionality from the matching/ directory
// to maintain backward compatibility
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
