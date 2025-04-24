/**
 * Moon phase and visibility utilities for astronomy applications
 */

import { formatTime } from '../astronomy/nightTimeCalculator';
import { calculateAstronomicalNight } from '../astronomy/nightTimeCalculator';

export interface MoonlessNightInfo {
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
  isGoodForAstro: boolean;
  moonPhase: number;
}

/**
 * Calculate the moon phase for a given date
 * Returns a value between 0 and 1, where:
 * 0 = New Moon
 * 0.25 = First Quarter
 * 0.5 = Full Moon
 * 0.75 = Last Quarter
 * 1 = New Moon (next cycle)
 */
export function calculateMoonPhase(date: Date = new Date()): number {
  // Algorithm from "Astronomical Algorithms" by Jean Meeus
  const JD = dateToJulianDate(date);
  
  // Time in Julian centuries since J2000.0
  const T = (JD - 2451545.0) / 36525;
  
  // Mean elongation of the Moon
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000;
  
  // Sun's mean anomaly
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T * T * T / 24490000;
  
  // Moon's mean anomaly
  const M1 = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699 - T * T * T * T / 14712000;
  
  // Moon's argument of latitude
  const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - T * T * T / 3526000 + T * T * T * T / 863310000;
  
  // Normalize to [0, 360)
  const normalizedM1 = ((M1 % 360) + 360) % 360;
  
  // Convert to phase [0, 1)
  return normalizedM1 / 360;
}

/**
 * Calculate the next new moon date after the given date
 */
export function calculateNextNewMoon(date: Date = new Date()): Date {
  const currentPhase = calculateMoonPhase(date);
  
  // Approximate days until next new moon
  // New moon is at phase 0 or 1
  const daysUntilNewMoon = (1 - currentPhase) * 29.53; // 29.53 days is the synodic month
  
  // Create new date for next new moon
  const nextNewMoon = new Date(date);
  nextNewMoon.setDate(date.getDate() + Math.floor(daysUntilNewMoon));
  
  return nextNewMoon;
}

/**
 * Calculate moonrise and moonset times for a given date and location
 */
export function calculateMoonRiseSet(
  date: Date = new Date(),
  latitude: number,
  longitude: number
): { moonrise: Date; moonset: Date } {
  // This is a simplified calculation
  // For more accuracy, a full astronomical algorithm would be needed
  
  // Get the moon phase to estimate rise/set times
  const phase = calculateMoonPhase(date);
  
  // Create a new date object for the calculation
  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);
  
  // Approximate moonrise and moonset based on phase
  // New moon rises and sets with the sun
  // Full moon rises at sunset and sets at sunrise
  
  // Get sunrise and sunset times
  const { sunrise, sunset } = calculateSunriseSunset(date, latitude, longitude);
  
  // Calculate moonrise and moonset based on phase
  let moonrise = new Date(baseDate);
  let moonset = new Date(baseDate);
  
  if (phase < 0.25) {
    // New moon to first quarter - rises in morning to afternoon
    moonrise.setHours(sunrise.getHours() + Math.floor(phase * 24));
    moonset.setHours(sunset.getHours() + Math.floor(phase * 12));
  } else if (phase < 0.5) {
    // First quarter to full moon - rises in afternoon to evening
    moonrise.setHours(12 + Math.floor((phase - 0.25) * 12));
    moonset.setHours(24 + Math.floor((phase - 0.25) * 12));
    if (moonset.getHours() >= 24) {
      moonset.setDate(moonset.getDate() + 1);
      moonset.setHours(moonset.getHours() - 24);
    }
  } else if (phase < 0.75) {
    // Full moon to last quarter - rises in evening to midnight
    moonrise.setHours(18 + Math.floor((phase - 0.5) * 12));
    if (moonrise.getHours() >= 24) {
      moonrise.setDate(moonrise.getDate() + 1);
      moonrise.setHours(moonrise.getHours() - 24);
    }
    moonset.setHours(6 + Math.floor((phase - 0.5) * 12));
    moonset.setDate(moonset.getDate() + 1);
  } else {
    // Last quarter to new moon - rises in midnight to morning
    moonrise.setHours(Math.floor((phase - 0.75) * 12));
    moonrise.setDate(moonrise.getDate() + 1);
    moonset.setHours(12 + Math.floor((phase - 0.75) * 12));
    moonset.setDate(moonset.getDate() + 1);
  }
  
  return { moonrise, moonset };
}

