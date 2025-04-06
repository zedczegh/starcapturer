
/**
 * Atmospheric condition score calculations for SIQS
 */

/**
 * Calculate the seeing conditions factor score
 * @param seeingConditions Seeing conditions (1-5, lower is better)
 * @returns Score on a 0-100 scale
 */
export function calculateSeeingScore(seeingConditions: number): number {
  // Validate input
  if (typeof seeingConditions !== 'number' || isNaN(seeingConditions)) {
    console.warn('Invalid seeing conditions value:', seeingConditions);
    return 60; // Default to moderate score for invalid input
  }
  
  // Ensure seeing scale is within 1-5 range
  const validSeeing = Math.max(1, Math.min(5, seeingConditions));
  
  // Non-linear mapping to represent the impact of seeing conditions
  // Seeing 1 (excellent) = 100, Seeing 5 (poor) = 20
  return Math.round(120 - (validSeeing * 20));
}

/**
 * Calculate the wind speed factor score
 * @param windSpeed Wind speed in km/h
 * @returns Score on a 0-100 scale
 */
export function calculateWindScore(windSpeed: number): number {
  // Validate input
  if (typeof windSpeed !== 'number' || isNaN(windSpeed)) {
    console.warn('Invalid wind speed value:', windSpeed);
    return 70; // Default to moderately good score for invalid input
  }
  
  // Ensure wind speed is not negative
  const validWindSpeed = Math.max(0, windSpeed);
  
  // Wind speed impact calculation
  // 0-5 km/h: Excellent (90-100)
  // 5-15 km/h: Good (70-90)
  // 15-25 km/h: Fair (50-70)
  // 25-35 km/h: Poor (30-50)
  // 35+ km/h: Bad (0-30)
  
  if (validWindSpeed <= 5) return 100 - (validWindSpeed * 2);      // 100-90
  if (validWindSpeed <= 15) return 90 - ((validWindSpeed - 5) * 2);  // 90-70
  if (validWindSpeed <= 25) return 70 - ((validWindSpeed - 15) * 2); // 70-50
  if (validWindSpeed <= 35) return 50 - ((validWindSpeed - 25) * 2); // 50-30
  
  // For wind speeds above 35 km/h, score decreases more rapidly
  return Math.max(0, 30 - ((validWindSpeed - 35) * 3));
}

/**
 * Calculate the humidity factor score
 * @param humidity Humidity percentage (0-100)
 * @returns Score on a 0-100 scale
 */
export function calculateHumidityScore(humidity: number): number {
  // Validate input
  if (typeof humidity !== 'number' || isNaN(humidity)) {
    console.warn('Invalid humidity value:', humidity);
    return 60; // Default to moderate score for invalid input
  }
  
  // Ensure humidity is within 0-100 range
  const validHumidity = Math.max(0, Math.min(100, humidity));
  
  // Humidity impact calculation
  // Very low humidity (0-30%): Very good but can cause dust issues (90-85)
  // Low humidity (30-50%): Excellent (100-90)
  // Moderate humidity (50-70%): Good (90-70)
  // High humidity (70-85%): Fair to poor (70-40)
  // Very high humidity (85-100%): Poor to bad (40-0)
  
  if (validHumidity <= 30) return 85 + ((30 - validHumidity) / 6);       // 85-90 (higher is better but very dry can cause dust issues)
  if (validHumidity <= 50) return 90 + ((50 - validHumidity) / 2.5);     // 90-100
  if (validHumidity <= 70) return 70 + ((70 - validHumidity) / 2.5);     // 70-90
  if (validHumidity <= 85) return 40 + ((85 - validHumidity) * 2);       // 40-70
  
  // For humidity above 85%, score decreases more rapidly
  return Math.max(0, 40 - ((validHumidity - 85) * 2.5));
}
