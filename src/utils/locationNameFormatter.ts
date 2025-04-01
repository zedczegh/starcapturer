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
