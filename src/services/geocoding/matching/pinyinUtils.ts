
import { PinyinVariationsMap } from './types';

// Map common pinyin syllables to possible variations when typing quickly
export const pinyinVariations: PinyinVariationsMap = {
  'zh': ['z', 'j'],
  'ch': ['c', 'q'],
  'sh': ['s', 'x'],
  'ang': ['an', 'ang', 'ag'],
  'eng': ['en', 'eng', 'eg'],
  'ing': ['in', 'ing', 'ig'],
  'ong': ['on', 'ong', 'og'],
  'ian': ['ian', 'iam', 'yan'],
  'uan': ['uan', 'wan'],
  'uang': ['uang', 'wang'],
};

/**
 * Check if string contains Chinese characters
 */
export function containsChineseCharacters(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Helper function to generate pinyin variations
 */
export function generatePinyinVariations(input: string): string[] {
  let variations: string[] = [input];
  
  // Generate basic variations with space/hyphen between syllables
  if (input.length > 2) {
    for (let i = 2; i < input.length; i++) {
      const withSpace = input.slice(0, i) + ' ' + input.slice(i);
      const withHyphen = input.slice(0, i) + '-' + input.slice(i);
      variations.push(withSpace, withHyphen);
    }
  }
  
  // Apply pinyin-specific variations
  Object.entries(pinyinVariations).forEach(([standard, variants]) => {
    variants.forEach(variant => {
      if (variant !== standard) {
        const regex = new RegExp(variant, 'g');
        if (input.match(regex)) {
          variations.push(input.replace(regex, standard));
        }
        
        const standardRegex = new RegExp(standard, 'g');
        if (input.match(standardRegex)) {
          variations.push(input.replace(standardRegex, variant));
        }
      }
    });
  });
  
  return [...new Set(variations)]; // Remove duplicates
}
