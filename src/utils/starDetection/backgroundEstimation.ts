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
 * Estimate local background color around a point using gradient-aware sampling
 */
export function estimateLocalBackground(
  imageData: ImageData, 
  centerX: number, 
  centerY: number, 
  innerRadius: number, 
  outerRadius: number
): { r: number; g: number; b: number } {
  const { data, width, height } = imageData;
  const samples: Array<{ r: number; g: number; b: number; weight: number }> = [];
  
  // Sample points in annulus with distance-based weighting
  for (let angle = 0; angle < Math.PI * 2; angle += 0.15) {
    for (let r = innerRadius; r <= outerRadius; r += 1.5) {
      const x = Math.round(centerX + Math.cos(angle) * r);
      const y = Math.round(centerY + Math.sin(angle) * r);
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        
        // Weight by distance - closer to outer ring = more weight
        const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const normalizedDist = (distanceFromCenter - innerRadius) / (outerRadius - innerRadius);
        const weight = normalizedDist * normalizedDist; // Quadratic falloff
        
        samples.push({
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
          weight: weight
        });
      }
    }
  }
  
  if (samples.length === 0) {
    return { r: 0, g: 0, b: 0 };
  }
  
  // Weighted average with outlier rejection
  let totalWeight = 0;
  let rSum = 0, gSum = 0, bSum = 0;
  
  // First pass: calculate mean luminance
  const luminances = samples.map(s => getLuminance(s.r, s.g, s.b));
  const meanLum = luminances.reduce((sum, l) => sum + l, 0) / luminances.length;
  const stdDev = Math.sqrt(
    luminances.reduce((sum, l) => sum + (l - meanLum) ** 2, 0) / luminances.length
  );
  
  // Second pass: weighted average excluding outliers
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const lum = luminances[i];
    
    // Reject samples more than 2 std dev away (likely stars)
    if (Math.abs(lum - meanLum) < 2 * stdDev) {
      rSum += sample.r * sample.weight;
      gSum += sample.g * sample.weight;
      bSum += sample.b * sample.weight;
      totalWeight += sample.weight;
    }
  }
  
  if (totalWeight === 0) {
    // Fallback to simple median
    samples.sort((a, b) => getLuminance(a.r, a.g, a.b) - getLuminance(b.r, b.g, b.b));
    const medianIdx = Math.floor(samples.length / 2);
    return { r: samples[medianIdx].r, g: samples[medianIdx].g, b: samples[medianIdx].b };
  }
  
  return {
    r: Math.round(rSum / totalWeight),
    g: Math.round(gSum / totalWeight),
    b: Math.round(bSum / totalWeight)
  };
}

/**
 * Get interpolated background color at a specific position
 */
export function getInterpolatedBackground(
  imageData: ImageData,
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  radius: number
): { r: number; g: number; b: number } {
  const { data, width, height } = imageData;
  
  // Sample 8 directions around the point
  const directions = [
    [1, 0], [0, 1], [-1, 0], [0, -1],
    [0.707, 0.707], [-0.707, 0.707], [-0.707, -0.707], [0.707, -0.707]
  ];
  
  let rSum = 0, gSum = 0, bSum = 0;
  let count = 0;
  
  for (const [dx, dy] of directions) {
    // Sample at multiple distances
    for (let dist = radius * 1.2; dist <= radius * 2.5; dist += radius * 0.3) {
      const sampleX = Math.round(x + dx * dist);
      const sampleY = Math.round(y + dy * dist);
      
      if (sampleX >= 0 && sampleX < width && sampleY >= 0 && sampleY < height) {
        const idx = (sampleY * width + sampleX) * 4;
        rSum += data[idx];
        gSum += data[idx + 1];
        bSum += data[idx + 2];
        count++;
      }
    }
  }
  
  if (count === 0) {
    return { r: 0, g: 0, b: 0 };
  }
  
  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count)
  };
}
