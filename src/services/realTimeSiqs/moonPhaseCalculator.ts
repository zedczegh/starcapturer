
import { MoonPhaseInfo } from './siqsTypes';

/**
 * Calculate the moon phase for a given date
 * @param date The date to calculate the moon phase for
 * @returns MoonPhaseInfo object
 */
export function calculateMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const synodic = 29.53058867; // Days in a lunar month
  
  // Convert date to Julian date
  const julianDate = dateToJulian(date);
  
  // New Moon date used as reference (2000-01-06 18:14 UTC)
  const newMoonRef = 2451550.1;
  
  // Calculate days since the reference New Moon
  const daysSinceNewMoon = julianDate - newMoonRef;
  
  // Calculate the phase
  const phase = (daysSinceNewMoon % synodic) / synodic;
  
  // Normalize phase to 0-1
  const normalizedPhase = phase < 0 ? phase + 1 : phase;
  
  // Calculate moon illumination (0 at new and full moon, 1 at quarter moons)
  const illumination = calculateIllumination(normalizedPhase);
  
  // Get the name of the moon phase
  const name = getMoonPhaseName(normalizedPhase);
  
  return {
    phase: normalizedPhase,
    illumination,
    name
  };
}

/**
 * Convert a date to Julian date
 */
function dateToJulian(date: Date): number {
  const time = date.getTime();
  return (time / 86400000) + 2440587.5;
}

/**
 * Calculate moon illumination
 */
function calculateIllumination(phase: number): number {
  // Calculate illumination percentage (0-1)
  // At new and full moon, it's fully illuminated (from our perspective)
  // At quarter phases, it's 50% illuminated
  return Math.abs(0.5 - phase) * 2;
}

/**
 * Get the name of the moon phase
 */
function getMoonPhaseName(phase: number): string {
  if (phase < 0.03 || phase >= 0.97) return "New Moon";
  if (phase < 0.22) return "Waxing Crescent";
  if (phase < 0.28) return "First Quarter";
  if (phase < 0.47) return "Waxing Gibbous";
  if (phase < 0.53) return "Full Moon";
  if (phase < 0.72) return "Waning Gibbous";
  if (phase < 0.78) return "Last Quarter";
  return "Waning Crescent";
}

/**
 * Get moon phase name by phase value
 * @param phase Moon phase value (0-1)
 * @returns Moon phase name
 */
export function getMoonPhaseNameByPhase(phase: number): string {
  return getMoonPhaseName(phase);
}

/**
 * Get current moon info
 * @returns Current moon phase information
 */
export function getMoonInfo(): MoonPhaseInfo {
  return calculateMoonPhase(new Date());
}

/**
 * Calculate next new moon date
 * @param date Reference date
 * @returns Date of the next new moon
 */
export function getNextNewMoon(date: Date = new Date()): Date {
  const synodic = 29.53058867; // Days in a lunar month
  const julianDate = dateToJulian(date);
  const newMoonRef = 2451550.1;
  
  const daysSinceNewMoon = julianDate - newMoonRef;
  const phase = (daysSinceNewMoon % synodic) / synodic;
  
  // Calculate days until next new moon
  const daysToNewMoon = synodic * (1 - phase);
  
  // Create new date for next new moon
  const nextNewMoon = new Date(date);
  nextNewMoon.setDate(date.getDate() + Math.round(daysToNewMoon));
  
  return nextNewMoon;
}
