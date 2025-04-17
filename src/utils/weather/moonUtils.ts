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
 * Calculate the duration of moonless night
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param date Date to calculate for
 * @returns Duration in hours
 */
export function calculateMoonlessNightDuration(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): number {
  // In a real implementation, this would calculate based on astronomy formulas
  // For this simplified version, we'll return a reasonable estimate
  const month = date.getMonth();
  const moonPhase = getMoonPhase(date);
  
  // Near new moon, we have longer moonless nights
  if (moonPhase < 0.1 || moonPhase > 0.9) {
    return 8 + Math.random() * 2; // 8-10 hours
  } 
  // First/last quarter
  else if (moonPhase > 0.2 && moonPhase < 0.3 || moonPhase > 0.7 && moonPhase < 0.8) {
    return 4 + Math.random() * 2; // 4-6 hours
  }
  // Full moon period has minimal moonless time
  else if (moonPhase > 0.45 && moonPhase < 0.55) {
    return 1 + Math.random() * 2; // 1-3 hours
  }
  // Other phases
  else {
    return 3 + Math.random() * 3; // 3-6 hours
  }
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
 * Simple moon phase calculation from date
 * Returns value 0-1 where 0 = new moon, 0.5 = full moon, 1 = new moon
 */
function getMoonPhase(date: Date): number {
  // Simplified calculation - in real use, use more precise algorithm
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Simplified algorithm - returns approximate phase
  const c = Math.floor((year - 1900) / 19) * 19;
  const a = Math.floor((14 - month) / 12);
  const y = year - a;
  const m = month + 12 * a - 2;
  const d = (day + y + Math.floor(y / 4) - Math.floor(y / 100) + 
             Math.floor(y / 400) + Math.floor((31 * m) / 12)) % 30;
  
  return d / 29.53; // Normalize to 0-1
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
