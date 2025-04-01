
/**
 * Get description of Bortle scale value
 * @param bortleScale Bortle scale value (1-9)
 * @returns Description text
 */
export function getBortleScaleDescription(bortleScale: number, language: string = 'en'): string {
  if (language === 'zh') {
    // Chinese descriptions
    switch (bortleScale) {
      case 1: return '极黑暗的天空';
      case 2: return '真正的黑暗天空';
      case 3: return '乡村天空';
      case 4: return '乡村/郊区过渡天空';
      case 5: return '郊区天空';
      case 6: return '明亮的郊区天空';
      case 7: return '郊区/城市过渡天空';
      case 8: return '城市天空';
      case 9: return '市中心天空';
      default: return '未知';
    }
  } else {
    // English descriptions
    switch (bortleScale) {
      case 1: return 'Excellent dark-sky site';
      case 2: return 'Truly dark site';
      case 3: return 'Rural sky';
      case 4: return 'Rural/suburban transition';
      case 5: return 'Suburban sky';
      case 6: return 'Bright suburban sky';
      case 7: return 'Suburban/urban transition';
      case 8: return 'City sky';
      case 9: return 'Inner-city sky';
      default: return 'Unknown';
    }
  }
}

/**
 * Get color for Bortle scale value
 * @param bortleScale Bortle scale value (1-9)
 * @returns Tailwind CSS color class
 */
export function getBortleScaleColor(bortleScale: number): string {
  switch (bortleScale) {
    case 1: return 'text-indigo-400';
    case 2: return 'text-blue-400';
    case 3: return 'text-cyan-400';
    case 4: return 'text-green-400';
    case 5: return 'text-lime-400';
    case 6: return 'text-yellow-400';
    case 7: return 'text-amber-400';
    case 8: return 'text-orange-400';
    case 9: return 'text-red-400';
    default: return 'text-gray-400';
  }
}

/**
 * Get Bortle scale data for a location
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Promise with Bortle scale value
 */
export const getBortleScaleValue = async (
  latitude: number, 
  longitude: number
): Promise<number> => {
  // In a real implementation, this would make an API call to a light pollution database
  // For now, return a plausible value based on the coordinates
  
  // Use a simple algorithm based on the coordinates to generate a plausible value
  // This is just for demonstration purposes
  const latAbs = Math.abs(latitude);
  const lonAbs = Math.abs(longitude);
  
  // Generate a value between 1 and 9
  // 1 is extremely dark, 9 is inner city
  // Map values toward mid-range (4-6) with occasional extremes
  const seed = (latAbs + lonAbs) % 10;
  let bortleValue: number;
  
  if (seed < 1) bortleValue = 1; // Very dark (rare)
  else if (seed < 3) bortleValue = 2; // Dark
  else if (seed < 5) bortleValue = 3; // Rural
  else if (seed < 7) bortleValue = 4; // Rural/suburban
  else if (seed < 8.5) bortleValue = 5; // Suburban
  else if (seed < 9.3) bortleValue = 6; // Bright suburban
  else if (seed < 9.7) bortleValue = 7; // Suburban/urban
  else if (seed < 9.9) bortleValue = 8; // City
  else bortleValue = 9; // Inner city (rare)
  
  // Add some randomness within a specific Bortle level
  const randomOffset = Math.random() * 0.5;
  bortleValue = Math.max(1, Math.min(9, bortleValue + randomOffset));
  
  // Round to nearest integer for final Bortle scale value
  return Math.round(bortleValue);
};
