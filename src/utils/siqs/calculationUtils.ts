
import { calculateCloudScore, calculateLightPollutionScore } from '@/lib/siqs/factors';
import { extractSiqsDisplayData } from './displayUtils';

/**
 * Extract and format SIQS data consistently across the application
 * @param location Location object with SIQS information
 * @returns An object with formatted SIQS data
 */
export function extractSiqsData(location: any) {
  return extractSiqsDisplayData(location);
}

/**
 * Calculate a basic SIQS score based on cloud cover and light pollution
 * @param cloudCover Percentage of cloud cover (0-100)
 * @param bortleScale Bortle scale for light pollution (1-9)
 * @returns SIQS score on 0-10 scale
 */
export function calculateBasicSiqs(cloudCover: number, bortleScale: number): number {
  // Validate inputs
  const validCloudCover = Math.min(100, Math.max(0, cloudCover));
  const validBortleScale = Math.min(9, Math.max(1, bortleScale));
  
  // Calculate individual scores (0-100 scale)
  const cloudScore = calculateCloudScore(validCloudCover);
  const lightPollutionScore = calculateLightPollutionScore(validBortleScale);
  
  // Define weights
  const cloudWeight = 0.65;
  const lightPollutionWeight = 0.35;
  
  // Calculate weighted final score (0-10 scale)
  const siqs = (cloudScore * cloudWeight + lightPollutionScore * lightPollutionWeight) / 10;
  
  // Ensure score is in 0-10 range
  return Math.min(10, Math.max(0, siqs));
}

/**
 * Get color hex code based on SIQS score
 * @param score SIQS score (0-10)
 * @returns Hex color code
 */
export function getSiqsColor(score: number): string {
  if (score >= 7.5) return '#22c55e'; // Green
  if (score >= 5.0) return '#f59e0b'; // Amber
  if (score >= 2.5) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

/**
 * Format a SIQS score for consistent display
 * @param score Raw SIQS score
 * @returns Formatted string with one decimal place
 */
export function formatSiqs(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(score)) return '0.0';
  return score.toFixed(1);
}
