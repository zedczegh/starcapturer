
/**
 * Check if a location is on water based on coordinates
 * This is a simplified placeholder implementation
 */
export function isWaterLocation(
  latitude: number, 
  longitude: number, 
  checkCoastline: boolean = true
): boolean {
  // This would typically use more sophisticated checks, potentially with API calls
  // For now, this is a very simplified placeholder
  
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return false;
  }
  
  // Known ocean coordinates (very simplified check)
  const oceanCoordinates = [
    // Pacific Ocean deep water
    { minLat: -50, maxLat: 50, minLng: 150, maxLng: -150, confidence: 0.9 },
    // Atlantic Ocean deep water
    { minLat: -50, maxLat: 50, minLng: -70, maxLng: -20, confidence: 0.9 },
    // Indian Ocean deep water
    { minLat: -50, maxLat: 20, minLng: 40, maxLng: 100, confidence: 0.9 }
  ];
  
  // Normalize longitude to -180 to 180 range
  let normLng = longitude;
  while (normLng > 180) normLng -= 360;
  while (normLng < -180) normLng += 360;
  
  // Check if it's in a known deep ocean area with high confidence
  for (const ocean of oceanCoordinates) {
    if (
      latitude >= ocean.minLat && 
      latitude <= ocean.maxLat && 
      normLng >= ocean.minLng && 
      normLng <= ocean.maxLng
    ) {
      return ocean.confidence > 0.7; // Only return true for high confidence ocean areas
    }
  }
  
  // Default to not water - being cautious about false positives
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
