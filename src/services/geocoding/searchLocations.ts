
import { Language, Location, GeocodeResponse } from "./types";
import { findBestMatches } from "./matching/matcher";
import { searchLocationDatabase } from "./locationDatabase";
import { searchChineseRegions } from "./search/chineseRegionSearch";
import { searchByExternalProvider } from "./search/externalSearch";
import { searchSpecialCases } from "./search/specialCases";

/**
 * Search for locations based on input query
 * @param query Search query text
 * @param language User's preferred language
 * @returns Array of matching locations
 */
export async function searchLocations(
  query: string,
  language: Language = "en"
): Promise<Location[]> {
  try {
    // Trim and validate query
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];
    
    // Try different search methods in sequence
    
    // 1. First check for special cases (e.g., "current location")
    const specialResults = await searchSpecialCases(trimmedQuery, language);
    if (specialResults.length > 0) {
      return specialResults;
    }
    
    // 2. Search local database
    const databaseResults = await searchLocationDatabase(trimmedQuery, language);
    
    // For Chinese language, prioritize Chinese region search
    if (language === "zh") {
      const chineseResults = await searchChineseRegions(trimmedQuery);
      if (chineseResults.length > 0) {
        // Combine results, removing duplicates
        return findBestMatches(chineseResults.concat(databaseResults), trimmedQuery, language);
      }
    }
    
    // If we have reasonable results from database, use those
    if (databaseResults.length > 0) {
      return findBestMatches(databaseResults, trimmedQuery, language);
    }
    
    // 3. As last resort, try external geocoding API
    const externalResults = await searchByExternalProvider(trimmedQuery, language);
    
    // Combine all results and sort by best match
    const allResults = [...databaseResults, ...externalResults];
    return findBestMatches(allResults, trimmedQuery, language);
  } catch (error) {
    console.error("Error searching locations:", error);
    return [];
  }
}
