
import { Language } from "@/services/geocoding/types";

/**
 * Format and clean up location names for display
 * Removes duplicates and unnecessary parts
 */
export function formatLocationName(locationName: string, language: Language = 'en'): string {
  if (!locationName) return language === 'en' ? 'Unknown location' : '未知位置';
  
  // If it contains coordinates, return a friendlier message
  if (locationName.includes('°') || locationName.includes('Location at') || locationName.includes('位置在')) {
    return language === 'en' ? 'Remote area' : '偏远地区';
  }
  
  // Split by commas based on language
  const separator = language === 'en' ? ',' : '，';
  const parts = locationName.split(separator);
  
  // Remove duplicate parts while preserving order
  const uniqueParts = [...new Set(parts.map(p => p.trim()))];
  
  // For long names, use just the first part or first two parts
  if (uniqueParts.length > 3) {
    if (language === 'en') {
      return uniqueParts.slice(0, 2).join(', ');
    } else {
      return uniqueParts.slice(0, 2).join('，');
    }
  }
  
  // For shorter names, keep all parts
  return uniqueParts.join(language === 'en' ? ', ' : '，');
}

/**
 * Extract town name from a longer location string
 */
export function extractTownName(locationName: string, language: Language = 'en'): string {
  if (!locationName) return language === 'en' ? 'Unknown location' : '未知位置';
  
  // If it contains coordinates, return a friendlier message
  if (locationName.includes('°') || locationName.includes('Location at') || locationName.includes('位置在')) {
    return language === 'en' ? 'Remote area' : '偏远地区';
  }
  
  // Split by commas based on language
  const separator = language === 'en' ? ',' : '，';
  const parts = locationName.split(separator);
  
  // Just return the first part as the town name
  if (parts.length > 0) {
    return parts[0].trim();
  }
  
  return locationName;
}

/**
 * Improved location name formatter for PhotoPointCard component
 * Extracts meaningful location names from complex strings
 */
export function extractNearestTownName(
  locationName: string, 
  description: string | undefined, 
  language: Language = 'en'
): string {
  // First check if description contains location info
  if (description) {
    const nearText = language === 'en' ? "near" : "靠近";
    if (description.toLowerCase().includes(nearText.toLowerCase())) {
      const parts = description.split(new RegExp(nearText, 'i'));
      if (parts.length > 1) {
        return parts[1].trim();
      }
    }
  }
  
  // If location name is not coordinates or "Remote area", use it
  if (locationName && 
      !locationName.includes("°") && 
      !locationName.includes("Location at") && 
      !locationName.includes("位置在") &&
      !locationName.includes("Remote area") &&
      !locationName.includes("偏远地区")) {
      
    // Extract just the first part of a comma-separated name
    const separator = language === 'en' ? ',' : '，';
    const parts = locationName.split(separator);
    if (parts.length > 0) {
      return parts[0].trim();
    }
    
    return locationName;
  }
  
  return language === 'en' ? 'Remote area' : '偏远地区';
}
