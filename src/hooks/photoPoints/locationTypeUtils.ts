
import { SharedAstroSpot } from "@/lib/api/astroSpots";

/**
 * Check if a location is in a mountainous area based on name or type
 */
export function isMountainousLocation(location: SharedAstroSpot): boolean {
  if (!location.name) return false;
  
  const nameLC = location.name.toLowerCase();
  const chineseNameLC = location.chineseName?.toLowerCase() || '';
  
  // Check English name
  if (nameLC.includes('mountain') || 
      nameLC.includes('mount ') || 
      nameLC.includes(' mt.') || 
      nameLC.includes('mt ') ||
      nameLC.includes('peak') || 
      nameLC.includes('hills') ||
      nameLC.includes('range') ||
      nameLC.includes('ridge') ||
      nameLC.includes('highland') ||
      nameLC.includes('plateau')) {
    return true;
  }
  
  // Check Chinese name
  if (chineseNameLC.includes('山') || 
      chineseNameLC.includes('岭') || 
      chineseNameLC.includes('峰') ||
      chineseNameLC.includes('高原') ||
      chineseNameLC.includes('坪') ||
      chineseNameLC.includes('岗')) {
    return true;
  }
  
  // Check description for mountain references
  if (location.description) {
    const descriptionLC = location.description.toLowerCase();
    if (descriptionLC.includes('mountain') || 
        descriptionLC.includes('elevation') ||
        descriptionLC.includes('altitude') ||
        descriptionLC.includes('高山') ||
        descriptionLC.includes('海拔')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate a weighted score that considers SIQS, distance, and location type
 */
export function calculateLocationScore(
  location: SharedAstroSpot, 
  isMountain: boolean
): number {
  const siqs = location.siqs || 0;
  const distance = location.distance || 0;
  
  // Base score heavily weighted toward SIQS
  let score = siqs * 3;
  
  // Penalize for distance (but not as much as we reward for SIQS)
  score -= (distance / 500);
  
  // Boost mountain locations
  if (isMountain) {
    score += 1.5;
  }
  
  return score;
}
