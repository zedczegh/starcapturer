
/**
 * Clear sky rate utility functions with performance optimizations
 */

// Cache for expensive calculations
const clearSkyCalculationCache = new Map<string, {
  result: any;
  timestamp: number;
  validFor: number;
}>();

/**
 * Get month name based on number and language
 * @param month Month number (1-12)
 * @param language Language code ('en' or 'zh')
 * @returns Month name in the specified language
 */
export function getMonthName(month: number, language: string = 'en'): string {
  const cacheKey = `month_${month}_${language}`;
  
  // Check cache
  const cached = clearSkyCalculationCache.get(cacheKey);
  if (cached) {
    return cached.result;
  }
  
  let result: string;
  
  if (language === 'zh') {
    const chineseMonths = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    result = chineseMonths[month - 1];
  } else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    result = months[month - 1];
  }
  
  // Cache result indefinitely (month names don't change)
  clearSkyCalculationCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
    validFor: Infinity
  });
  
  return result;
}

/**
 * Get color based on clear sky rate
 * @param rate Clear sky rate percentage
 * @returns CSS color class
 */
export function getRateColor(rate: number): string {
  const cacheKey = `rate_color_${Math.round(rate)}`;
  
  // Check cache
  const cached = clearSkyCalculationCache.get(cacheKey);
  if (cached) {
    return cached.result;
  }
  
  let result: string;
  
  if (rate >= 80) result = 'text-green-500';
  else if (rate >= 60) result = 'text-emerald-400';
  else if (rate >= 40) result = 'text-yellow-400';
  else if (rate >= 20) result = 'text-amber-500';
  else result = 'text-red-500';
  
  // Cache result indefinitely (color assignments don't change)
  clearSkyCalculationCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
    validFor: Infinity
  });
  
  return result;
}

/**
 * Get human-readable rating for clear sky rate
 * @param rate Clear sky rate percentage
 * @param t Translation function
 * @returns Human-readable rating
 */
export function getSkyRating(rate: number, t: (en: string, zh: string) => string): string {
  const cacheKey = `sky_rating_${Math.round(rate)}`;
  
  // Check cache (without translation)
  const cached = clearSkyCalculationCache.get(cacheKey);
  if (cached) {
    const { en, zh } = cached.result;
    return t(en, zh);
  }
  
  let en: string;
  let zh: string;
  
  if (rate >= 80) {
    en = "Excellent";
    zh = "极佳";
  } else if (rate >= 60) {
    en = "Good";
    zh = "良好";
  } else if (rate >= 40) {
    en = "Average";
    zh = "一般";
  } else if (rate >= 20) {
    en = "Poor";
    zh = "较差";
  } else {
    en = "Very Poor";
    zh = "很差";
  }
  
  // Cache result indefinitely (rating thresholds don't change)
  clearSkyCalculationCache.set(cacheKey, {
    result: { en, zh },
    timestamp: Date.now(),
    validFor: Infinity
  });
  
  return t(en, zh);
}

/**
 * Calculate minimum number of clear nights per year
 * Enhanced to provide more accurate estimates based on location and climate data
 * This specifically targets nights when stars are actually visible (not just precipitation-free)
 * @param clearSkyRate Annual clear sky rate percentage
 * @param latitude Location latitude for seasonal adjustments
 * @param longitude Location longitude for regional climate patterns
 * @returns Estimated number of clear nights for star-viewing
 */
