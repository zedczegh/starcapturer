
/**
 * Moon-related utility functions
 */

/**
 * Moonless night information
 */
export interface MoonlessNightInfo {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

/**
 * Calculate moonless nights for a location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Array of moonless night information
 */
export function calculateMoonlessNights(
  latitude: number,
  longitude: number
): MoonlessNightInfo[] {
  // Simplified implementation until we have the complete astronomical calculations
  const now = new Date();
  const moonlessNights: MoonlessNightInfo[] = [];
  
  // Create 5 sample moonless nights in the next month
  for (let i = 0; i < 5; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i * 7 + 3); // Sample dates
    
    moonlessNights.push({
      date: date.toISOString().split('T')[0],
      startTime: '22:00',
      endTime: '04:30',
      duration: 6.5
    });
  }
  
  return moonlessNights;
}

/**
 * Calculate the duration of moonless nights (in hours)
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Average duration in hours
 */
export function calculateMoonlessNightDuration(
  latitude: number,
  longitude: number
): number {
  // This is a simplified implementation
  // In a real implementation, we would calculate based on moon phase and location
  
  // For now, return an average moonless night duration
  return 6.5; // 6.5 hours on average
}

/**
 * Calculate darkness score based on moon phase
 * @param moonPhase Moon phase (0-1, 0 = new moon, 0.5 = full moon)
 * @returns Darkness score (0-10)
 */
export function calculateDarknessScore(moonPhase: number): number {
  // Convert phase to position in cycle (0 = new moon, 0.5 = full moon)
  const normalizedPhase = moonPhase < 0.5 ? moonPhase : 1 - moonPhase;
  
  // Score is best (10) at new moon, worst (0) at full moon
  return 10 * (1 - (normalizedPhase * 2));
}

/**
 * Format moon phase description
 */
export function formatMoonPhase(phase: number): string {
  if (phase < 0.05 || phase > 0.95) return "New Moon";
  if (phase < 0.20) return "Waxing Crescent";
  if (phase < 0.30) return "First Quarter";
  if (phase < 0.45) return "Waxing Gibbous";
  if (phase < 0.55) return "Full Moon";
  if (phase < 0.70) return "Waning Gibbous";
  if (phase < 0.80) return "Last Quarter";
  return "Waning Crescent";
}
