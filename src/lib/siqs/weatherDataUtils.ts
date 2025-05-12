
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
    }
  }
  
  // Weather condition can also override cloud cover
  if (weatherCondition) {
    const badConditions = [
      'rain', 'storm', 'thunder', 'snow', 'sleet', 'hail', 'fog'
    ];
    
    if (badConditions.some(cond => 
      weatherCondition.toLowerCase().includes(cond))) {
      effectiveCloudCover = Math.max(effectiveCloudCover, 80);
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