/**
 * Calculate moonless night information with enhanced accuracy
 */
export function calculateMoonlessNight(
  date: Date = new Date(),
  latitude: number,
  longitude: number
): MoonlessNightInfo {
  // Get basic astronomical night times
  const { start: nightStart, end: nightEnd } = calculateAstronomicalNight(latitude, longitude);
  
  // Calculate moon data
  const moonPhase = calculateMoonPhase(date);
  const { moonrise, moonset } = calculateMoonRiseSet(date, latitude, longitude);
  const nextNewMoon = calculateNextNewMoon(date);
  
  const duration = nightEnd.getTime() - nightStart.getTime();
  const durationHours = duration / (1000 * 60 * 60);
  
  // Enhanced calculation for astronomical night
  const astronomicalNightStart = formatTime(nightStart);
  const astronomicalNightEnd = formatTime(nightEnd);
  const astronomicalNightDuration = durationHours;
  
  // Determine if conditions are good for astronomy
  const isGoodForAstro = moonPhase < 0.3 || // New moon phase
    (moonrise > nightEnd || moonset < nightStart); // Moon not visible during night
  
  return {
    duration: durationHours,
    startTime: formatTime(nightStart),
    endTime: formatTime(nightEnd),
    moonrise,
    moonset,
    nextNewMoon: nextNewMoon.toISOString(),
    daysUntilNewMoon: Math.ceil((nextNewMoon.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)),
    astronomicalNightStart,
    astronomicalNightEnd,
    astronomicalNightDuration,
    isGoodForAstro,
    moonPhase
  };
}

/**
 * Convert a JavaScript Date to Julian Date
 */
function dateToJulianDate(date: Date): number {
  const time = date.getTime();
  return (time / 86400000) + 2440587.5;
}

/**
 * Calculate sunrise and sunset times for a given date and location
 */
function calculateSunriseSunset(
  date: Date,
  latitude: number,
  longitude: number
): { sunrise: Date; sunset: Date } {
  // Create copies of the date to avoid mutation
  const sunrise = new Date(date);
  const sunset = new Date(date);
  
  // Get day of year (1-366)
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Calculate solar declination
  const declination = 0.4095 * Math.sin(0.016906 * (dayOfYear - 80.086));
  
  // Calculate sunrise and sunset hour angles
  const latitude_rad = latitude * Math.PI / 180;
  const sunset_hour_angle = Math.acos(-Math.tan(latitude_rad) * Math.tan(declination));
  
  // Convert hour angle to hours
  const sunset_hour = 12 + (sunset_hour_angle * 180 / Math.PI) / 15;
  const sunrise_hour = 12 - (sunset_hour_angle * 180 / Math.PI) / 15;
  
  // Apply longitude correction (4 minutes per degree)
  const longitude_correction = longitude / 15;
  
  // Set sunrise and sunset times
  sunrise.setHours(
    Math.floor(sunrise_hour - longitude_correction),
    Math.round((sunrise_hour - longitude_correction - Math.floor(sunrise_hour - longitude_correction)) * 60),
    0
  );
  
  sunset.setHours(
    Math.floor(sunset_hour - longitude_correction),
    Math.round((sunset_hour - longitude_correction - Math.floor(sunset_hour - longitude_correction)) * 60),
    0
  );
  
  return { sunrise, sunset };
}

/**
 * Get the name of the moon phase
 */
export function getMoonPhaseName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return "New Moon";
  if (phase < 0.22) return "Waxing Crescent";
  if (phase < 0.28) return "First Quarter";
  if (phase < 0.47) return "Waxing Gibbous";
  if (phase < 0.53) return "Full Moon";
  if (phase < 0.72) return "Waning Gibbous";
  if (phase < 0.78) return "Last Quarter";
  return "Waning Crescent";
}

/**
 * Get moon illumination percentage
 */
export function getMoonIllumination(phase: number): number {
  // Convert phase to illumination percentage
  // Full moon (0.5) = 100% illumination
  // New moon (0 or 1) = 0% illumination
  const normalizedPhase = phase > 0.5 ? 1 - phase : phase;
  const illumination = Math.sin(normalizedPhase * Math.PI) * 100;
  return Math.round(illumination);
}

/**
 * Check if the moon phase is good for astronomy
 */
export function isGoodForAstronomy(phase: number): boolean {
  // Best when moon is less than 30% illuminated
  return phase < 0.15 || phase > 0.85;
}
