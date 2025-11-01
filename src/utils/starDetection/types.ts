/**
 * Shared types for star detection system
 */

export interface DetectedStar {
  x: number;
  y: number;
  brightness: number;
  size: number;
  color: { r: number; g: number; b: number };
  signal: number; // Signal-to-noise ratio
  confidence: number; // Detection confidence (0-1)
  type: 'point' | 'extended' | 'saturated'; // Star classification
}

export interface StarDetectionSettings {
  threshold: number; // Brightness threshold (0-255)
  minStarSize: number; // Minimum star size in pixels
  maxStarSize: number; // Maximum star size in pixels
  sigma: number; // Gaussian blur sigma for noise reduction
  sensitivity: number; // Detection sensitivity (0-1)
}

export const DEFAULT_SETTINGS: StarDetectionSettings = {
  threshold: 8,
  minStarSize: 0.5,
  maxStarSize: 50,
  sigma: 0.5,
  sensitivity: 0.6
};

export interface BackgroundStats {
  median: number;
  mad: number;
  mean: number;
}

export interface RawDetection {
  x: number;
  y: number;
  value: number;
  color: { r: number; g: number; b: number };
  confidence: number;
  type: 'point' | 'extended' | 'saturated';
}
