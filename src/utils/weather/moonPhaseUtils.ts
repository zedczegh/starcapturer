
/**
 * Utility functions for handling moon phase data
 */

/**
 * Normalizes a moon phase value (number or string) to a descriptive string
 */
export const normalizeMoonPhase = (phase: string | number): string => {
  if (typeof phase === 'number') {
    if (phase >= 0 && phase <= 1) {
      if (phase <= 0.05 || phase >= 0.95) return "New Moon";
      if (phase < 0.25) return "Waxing Crescent";
      if (phase < 0.30) return "First Quarter";
      if (phase < 0.45) return "Waxing Gibbous";
      if (phase < 0.55) return "Full Moon";
      if (phase < 0.70) return "Waning Gibbous";
      if (phase < 0.80) return "Last Quarter";
      return "Waning Crescent";
    }
    
    return `Moon Phase ${phase}`;
  }
  
  if (!phase) return "Unknown Phase";
  
  return phase;
};

/**
 * Extended MoonlessNightInfo type to include astronomical night information
 */
export interface ExtendedMoonlessNightInfo {
  duration: number;
  startTime: string;
  endTime: string;
  moonrise: Date | string;
  moonset: Date | string;
  nextNewMoon: string;
  daysUntilNewMoon: number;
  astronomicalNightStart: string;
  astronomicalNightEnd: string;
  astronomicalNightDuration: number;
}
