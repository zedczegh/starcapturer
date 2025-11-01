/**
 * Background estimation utilities for star detection
 */
import { getLuminance } from './imageProcessing';
import type { BackgroundStats } from './types';

/**
 * Calculate robust background statistics using median and MAD
 */
export function calculateBackgroundStatistics(imageData: ImageData): BackgroundStats {
  const { data } = imageData;
  const values: number[] = [];

  // Sample every 4th pixel to speed up computation
  for (let i = 0; i < data.length; i += 16) {
    const luminance = getLuminance(data[i], data[i + 1], data[i + 2]);
    values.push(luminance);
  }

  values.sort((a, b) => a - b);
  
  const median = values[Math.floor(values.length / 2)];
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Calculate Median Absolute Deviation (MAD)
  const deviations = values.map(val => Math.abs(val - median));
  deviations.sort((a, b) => a - b);
  const mad = deviations[Math.floor(deviations.length / 2)] * 1.4826; // Scale factor for normal distribution

  return { median, mad, mean };
}

/**
 * Estimate local background color around a point
 */
export function estimateLocalBackground(
  imageData: ImageData, 
  centerX: number, 
  centerY: number, 
  innerRadius: number, 
  outerRadius: number
): { r: number; g: number; b: number } {
  const { data, width, height } = imageData;
  const samples: { r: number; g: number; b: number }[] = [];
  
  // Sample points in annulus between inner and outer radius
  for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
    for (let r = innerRadius; r <= outerRadius; r += 2) {
      const x = Math.round(centerX + Math.cos(angle) * r);
      const y = Math.round(centerY + Math.sin(angle) * r);
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        samples.push({
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2]
        });
      }
    }
  }
  
  if (samples.length === 0) {
    return { r: 0, g: 0, b: 0 };
  }
  
  // Use median for robust background estimation
  samples.sort((a, b) => getLuminance(a.r, a.g, a.b) - getLuminance(b.r, b.g, b.b));
  const medianIdx = Math.floor(samples.length / 2);
  
  return samples[medianIdx];
}
