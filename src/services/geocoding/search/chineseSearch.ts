
import { Location, Language } from '../types';
import { checkAlternativeSpellings } from '../chineseCityData';
import { findMatchingLocations } from '../locationDatabase';
import { convertToSimplifiedChinese, containsChineseCharacters } from '@/utils/chineseCharacterConverter';

/**
 * Handle Chinese language search
 */
export async function handleChineseSearch(query: string, language: Language): Promise<Location[]> {
  // Convert query to simplified Chinese if it contains Chinese characters
  const simplifiedQuery = containsChineseCharacters(query) ? convertToSimplifiedChinese(query) : query;
  
  // Check for special Chinese locations
  const specialLocation = await checkSpecialChineseLocations(simplifiedQuery);
  if (specialLocation.length > 0) {
    return specialLocation.map(loc => ({
      ...loc,
      name: language === 'zh' ? convertToSimplifiedChinese(loc.name) : loc.name
    }));
  }
  
  // Check for alternative spellings
  const alternativeResults = checkAlternativeSpellings(simplifiedQuery);
  if (alternativeResults.length > 0) {
    return alternativeResults.map(loc => ({
      ...loc,
      name: language === 'zh' ? convertToSimplifiedChinese(loc.name) : loc.name
    }));
  }
  
  // Check internal database
  const internalResults = findMatchingLocations(simplifiedQuery, 5, language);
  if (internalResults.length > 0) {
    return internalResults.map(loc => ({
      ...loc,
      name: language === 'zh' ? convertToSimplifiedChinese(loc.name) : loc.name
    }));
  }
  
  return [];
}

/**
 * Check for special Chinese locations that need specific handling
 */
export async function checkSpecialChineseLocations(query: string): Promise<Location[]> {
  // Special Chinese location checks with higher priority
  if (query.includes('徐汇') || query === 'xuhui' || query === 'xu hui') {
    return checkAlternativeSpellings('徐汇');
  }
  
  if (query.includes('南明') || query === 'nanming' || query === 'nan ming') {
    return checkAlternativeSpellings('南明');
  }
  
  if (query.includes('都匀') || query === 'duyun' || query === 'du yun') {
    return checkAlternativeSpellings('都匀');
  }
  
  return [];
}
