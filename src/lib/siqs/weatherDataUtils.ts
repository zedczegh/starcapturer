
/**
 * Adjust cloud cover for precipitation and weather conditions
 */
export function getEffectiveCloudCover(cloudCover: number, precipitation?: number, weatherCondition?: string): number {
  let effectiveCloudCover = cloudCover;
  
  // Precipitation implies clouds
  if (precipitation && precipitation > 0) {
    effectiveCloudCover = Math.max(cloudCover, 70);
    
    // Heavy precipitation makes conditions even worse
    if (precipitation > 5) {
      effectiveCloudCover = Math.max(effectiveCloudCover, 90);
    } else if (precipitation > 2) {
      effectiveCloudCover = Math.max(effectiveCloudCover, 80);
    }
  }
  
  // Weather condition can also override cloud cover
  if (weatherCondition) {
    const badConditions = [
      'rain', 'storm', 'thunder', 'snow', 'sleet', 'hail', 'fog', 'mist',
      'drizzle', 'shower', 'overcast', 'heavy'
    ];
    
    const goodConditions = [
      'clear', 'sunny', 'fair'
    ];
    
    const lowerCaseCondition = weatherCondition.toLowerCase();
    
    // Check for bad conditions
    if (badConditions.some(cond => lowerCaseCondition.includes(cond))) {
      effectiveCloudCover = Math.max(effectiveCloudCover, 80);
    }
    
    // Check for good conditions that might override high cloud cover readings
    if (goodConditions.some(cond => lowerCaseCondition.includes(cond))) {
      effectiveCloudCover = Math.min(effectiveCloudCover, 30);
    }
  }
  
  return effectiveCloudCover;
}

/**
 * Create a validation copy of inputs with fallback values
 */
export function validateSiqsInputs(data: any): any {
  return {
    cloudCover: typeof data.cloudCover === 'number' ? data.cloudCover : 50,
    bortleScale: typeof data.bortleScale === 'number' ? data.bortleScale : 5,
    seeingConditions: typeof data.seeingConditions === 'number' ? data.seeingConditions : 3,
    windSpeed: typeof data.windSpeed === 'number' ? data.windSpeed : 10,
    humidity: typeof data.humidity === 'number' ? data.humidity : 50,
    moonPhase: typeof data.moonPhase === 'number' ? data.moonPhase : 0.5,
    precipitation: typeof data.precipitation === 'number' ? data.precipitation : 0,
    aqi: typeof data.aqi === 'number' ? data.aqi : undefined,
    clearSkyRate: typeof data.clearSkyRate === 'number' ? data.clearSkyRate : undefined
  };
}

/**
 * Determine if weather conditions are suitable for astrophotography
 */
export function isWeatherSuitableForAstro(
  cloudCover: number, 
  precipitation?: number, 
  weatherCondition?: string,
  windSpeed?: number,
  humidity?: number
): boolean {
  // Get effective cloud cover considering all factors
  const effectiveCloudCover = getEffectiveCloudCover(cloudCover, precipitation, weatherCondition);
  
  // Cloud cover threshold
  if (effectiveCloudCover > 60) {
    return false;
  }
  
  // Precipitation threshold
  if (precipitation && precipitation > 0.5) {
    return false;
  }
  
  // Wind speed threshold for stable imaging
  if (windSpeed && windSpeed > 25) {
    return false;
  }
  
  // High humidity can affect seeing conditions
  if (humidity && humidity > 90) {
    return false;
  }
  
  return true;
}

/**
 * Calculate overall astronomy quality score based on weather
 * on a scale of 0-100
 */
export function calculateAstronomyQuality(
  cloudCover: number,
  bortleScale: number,
  precipitation?: number,
  weatherCondition?: string,
  windSpeed?: number,
  humidity?: number,
  clearSkyRate?: number
): number {
  // Base score from cloud cover (0-50 points)
  const cloudScore = 50 * (1 - (getEffectiveCloudCover(cloudCover, precipitation, weatherCondition) / 100));
  
  // Bortle scale contribution (0-25 points)
  const bortleScore = Math.max(0, 25 * (1 - ((bortleScale - 1) / 8)));
  
  // Wind penalty (0-10 points)
  const windPenalty = windSpeed ? Math.min(10, windSpeed / 3) : 0;
  
  // Humidity penalty (0-5 points)
  const humidityPenalty = humidity ? Math.max(0, (humidity - 60) / 8) : 0;
  
  // Clear sky history bonus (0-10 points)
  const clearSkyBonus = clearSkyRate ? (clearSkyRate / 10) : 0;
  
  // Calculate total score
  const totalScore = cloudScore + bortleScore - windPenalty - humidityPenalty + clearSkyBonus;
  
  // Normalize between 0-100
  return Math.max(0, Math.min(100, totalScore));
}
