
import { MoonPhaseInfo } from "./siqsTypes";

/**
 * Calculate current moon phase
 * @returns Moon phase value between 0 and 1 (0 = new moon, 0.5 = full moon, 1 = next new moon)
 */
export function calculateMoonPhase(): number {
  // Implementation of moon phase calculation
  // This is a simplified calculation suitable for most astronomy purposes
  const now = new Date();
  
  // First new moon of 2023 was on January 21
  const newMoonDate = new Date(2023, 0, 21);
  
  // Lunar cycle is 29.53059 days
  const lunarCycle = 29.53059;
  
  // Calculate days since reference new moon
  const daysSinceNewMoon = (now.getTime() - newMoonDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Calculate phase (0 to 1)
  const phase = (daysSinceNewMoon % lunarCycle) / lunarCycle;
  
  return phase;
}

/**
 * Calculate moonrise and moonset times
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Moonrise and moonset times
 */
export function calculateMoonriseMoonsetTimes(
  latitude: number,
  longitude: number
): { moonrise: string; moonset: string } {
  // This would typically use a proper astronomy library or API
  // For this example, we'll use placeholder values
  
  // Get current date for calculation
  const now = new Date();
  const hours = now.getHours();
  
  // Very simplified moonrise/moonset approximation
  // In reality, this depends on location, date, and moon phase
  let moonriseHour = (hours + 6) % 24;
  let moonsetHour = (hours + 18) % 24;
  
  // Adjust for latitude (crude approximation)
  if (Math.abs(latitude) > 60) {
    // Polar regions have extreme daylight patterns
    if (latitude > 0) { // Northern hemisphere
      // Summer in northern hemisphere
      if (now.getMonth() > 3 && now.getMonth() < 9) {
        moonriseHour = (moonriseHour + 1) % 24;
        moonsetHour = (moonsetHour - 1 + 24) % 24;
      } else {
        moonriseHour = (moonriseHour - 1 + 24) % 24;
        moonsetHour = (moonsetHour + 1) % 24;
      }
    } else { // Southern hemisphere
      // Summer in southern hemisphere
      if (now.getMonth() < 3 || now.getMonth() > 9) {
        moonriseHour = (moonriseHour + 1) % 24;
        moonsetHour = (moonsetHour - 1 + 24) % 24;
      } else {
        moonriseHour = (moonriseHour - 1 + 24) % 24;
        moonsetHour = (moonsetHour + 1) % 24;
      }
    }
  }
  
  // Format times
  const pad = (num: number) => num.toString().padStart(2, '0');
  const moonrise = `${pad(moonriseHour)}:${pad(now.getMinutes())}`;
  const moonset = `${pad(moonsetHour)}:${pad(now.getMinutes())}`;
  
  return { moonrise, moonset };
}

/**
 * Get the date of the next new moon
 * @returns Date of the next new moon
 */
export function getNextNewMoonDate(): Date {
  const now = new Date();
  const moonPhase = calculateMoonPhase();
  
  // Calculate days until next new moon
  // One lunar cycle is 29.53059 days
  const daysUntilNewMoon = (1 - moonPhase) * 29.53059;
  
  // Calculate date of next new moon
  const nextNewMoon = new Date(now);
  nextNewMoon.setDate(now.getDate() + Math.round(daysUntilNewMoon));
  
  return nextNewMoon;
}

/**
 * Get detailed moon phase information
 * @returns Moon phase information object
 */
export function getMoonPhaseInfo(): MoonPhaseInfo {
  const phase = calculateMoonPhase();
  const illumination = calculateMoonIllumination(phase);
  const name = getMoonPhaseName(phase);
  
  return {
    phase,
    illumination,
    name,
    isNewMoon: phase < 0.05 || phase > 0.95,
    isFullMoon: phase > 0.45 && phase < 0.55
  };
}

/**
 * Calculate moon illumination percentage
 * @param phase Moon phase (0-1)
 * @returns Illumination percentage (0-100)
 */
function calculateMoonIllumination(phase: number): number {
  // Convert phase to illumination percentage
  // Phase 0 and 1 = new moon = 0% illumination
  // Phase 0.5 = full moon = 100% illumination
  // In between, it follows roughly a sinusoidal pattern
  
  // Normalize phase to 0-0.5 range (waxing) or 0.5-0 range (waning)
  const normalizedPhase = phase <= 0.5 ? phase : 1 - phase;
  
  // Calculate illumination (simplified model)
  const illumination = Math.sin(Math.PI * normalizedPhase) * 100;
  
  return Math.round(illumination);
}

/**
 * Get the name of the moon phase
 * @param phase Moon phase (0-1)
 * @returns Name of the moon phase
 */
function getMoonPhaseName(phase: number): string {
  if (phase < 0.025 || phase >= 0.975) return "New Moon";
  if (phase < 0.25) return "Waxing Crescent";
  if (phase < 0.275) return "First Quarter";
  if (phase < 0.475) return "Waxing Gibbous";
  if (phase < 0.525) return "Full Moon";
  if (phase < 0.725) return "Waning Gibbous";
  if (phase < 0.775) return "Last Quarter";
  return "Waning Crescent";
}
