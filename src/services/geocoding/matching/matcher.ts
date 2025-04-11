
import { Location } from '../types';
import { getMatchScore } from './scoreCalculator';
import { containsChineseCharacters } from './pinyinUtils';

/**
 * Find the best matching locations based on search query
 * Enhanced version with multi-factor relevancy scoring
 * 
 * @param locations List of locations to search through
 * @param query User search query
 * @param language Language for matching prioritization
 * @returns Filtered and sorted list of locations
 */
export function findBestMatches(locations: Location[], query: string, language: string = 'en'): Location[] {
  if (!locations || locations.length === 0) return [];
  
  const hasChineseQuery = containsChineseCharacters(query);
  const queryLower = query.toLowerCase().trim();
  
  // Calculate match scores for all locations with enhanced algorithm
  const scoredLocations = locations.map(location => {
    // Get base match score from string matching
    const baseScore = getMatchScore(location.name, query, language);
    
    // Additional location type scoring - prioritize dark sky sites and observatories
    let typeBonus = 0;
    if (location.type === 'dark-site' || location.name.toLowerCase().includes('observatory')) {
      typeBonus = 15;
    } else if (location.type === 'natural' && (
      location.name.toLowerCase().includes('park') || 
      location.name.toLowerCase().includes('mountain') || 
      location.name.toLowerCase().includes('reserve')
    )) {
      typeBonus = 10; // Natural locations often have better skies
    } else if (location.name.toLowerCase().includes('lake') || 
              location.name.toLowerCase().includes('valley') || 
              location.name.toLowerCase().includes('forest')) {
      typeBonus = 8; // Other natural features often have less light pollution
    }
    
    // Don't let type bonus push a truly poor match to the top
    const adjustedTypeBonus = baseScore < 20 ? 0 : typeBonus;
    
    // Calculate final score
    const finalScore = Math.min(100, baseScore + adjustedTypeBonus);
    
    return { location, score: finalScore };
  });
  
  // Apply language-specific filtering with improved logic
  let filteredLocations = scoredLocations;
  
  // In Chinese mode with Chinese query, heavily prioritize Chinese results
  if (language === 'zh' && hasChineseQuery) {
    // First try to find locations with Chinese characters that have good scores
    const chineseLocations = filteredLocations.filter(
      item => containsChineseCharacters(item.location.name) && item.score >= 50
    );
    
    // If we have good Chinese matches, use only those
    if (chineseLocations.length > 0) {
      filteredLocations = chineseLocations;
    } else {
      // Otherwise, just filter very low scores
      filteredLocations = filteredLocations.filter(item => item.score >= 40);
    }
  } else {
    // For other languages, use a lower threshold but still filter poor matches
    filteredLocations = filteredLocations.filter(item => item.score >= 20);
    
    // Special case for short queries - if the query is just 1-2 characters,
    // prioritize results that start with those characters
    if (queryLower.length <= 2) {
      const exactPrefixMatches = filteredLocations.filter(item => 
        item.location.name.toLowerCase().startsWith(queryLower)
      );
      
      if (exactPrefixMatches.length > 0) {
        // If we have prefix matches, add a bonus to their scores
        exactPrefixMatches.forEach(item => {
          item.score += 20;
        });
      }
    }
    
    // Special handling for observatory search
    if (queryLower.includes('observatory') || queryLower.includes('星台')) {
      filteredLocations.forEach(item => {
        if (item.location.name.toLowerCase().includes('observatory') || 
            item.location.name.includes('星台') ||
            item.location.name.toLowerCase().includes('planetarium')) {
          item.score += 15; // Boost observatory and planetarium matches
        }
      });
    }
    
    // Special handling for dark sky searches
    if (queryLower.includes('dark sky') || queryLower.includes('dark site') || 
        queryLower.includes('暗空') || queryLower.includes('暗夜')) {
      filteredLocations.forEach(item => {
        if (item.location.type === 'dark-site' || 
            item.location.name.toLowerCase().includes('dark sky') || 
            item.location.name.includes('暗空') ||
            item.location.name.includes('暗夜')) {
          item.score += 25; // Heavily boost dark sky matches
        }
      });
    }
  }
  
  // Sort by match score (highest first)
  const sortedLocations = filteredLocations.sort((a, b) => b.score - a.score);
  
  // Extract just the location objects for the final result
  return sortedLocations.map(item => item.location);
}
