
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
  
  // Yunnan remote regions
  if (latitude > 22 && latitude < 29 && longitude > 97 && longitude < 106) {
    return true;
  }
  
  // Guizhou remote regions
  if (latitude > 24 && latitude < 29 && longitude > 104 && longitude < 110) {
    return true;
  }
  
  // Guangxi remote regions
  if (latitude > 22 && latitude < 26 && longitude > 104 && longitude < 112) {
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
    
    // Gansu western regions
    if (latitude > 36 && latitude < 43 && longitude > 94 && longitude < 104) {
      return language === 'en' ? "Western Gansu" : "甘肃西部";
    }
    
    // Western Sichuan
    if (latitude > 28 && latitude < 34 && longitude > 97 && longitude < 103) {
      return language === 'en' ? "Western Sichuan" : "四川西部";
    }
    
    // Yunnan remote regions
    if (latitude > 22 && latitude < 29 && longitude > 97 && longitude < 106) {
      return language === 'en' ? "Yunnan Province" : "云南省";
    }
    
    // Guizhou remote regions
    if (latitude > 24 && latitude < 29 && longitude > 104 && longitude < 110) {
      return language === 'en' ? "Guizhou Province" : "贵州省";
    }
    
    // Guangxi remote regions
    if (latitude > 22 && latitude < 26 && longitude > 104 && longitude < 112) {
      return language === 'en' ? "Guangxi Region" : "广西地区";
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
  
  // For Northeast China
  if (latitude > 40 && latitude < 54 && longitude > 120 && longitude < 135) {
    if (!lowercaseName.includes('heilongjiang') && !lowercaseName.includes('jilin') && 
        !lowercaseName.includes('liaoning') && !lowercaseName.includes('黑龙江') && 
        !lowercaseName.includes('吉林') && !lowercaseName.includes('辽宁')) {
      return language === 'en' 
        ? `${locationName}, Northeast China`
        : `${locationName}，中国东北`;
    }
  }
  
  // For Qinghai
  if (latitude > 32 && latitude < 39 && longitude > 90 && longitude < 103) {
    if (!lowercaseName.includes('qinghai') && !lowercaseName.includes('青海')) {
      return language === 'en' 
        ? `${locationName}, Qinghai, China`
        : `${locationName}，青海，中国`;
    }
  }
  
  // For Gansu western regions
  if (latitude > 36 && latitude < 43 && longitude > 94 && longitude < 104) {
    if (!lowercaseName.includes('gansu') && !lowercaseName.includes('甘肃')) {
      return language === 'en' 
        ? `${locationName}, Gansu, China`
        : `${locationName}，甘肃，中国`;
    }
  }
  
  // For Western Sichuan
  if (latitude > 28 && latitude < 34 && longitude > 97 && longitude < 103) {
    if (!lowercaseName.includes('sichuan') && !lowercaseName.includes('四川')) {
      return language === 'en' 
        ? `${locationName}, Western Sichuan, China`
        : `${locationName}，四川西部，中国`;
    }
  }
  
  // For Yunnan remote regions
  if (latitude > 22 && latitude < 29 && longitude > 97 && longitude < 106) {
    if (!lowercaseName.includes('yunnan') && !lowercaseName.includes('云南')) {
      return language === 'en' 
        ? `${locationName}, Yunnan, China`
        : `${locationName}，云南，中国`;
    }
  }
  
  // For Guizhou remote regions
  if (latitude > 24 && latitude < 29 && longitude > 104 && longitude < 110) {
    if (!lowercaseName.includes('guizhou') && !lowercaseName.includes('贵州')) {
      return language === 'en' 
        ? `${locationName}, Guizhou, China`
        : `${locationName}，贵州，中国`;
    }
  }
  
  // For Guangxi remote regions
  if (latitude > 22 && latitude < 26 && longitude > 104 && longitude < 112) {
    if (!lowercaseName.includes('guangxi') && !lowercaseName.includes('广西')) {
      return language === 'en' 
        ? `${locationName}, Guangxi, China`
        : `${locationName}，广西，中国`;
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
  // Tibet region
  if (latitude > 29.6 && latitude < 29.7 && longitude > 91.0 && longitude < 91.2) {
    return 6.8; // Lhasa urban area
  }
  
  if (latitude > 29.2 && latitude < 29.3 && longitude > 88.8 && longitude < 89.0) {
    return 6.2; // Shigatse urban area
  }
  
  if (latitude > 31.1 && latitude < 31.2 && longitude > 97.1 && longitude < 97.3) {
    return 5.8; // Chamdo urban area
  }
  
  if (latitude > 29.6 && latitude < 29.7 && longitude > 94.3 && longitude < 94.5) {
    return 5.5; // Nyingchi urban area
  }
  
  if (latitude > 29.2 && latitude < 29.3 && longitude > 91.7 && longitude < 91.9) {
    return 5.8; // Lhoka (Shannan) urban area
  }
  
  if (latitude > 31.4 && latitude < 31.5 && longitude > 92.0 && longitude < 92.1) {
    return 5.5; // Nagqu urban area
  }
  
  // Xinjiang region
  if (latitude > 43.7 && latitude < 43.9 && longitude > 87.5 && longitude < 87.7) {
    return 7.8; // Urumqi urban area
  }
  
  if (latitude > 39.4 && latitude < 39.5 && longitude > 75.9 && longitude < 76.0) {
    return 7.2; // Kashgar urban area
  }
  
  if (latitude > 42.8 && latitude < 42.9 && longitude > 93.4 && longitude < 93.6) {
    return 6.3; // Hami urban area
  }
  
  if (latitude > 41.7 && latitude < 41.8 && longitude > 82.9 && longitude < 83.0) {
    return 6.8; // Aksu urban area
  }
  
  if (latitude > 43.9 && latitude < 44.0 && longitude > 81.3 && longitude < 81.4) {
    return 6.5; // Yining urban area
  }
  
  // Inner Mongolia region
  if (latitude > 40.8 && latitude < 40.9 && longitude > 111.7 && longitude < 111.8) {
    return 7.3; // Hohhot urban area
  }
  
  if (latitude > 40.6 && latitude < 40.7 && longitude > 109.8 && longitude < 109.9) {
    return 7.4; // Baotou urban area
  }
  
  if (latitude > 39.6 && latitude < 39.7 && longitude > 109.7 && longitude < 109.8) {
    return 6.8; // Ordos urban area
  }
  
  // Northeast China region
  if (latitude > 45.7 && latitude < 45.9 && longitude > 126.5 && longitude < 126.6) {
    return 7.6; // Harbin urban area
  }
  
  if (latitude > 43.8 && latitude < 43.9 && longitude > 125.3 && longitude < 125.4) {
    return 7.5; // Changchun urban area
  }
  
  if (latitude > 41.8 && latitude < 41.9 && longitude > 123.4 && longitude < 123.5) {
    return 7.7; // Shenyang urban area
  }
  
  if (latitude > 47.3 && latitude < 47.4 && longitude > 123.9 && longitude < 124.0) {
    return 6.5; // Qiqihar urban area
  }
  
  if (latitude > 39.9 && latitude < 40.0 && longitude > 124.3 && longitude < 124.4) {
    return 7.0; // Dandong urban area
  }
  
  // Qinghai region
  if (latitude > 36.6 && latitude < 36.7 && longitude > 101.7 && longitude < 101.8) {
    return 7.0; // Xining urban area
  }
  
  if (latitude > 36.4 && latitude < 36.5 && longitude > 94.9 && longitude < 95.0) {
    return 6.2; // Golmud urban area
  }
  
  if (latitude > 37.3 && latitude < 37.4 && longitude > 100.6 && longitude < 100.7) {
    return 5.8; // Delingha urban area
  }
  
  // Gansu region
  if (latitude > 36.0 && latitude < 36.1 && longitude > 103.8 && longitude < 103.9) {
    return 7.2; // Lanzhou urban area
  }
  
  if (latitude > 39.7 && latitude < 39.8 && longitude > 98.4 && longitude < 98.5) {
    return 6.5; // Jiayuguan urban area
  }
  
  if (latitude > 39.1 && latitude < 39.2 && longitude > 94.6 && longitude < 94.7) {
    return 6.0; // Dunhuang urban area
  }
  
  if (latitude > 34.5 && latitude < 34.6 && longitude > 102.9 && longitude < 103.0) {
    return 6.3; // Hezuo urban area
  }
  
  // Western Sichuan
  if (latitude > 30.0 && latitude < 30.1 && longitude > 101.9 && longitude < 102.0) {
    return 6.0; // Kangding urban area
  }
  
  if (latitude > 31.9 && latitude < 32.0 && longitude > 102.2 && longitude < 102.3) {
    return 5.8; // Aba urban area
  }
  
  // Yunnan remote areas
  if (latitude > 27.8 && latitude < 27.9 && longitude > 99.7 && longitude < 99.8) {
    return 5.5; // Shangri-La urban area
  }
  
  if (latitude > 24.9 && latitude < 25.0 && longitude > 101.5 && longitude < 101.6) {
    return 6.8; // Dali urban area
  }
  
  if (latitude > 26.8 && latitude < 26.9 && longitude > 100.2 && longitude < 100.3) {
    return 6.5; // Lijiang urban area
  }
  
  // Guizhou remote areas
  if (latitude > 26.5 && latitude < 26.6 && longitude > 107.8 && longitude < 107.9) {
    return 6.3; // Kaili urban area
  }
  
  if (latitude > 25.8 && latitude < 25.9 && longitude > 107.5 && longitude < 107.6) {
    return 6.0; // Duyun urban area
  }
  
  return null;
}
