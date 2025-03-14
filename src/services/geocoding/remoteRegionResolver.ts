
/**
 * Service for identifying and handling remote regions with specific Bortle scale needs
 * Focuses on regions like Tibet, Xinjiang, Inner Mongolia, etc.
 */

/**
 * Check if coordinates are in a remote region that needs special handling
 */
export function identifyRemoteRegion(latitude: number, longitude: number): boolean {
  // Tibet
  if (latitude > 27 && latitude < 35 && longitude > 79 && longitude < 97) {
    return true;
  }
  
  // Xinjiang
  if (latitude > 35 && latitude < 48 && longitude > 75 && longitude < 95) {
    return true;
  }
  
  // Inner Mongolia
  if (latitude > 38 && latitude < 46 && longitude > 105 && longitude < 125) {
    return true;
  }
  
  // Northeast China
  if (latitude > 40 && latitude < 54 && longitude > 120 && longitude < 135) {
    return true;
  }
  
  // Qinghai
  if (latitude > 32 && latitude < 39 && longitude > 90 && longitude < 103) {
    return true;
  }
  
  // Gansu western regions
  if (latitude > 36 && latitude < 43 && longitude > 94 && longitude < 104) {
    return true;
  }
  
  // Western Sichuan
  if (latitude > 28 && latitude < 34 && longitude > 97 && longitude < 103) {
    return true;
  }
  
  return false;
}

/**
 * Enhances remote location names with regional context
 */
export function enhanceRemoteLocationName(
  latitude: number, 
  longitude: number, 
  locationName: string | null, 
  language: string
): string {
  if (!locationName) {
    // Generate default name based on region
    
    // Tibet
    if (latitude > 27 && latitude < 35 && longitude > 79 && longitude < 97) {
      return language === 'en' ? "Tibetan Plateau" : "西藏高原";
    }
    
    // Xinjiang
    if (latitude > 35 && latitude < 48 && longitude > 75 && longitude < 95) {
      return language === 'en' ? "Xinjiang Region" : "新疆地区";
    }
    
    // Inner Mongolia
    if (latitude > 38 && latitude < 46 && longitude > 105 && longitude < 125) {
      return language === 'en' ? "Inner Mongolia" : "内蒙古";
    }
    
    // Northeast China
    if (latitude > 40 && latitude < 54 && longitude > 120 && longitude < 135) {
      return language === 'en' ? "Northeast China" : "中国东北";
    }
    
    // Qinghai
    if (latitude > 32 && latitude < 39 && longitude > 90 && longitude < 103) {
      return language === 'en' ? "Qinghai Province" : "青海省";
    }
    
    // Default
    return language === 'en' 
      ? `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`
      : `位置在 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  }
  
  // Check if the location name already includes the region name
  const lowercaseName = locationName.toLowerCase();
  
  // For Tibet
  if (latitude > 27 && latitude < 35 && longitude > 79 && longitude < 97) {
    if (!lowercaseName.includes('tibet') && !lowercaseName.includes('西藏')) {
      return language === 'en' 
        ? `${locationName}, Tibet, China`
        : `${locationName}，西藏，中国`;
    }
  }
  
  // For Xinjiang
  if (latitude > 35 && latitude < 48 && longitude > 75 && longitude < 95) {
    if (!lowercaseName.includes('xinjiang') && !lowercaseName.includes('新疆')) {
      return language === 'en' 
        ? `${locationName}, Xinjiang, China`
        : `${locationName}，新疆，中国`;
    }
  }
  
  // For Inner Mongolia
  if (latitude > 38 && latitude < 46 && longitude > 105 && longitude < 125) {
    if (!lowercaseName.includes('inner mongolia') && !lowercaseName.includes('内蒙古')) {
      return language === 'en' 
        ? `${locationName}, Inner Mongolia, China`
        : `${locationName}，内蒙古，中国`;
    }
  }
  
  // Return original name if no enhancement needed
  return locationName;
}

/**
 * Get city specific Bortle scale for key urban areas in remote regions
 * Returns null if not in a specific city area
 */
export function getRemoteCityBortleScale(latitude: number, longitude: number): number | null {
  // Lhasa urban area
  if (latitude > 29.6 && latitude < 29.7 && longitude > 91.0 && longitude < 91.2) {
    return 6.8;
  }
  
  // Shigatse (Xigaze) urban area
  if (latitude > 29.2 && latitude < 29.3 && longitude > 88.8 && longitude < 89.0) {
    return 6.2;
  }
  
  // Chamdo (Qamdo) urban area
  if (latitude > 31.1 && latitude < 31.2 && longitude > 97.1 && longitude < 97.3) {
    return 5.8;
  }
  
  // Nyingchi urban area
  if (latitude > 29.6 && latitude < 29.7 && longitude > 94.3 && longitude < 94.5) {
    return 5.5;
  }
  
  // Lhoka (Shannan) urban area
  if (latitude > 29.2 && latitude < 29.3 && longitude > 91.7 && longitude < 91.9) {
    return 5.8;
  }
  
  // Nagqu urban area
  if (latitude > 31.4 && latitude < 31.5 && longitude > 92.0 && longitude < 92.1) {
    return 5.5;
  }
  
  // Urumqi urban area
  if (latitude > 43.7 && latitude < 43.9 && longitude > 87.5 && longitude < 87.7) {
    return 7.8;
  }
  
  // Kashgar urban area
  if (latitude > 39.4 && latitude < 39.5 && longitude > 75.9 && longitude < 76.0) {
    return 7.2;
  }
  
  // Hohhot urban area
  if (latitude > 40.8 && latitude < 40.9 && longitude > 111.7 && longitude < 111.8) {
    return 7.3;
  }
  
  // Harbin urban area
  if (latitude > 45.7 && latitude < 45.9 && longitude > 126.5 && longitude < 126.6) {
    return 7.6;
  }
  
  return null;
}
