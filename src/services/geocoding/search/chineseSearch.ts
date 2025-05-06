
import { Location, Language } from '../types';
import { checkAlternativeSpellings } from '../chineseCityData';
import { findMatchingLocations } from '../locationDatabase';

/**
 * Handle Chinese language search
 */
export async function handleChineseSearch(query: string, language: Language): Promise<Location[]> {
  // Check for special Chinese locations
  const specialLocation = await checkSpecialChineseLocations(query);
  if (specialLocation.length > 0) {
    return specialLocation;
  }
  
  // Check for alternative spellings
  const alternativeResults = checkAlternativeSpellings(query);
  if (alternativeResults.length > 0) {
    return alternativeResults;
  }
  
  // Check internal database
  const internalResults = findMatchingLocations(query, 5, language);
  if (internalResults.length > 0) {
    return internalResults;
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
