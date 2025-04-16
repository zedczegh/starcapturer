
/**
 * Calculate moon phase based on date
 * Returns a value between 0 and 1 (0 = new moon, 0.5 = full moon)
 */
export function calculateMoonPhase(): number {
  // Simple approximation based on current date
  // Lunar cycle is approximately 29.53 days
  const date = new Date();
  const lunarCycle = 29.53;
  
  // New Moon on Jan 1, 2021 as reference point
  const referenceDate = new Date(2021, 0, 13);
  
  // Days since reference
  const daysSinceReference = (date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Calculate phase based on lunar cycle
  const phase = (daysSinceReference % lunarCycle) / lunarCycle;
  
  return phase;
}
