
/**
 * Calculate the current moon phase
 * @returns Moon phase (0-1), where 0 and 1 are new moon, 0.5 is full moon
 */
export function getCurrentMoonPhase(): number {
  // Simple moon phase calculation based on the current date
  // A proper calculation would be more complex, but this serves as a reasonable approximation
  
  // Moon cycle is approximately 29.53 days
  const MOON_CYCLE = 29.53;
  
  // Known new moon date (as reference)
  const REFERENCE_NEW_MOON = new Date('2023-12-12T00:00:00Z');
  
  const now = new Date();
  
  // Calculate days since reference new moon
  const daysSinceReferenceNewMoon = (now.getTime() - REFERENCE_NEW_MOON.getTime()) / (24 * 60 * 60 * 1000);
  
  // Calculate current position in cycle (0-1)
  let phase = (daysSinceReferenceNewMoon % MOON_CYCLE) / MOON_CYCLE;
  
  // Normalize to always be between 0-1
  if (phase < 0) phase += 1;
  
  return phase;
}

/**
 * Get moon phase description
 * @param phase Moon phase value (0-1)
 * @returns Text description of the moon phase
 */
export function getMoonPhaseDescription(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return "New Moon";
  if (phase < 0.22) return "Waxing Crescent";
  if (phase < 0.28) return "First Quarter";
  if (phase < 0.47) return "Waxing Gibbous";
  if (phase < 0.53) return "Full Moon";
  if (phase < 0.72) return "Waning Gibbous";
  if (phase < 0.78) return "Last Quarter";
  return "Waning Crescent";
}
