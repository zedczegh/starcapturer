
/**
 * Utility functions for working with the Bortle scale
 * Optimized for better performance with caching and memoization
 */

// Color mapping cache for performance
const colorCache = new Map<number, any>();

/**
 * Get a user-friendly description of a Bortle scale value
 * @param bortleScale - Bortle scale value (1-9)
 * @param language - Optional language code (en or zh)
 * @returns Description of the Bortle scale value
 */
export function getBortleScaleDescription(bortleScale: number, language: 'en' | 'zh' = 'en'): string {
  // Round to nearest integer for description lookup
  const roundedScale = Math.round(bortleScale);
  
  // English descriptions
  if (language === 'en') {
    switch (roundedScale) {
      case 1: return "Excellent dark-sky site";
      case 2: return "Truly dark site";
      case 3: return "Rural sky";
      case 4: return "Rural/suburban transition";
      case 5: return "Suburban sky";
      case 6: return "Bright suburban sky";
      case 7: return "Suburban/urban transition";
      case 8: return "City sky";
      case 9: return "Inner city sky";
      default: return "Unknown sky quality";
    }
  }
  
  // Chinese descriptions
  switch (roundedScale) {
    case 1: return "极佳的暗夜地点";
    case 2: return "真正的暗夜地点";
    case 3: return "乡村天空";
    case 4: return "乡村/郊区过渡带";
    case 5: return "郊区天空";
    case 6: return "明亮的郊区天空";
    case 7: return "郊区/城市过渡带";
    case 8: return "城市天空";
    case 9: return "城市中心天空";
    default: return "未知天空质量";
  }
}

/**
 * Get the appropriate color for a Bortle scale value
 * @param bortleScale - Bortle scale value (1-9)
 * @returns Object with text, background, and border colors
 */
export function getBortleScaleColor(bortleScale: number): { text: string; bg: string; border: string } {
  // Check cache first for performance
  const cacheKey = Math.round(bortleScale * 10) / 10; // Round to 1 decimal place for caching
  if (colorCache.has(cacheKey)) {
    return colorCache.get(cacheKey);
  }
  
  // Define color scheme based on Bortle scale
  let result;
  
  if (bortleScale <= 1.5) {
    result = { 
      text: "text-indigo-950", 
      bg: "bg-indigo-300", 
      border: "border-indigo-400" 
    };
  } else if (bortleScale <= 2.5) {
    result = { 
      text: "text-blue-950", 
      bg: "bg-blue-300", 
      border: "border-blue-400" 
    };
  } else if (bortleScale <= 3.5) {
    result = { 
      text: "text-cyan-950", 
      bg: "bg-cyan-300", 
      border: "border-cyan-400" 
    };
  } else if (bortleScale <= 4.5) {
    result = { 
      text: "text-teal-950", 
      bg: "bg-teal-300", 
      border: "border-teal-400" 
    };
  } else if (bortleScale <= 5.5) {
    result = { 
      text: "text-green-950", 
      bg: "bg-green-300", 
      border: "border-green-400" 
    };
  } else if (bortleScale <= 6.5) {
    result = { 
      text: "text-yellow-950", 
      bg: "bg-yellow-300", 
      border: "border-yellow-400" 
    };
  } else if (bortleScale <= 7.5) {
    result = { 
      text: "text-orange-950", 
      bg: "bg-orange-300", 
      border: "border-orange-400" 
    };
  } else if (bortleScale <= 8.5) {
    result = { 
      text: "text-red-950", 
      bg: "bg-red-300", 
      border: "border-red-400" 
    };
  } else {
    result = { 
      text: "text-rose-950", 
      bg: "bg-rose-300", 
      border: "border-rose-400" 
    };
  }
  
  // Cache the result
  colorCache.set(cacheKey, result);
  
  return result;
}
