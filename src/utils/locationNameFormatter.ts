
/**
 * Extract the nearest town name from a location string or description
 * @param locationName The full location name
 * @param description Optional location description
 * @param language Current language (en or zh)
 * @returns Extracted nearest town name
 */
export function extractNearestTownName(locationName: string, description?: string, language: string = 'en'): string {
  if (!locationName) return language === 'en' ? 'Unknown location' : '未知位置';
  
  // If locationName is coordinates or default unknown location, try to extract from description
  if (
    locationName.includes('°') || 
    locationName.includes('Location at') ||
    locationName.includes('位置在') ||
    locationName.includes('Unknown location') ||
    locationName.includes('未知位置')
  ) {
    if (description) {
      // Try to extract location name from description
      const nearMatch = description.match(/near ([^,\.]+)/i);
      if (nearMatch && nearMatch[1]) {
        return nearMatch[1].trim();
      }
    }
    return language === 'en' ? 'Remote area' : '偏远地区';
  }
  
  // For normal location names, extract the first part before commas if it's too long
  if (locationName.length > 30 && locationName.includes(',')) {
    return locationName.split(',')[0].trim();
  }
  
  return locationName;
}

/**
 * Format location name for display
 * @param name The full location name
 * @param language Current language (en or zh)
 * @returns Formatted location name
 */
export function formatLocationName(name: string, language: string = 'en'): string {
  return extractNearestTownName(name, undefined, language);
}

/**
 * Get a regional name based on coordinates
 * Placeholder function - in a real implementation, this would use a database
 * of region names or call a geocoding service
 */
export function getRegionalName(latitude: number, longitude: number, language: string = 'en'): string {
  // This is a simplified placeholder implementation
  // In a real app, you would have a more sophisticated algorithm
  // or use a geocoding service
  
  // China regions (very simplified)
  if (latitude > 30 && latitude < 50 && longitude > 100 && longitude < 130) {
    return language === 'en' ? 'Northern China' : '中国北部';
  }
  if (latitude > 20 && latitude < 30 && longitude > 100 && longitude < 120) {
    return language === 'en' ? 'Southern China' : '中国南部';
  }
  
  // United States regions (very simplified)
  if (latitude > 30 && latitude < 50 && longitude > -130 && longitude < -65) {
    return language === 'en' ? 'United States' : '美国';
  }
  
  // Europe regions (very simplified)
  if (latitude > 35 && latitude < 70 && longitude > -10 && longitude < 30) {
    return language === 'en' ? 'Europe' : '欧洲';
  }
  
  return language === 'en' ? 'Remote area' : '偏远地区';
}
