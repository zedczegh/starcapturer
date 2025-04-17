
// Moon phase utility functions

/**
 * Information about moonless nights
 */
export interface MoonlessNightInfo {
  date: Date;
  durationHours: number;
  moonPhase: number;
  sunrise: Date;
  sunset: Date;
  moonrise: Date | null;
  moonset: Date | null;
}

/**
 * Get the next moonless night for a location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Promise resolving to moonless night info
 */
export async function getNextMoonlessNight(
  latitude: number,
  longitude: number
): Promise<MoonlessNightInfo | null> {
  // For now, generate a dummy moonless night
  // In a real implementation, this would use astronomical calculations
  
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  
  // Dummy data - in reality would be calculated based on location and date
  return {
    date: tomorrow,
    durationHours: 6.5,
    moonPhase: 0.1, // New moon
    sunrise: new Date(tomorrow.setHours(6, 30, 0, 0)),
    sunset: new Date(tomorrow.setHours(19, 45, 0, 0)),
    moonrise: null, // During new moon, might not be visible during night
    moonset: new Date(tomorrow.setHours(18, 15, 0, 0))
  };
}

/**
 * Get moonless nights for the next N days
 */
export async function getMoonlessNightsForPeriod(
  latitude: number,
  longitude: number,
  days: number = 30
): Promise<MoonlessNightInfo[]> {
  // Simplified implementation
  const results: MoonlessNightInfo[] = [];
  
  // Generate some dummy data
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    // Only include nights with good moon conditions (near new moon)
    const moonPhase = (i % 30) / 30; // Simulate 30-day cycle
    
    if (moonPhase < 0.2 || moonPhase > 0.8) {
      const hours = 4 + Math.random() * 3;
      
      results.push({
        date,
        durationHours: hours,
        moonPhase,
        sunrise: new Date(date.setHours(6, 0, 0, 0)),
        sunset: new Date(date.setHours(20, 0, 0, 0)),
        moonrise: moonPhase < 0.2 ? null : new Date(date.setHours(23, 0, 0, 0)),
        moonset: moonPhase < 0.2 ? new Date(date.setHours(18, 0, 0, 0)) : null
      });
    }
  }
  
  return results;
}