export function getMinimumClearNights(
  clearSkyRate: number, 
  latitude?: number,
  longitude?: number
): number {
  const cacheKey = `clear_nights_${Math.round(clearSkyRate)}_${latitude ? Math.round(latitude) : 'null'}_${longitude ? Math.round(longitude) : 'null'}`;
  
  // Check cache
  const cached = clearSkyCalculationCache.get(cacheKey);
  if (cached) {
    return cached.result;
  }
  
  // Star visibility requires truly clear skies - not just rain-free
  // We apply a stricter conversion factor to get from general clear sky rate to actual star-visible nights
  
  // Calculate baseline clear nights, with stricter multiplier (0.65 instead of previously higher values)
  // This accounts for nights that may be technically "clear" but have haze, light cloud cover, etc.
  let baseNights = Math.round((clearSkyRate / 100) * 365 * 0.65);
  
  // Apply adjustments based on region and climate patterns
  let clearNights = baseNights;
  
  if (latitude !== undefined && longitude !== undefined) {
    // Apply region-specific adjustments
    
    // Guizhou province (China) adjustment - known for more overcast days and high humidity
    // Approximate coordinates: latitude 24.5-29, longitude 104-109.5
    if (latitude >= 24.5 && latitude <= 29 && longitude >= 104 && longitude <= 109.5) {
      // Adjust for Guizhou's karst topography, subtropical monsoon climate, and frequent fog/mist
      // This region is known for its high humidity, persistent haze, and light pollution
      clearNights = Math.round(baseNights * 0.55); // Significantly reduced for more accuracy
    }
    // Southern China adjustment (more rainfall/humidity/haze)
    else if (latitude > 20 && latitude < 35 && longitude > 100 && longitude < 120) {
      clearNights = Math.round(baseNights * 0.7); // Reduced factor
    }
    // Desert regions adjustment (typically more clear nights, but can have dust)
    else if (isDesertRegion(latitude, longitude)) {
      // Desert areas have fewer clouds but can have dust storms and atmospheric particles
      clearNights = Math.round(baseNights * 0.9); // Slightly reduced factor
    }
    // Tropical rainforest regions (high precipitation, humidity)
    else if (isTropicalRainforestRegion(latitude, longitude)) {
      clearNights = Math.round(baseNights * 0.6); // Reduced dramatically
    }
    // Mediterranean climate regions (dry summers, wet winters)
    else if (isMediterraneanRegion(latitude, longitude)) {
      // These regions have very seasonal clear nights
      clearNights = Math.round(baseNights * 0.85);
    }
    // Polar/sub-polar regions
    else if (Math.abs(latitude) > 60) {
      // Fewer observable nights in polar regions due to extended daylight periods
      // and often challenging weather conditions
      const polarAdjustment = Math.max(0.2, 0.8 - (Math.abs(latitude) - 60) / 50);
      clearNights = Math.round(baseNights * polarAdjustment);
    }
    
    // Urban light pollution adjustment - apply if coordinates likely match urban areas
    // Major urban areas are typically at very specific coordinates
    // We check for proximity to common urban center locations
    if (isLikelyUrbanArea(latitude, longitude)) {
      // Light pollution dramatically reduces visible stars
      clearNights = Math.round(clearNights * 0.75);
    }
  }
  
  // Further latitude-based seasonal adjustments
  if (latitude !== undefined) {
    const absLat = Math.abs(latitude);
    
    // Mid-latitude regions have more seasonal variations
    if (absLat > 30 && absLat < 60) {
      // Adjust for stronger seasonal effects in mid-latitudes
      clearNights = Math.round(clearNights * 0.9);
    }
  }
  
  // Air quality/pollution adjustments where specific data is available
  // For specific countries known for air quality issues
  if (latitude !== undefined && longitude !== undefined) {
    // China, India, and parts of Southeast Asia often have air quality issues
    // that affect star visibility even on "clear" nights
    if ((latitude > 20 && latitude < 45 && longitude > 75 && longitude < 135) || // China, East Asia
        (latitude > 8 && latitude < 35 && longitude > 70 && longitude < 90)) {   // India
      clearNights = Math.round(clearNights * 0.8); // Reduction for air quality impact
    }
  }
  
  // Ensure the result is within reasonable bounds
  // Even the best locations rarely have more than 250 truly clear nights for star visibility
  clearNights = Math.max(20, Math.min(clearNights, 250)); 
  
  // Cache result with a month validity
  clearSkyCalculationCache.set(cacheKey, {
    result: clearNights,
    timestamp: Date.now(),
    validFor: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
  
  return clearNights;
}

/**
 * Determine if coordinates are likely in or near an urban area
 * Used to factor in light pollution effects on star visibility
 */
function isLikelyUrbanArea(latitude: number, longitude: number): boolean {
  // This is a simplified approach - in a real system we would use a database 
  // of urban boundaries or light pollution maps
  
  // Check proximity to major urban centers globally
  const majorCities = [
    // Asia
    {lat: 31.22, lon: 121.47, radius: 80}, // Shanghai
    {lat: 39.90, lon: 116.40, radius: 80}, // Beijing
    {lat: 23.12, lon: 113.26, radius: 70}, // Guangzhou
    {lat: 22.54, lon: 114.06, radius: 60}, // Shenzhen
    {lat: 35.68, lon: 139.76, radius: 80}, // Tokyo
    {lat: 37.56, lon: 126.98, radius: 60}, // Seoul
    {lat: 19.07, lon: 72.87, radius: 70},  // Mumbai
    {lat: 28.61, lon: 77.20, radius: 70},  // Delhi
    
    // Europe
    {lat: 51.50, lon: -0.12, radius: 70},  // London
    {lat: 48.85, lon: 2.35, radius: 60},   // Paris
    {lat: 52.52, lon: 13.40, radius: 60},  // Berlin
    
    // North America
    {lat: 40.71, lon: -74.00, radius: 80}, // New York
    {lat: 34.05, lon: -118.24, radius: 80}, // Los Angeles
    {lat: 41.87, lon: -87.62, radius: 70}, // Chicago
    
    // South America
    {lat: -23.55, lon: -46.63, radius: 70}, // São Paulo
    {lat: -34.60, lon: -58.38, radius: 60}, // Buenos Aires
    
    // Africa
    {lat: 30.04, lon: 31.23, radius: 60},  // Cairo
    {lat: -33.92, lon: 18.42, radius: 60}, // Cape Town
    
    // Oceania
    {lat: -33.86, lon: 151.20, radius: 60}, // Sydney
    {lat: -37.81, lon: 144.96, radius: 60}, // Melbourne
  ];
  
  // Calculate distance to nearest city
  for (const city of majorCities) {
    const distance = calculateDistance(latitude, longitude, city.lat, city.lon);
    // If within radius of influence for light pollution
    if (distance <= city.radius) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate great-circle distance between two points
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Determine if coordinates are in a desert region
 */
function isDesertRegion(latitude: number, longitude: number): boolean {
  // Major desert regions of the world
  
  // Sahara Desert
  if (latitude >= 15 && latitude <= 35 && longitude >= -15 && longitude <= 35) {
    return true;
  }
  
  // Arabian Desert
  if (latitude >= 15 && latitude <= 30 && longitude >= 35 && longitude <= 60) {
    return true;
  }
  
  // Gobi Desert
  if (latitude >= 40 && latitude <= 45 && longitude >= 90 && longitude <= 120) {
    return true;
  }
  
  // Australian Deserts
  if (latitude <= -20 && latitude >= -30 && longitude >= 120 && longitude <= 140) {
    return true;
  }
  
  // Southwestern US Deserts
  if (latitude >= 30 && latitude <= 40 && longitude >= -120 && longitude <= -100) {
    return true;
  }
  
  // Atacama Desert
  if (latitude >= -30 && latitude <= -20 && longitude >= -72 && longitude <= -68) {
    return true;
  }
  
  return false;
}

/**
 * Determine if coordinates are in a tropical rainforest region
 */
function isTropicalRainforestRegion(latitude: number, longitude: number): boolean {
  // Must be in tropical latitudes
  if (Math.abs(latitude) > 23.5) {
    return false;
  }
  
  // Amazon Rainforest
  if (latitude >= -20 && latitude <= 5 && longitude >= -75 && longitude <= -45) {
    return true;
  }
  
  // Congo Rainforest
  if (latitude >= -5 && latitude <= 5 && longitude >= 10 && longitude <= 30) {
    return true;
  }
  
  // Southeast Asian Rainforests
  if (latitude >= -10 && latitude <= 10 && longitude >= 95 && longitude <= 150) {
    return true;
  }
  
  return false;
}

/**
 * Determine if coordinates are in a Mediterranean climate region
 */
function isMediterraneanRegion(latitude: number, longitude: number): boolean {
  // Mediterranean Basin
  if (latitude >= 30 && latitude <= 45 && longitude >= -10 && longitude <= 40) {
    return true;
  }
  
  // California
  if (latitude >= 32 && latitude <= 42 && longitude >= -124 && longitude <= -115) {
    return true;
  }
  
  // Chile
  if (latitude >= -40 && latitude <= -30 && longitude >= -75 && longitude <= -70) {
    return true;
  }
  
  // Cape Town region
  if (latitude >= -35 && latitude <= -30 && longitude >= 15 && longitude <= 25) {
    return true;
  }
  
  // Southwest and South Australia
  if (latitude >= -38 && latitude <= -32 && longitude >= 115 && longitude <= 140) {
    return true;
  }
  
  return false;
}

/**
 * Get best months for observation based on monthly rates
 * @param monthlyRates Monthly clear sky rates
 * @param clearestMonths Array of clearest months
 * @param language Language code ('en' or 'zh')
 * @param latitude Optional latitude for hemisphere-specific text
 * @returns Formatted text describing best months
 */
export function getBestMonths(
  monthlyRates: Record<string, number>,
  clearestMonths: string[],
  language: string,
  latitude?: number
): string {
  const cacheKey = `best_months_${JSON.stringify(monthlyRates)}_${clearestMonths.join(',')}_${language}_${latitude || 0}`;
  
  // Check cache
  const cached = clearSkyCalculationCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < cached.validFor)) {
    return cached.result;
  }
  
  let result: string;
  
  // If we have monthly rates, use them to determine best months
  if (Object.keys(monthlyRates).length > 0) {
    // Find months with highest rates
    const sortedMonths = Object.entries(monthlyRates)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([month]) => getMonthName(parseInt(month), language));
    
    if (language === 'zh') {
      result = `最佳观测月份: ${sortedMonths.join('、')}`;
    } else {
      result = `Best months: ${sortedMonths.join(', ')}`;
    }
  } 
  // Otherwise use provided clearest months if available
  else if (clearestMonths.length > 0) {
    // Convert month names if needed
    const formattedMonths = clearestMonths.map(month => {
      const monthNum = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
        .findIndex(m => month.toLowerCase().includes(m));
      
      if (monthNum >= 0 && language === 'zh') {
        return getMonthName(monthNum + 1, 'zh');
      }
      return month;
    });
    
    if (language === 'zh') {
      result = `最佳观测月份: ${formattedMonths.join('、')}`;
    } else {
      result = `Best months: ${formattedMonths.join(', ')}`;
    }
  } 
  // Default to seasonal pattern based on hemisphere
  else {
    const isNorthern = latitude === undefined || latitude >= 0;
    
    if (language === 'zh') {
      result = isNorthern ? 
        '北半球一般冬季晴空率高于夏季' : 
        '南半球一般夏季晴空率高于冬季';
    } else {
      result = isNorthern ? 
        'Northern hemisphere typically has clearer skies in winter than summer' : 
        'Southern hemisphere typically has clearer skies in summer than winter';
    }
  }
  
  // Cache result for a day
  clearSkyCalculationCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
    validFor: 24 * 60 * 60 * 1000 // 1 day
  });
  
  return result;
}

/**
 * Clear caches to free memory
 */
export function clearCaches(): void {
  clearSkyCalculationCache.clear();
}
