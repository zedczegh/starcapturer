
/**
 * Check if a location is on water based on coordinates
 * This is a simplified placeholder implementation
 */
export function isWaterLocation(latitude: number, longitude: number): boolean {
  // This would typically use more sophisticated checks, potentially with API calls
  // For now, this is a very simplified placeholder
  
  // Known ocean coordinates (very simplified check)
  const oceanCoordinates = [
    // Pacific Ocean general area
    { minLat: -60, maxLat: 60, minLng: 100, maxLng: -100 },
    // Atlantic Ocean general area
    { minLat: -60, maxLat: 60, minLng: -90, maxLng: 0 },
    // Indian Ocean general area
    { minLat: -60, maxLat: 30, minLng: 20, maxLng: 100 }
  ];
  
  // Check against major land masses (very simplified)
  const landMasses = [
    // North America
    { minLat: 15, maxLat: 85, minLng: -170, maxLng: -50 },
    // South America
    { minLat: -60, maxLat: 15, minLng: -85, maxLng: -30 },
    // Europe
    { minLat: 35, maxLat: 75, minLng: -10, maxLng: 40 },
    // Asia
    { minLat: 0, maxLat: 80, minLng: 40, maxLng: 180 },
    // Africa
    { minLat: -40, maxLat: 40, minLng: -20, maxLng: 55 },
    // Australia
    { minLat: -50, maxLat: -10, minLng: 110, maxLng: 155 }
  ];
  
  // Normalize longitude to -180 to 180 range
  let normLng = longitude;
  while (normLng > 180) normLng -= 360;
  while (normLng < -180) normLng += 360;
  
  // First check if it's on a known land mass
  for (const land of landMasses) {
    if (
      latitude >= land.minLat && 
      latitude <= land.maxLat && 
      normLng >= land.minLng && 
      normLng <= land.maxLng
    ) {
      return false; // On land
    }
  }
  
  // Then check if it's in a known ocean area
  for (const ocean of oceanCoordinates) {
    if (
      latitude >= ocean.minLat && 
      latitude <= ocean.maxLat && 
      normLng >= ocean.minLng && 
      normLng <= ocean.maxLng
    ) {
      return true; // In ocean
    }
  }
  
  // Default to not water if we can't determine
  return false;
}

/**
 * Check if a location name suggests it's a water body
 */
export function isWaterByName(name: string): boolean {
  if (!name) return false;
  
  const waterKeywords = [
    'sea', 'ocean', 'lake', 'river', 'pond', 'bay', 'gulf', 'strait', 'channel',
    '海', '湖', '河', '湾', '江', '水库', '水域'
  ];
  
  const lowerName = name.toLowerCase();
  
  return waterKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()));
}
