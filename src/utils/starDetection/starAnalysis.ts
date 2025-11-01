/**
 * Star analysis and classification utilities
 */
import { getLuminance } from './imageProcessing';
import type { DetectedStar, StarDetectionSettings, RawDetection } from './types';

/**
 * Calculate star detection confidence
 */
export function calculateStarConfidence(
  imageData: ImageData,
  x: number,
  y: number,
  scale: number,
  threshold: number
): number {
  const { data, width, height } = imageData;
  const centerIdx = (y * width + x) * 4;
  const centerValue = getLuminance(data[centerIdx], data[centerIdx + 1], data[centerIdx + 2]);
  
  // Calculate radial profile to assess star-like characteristics
  const radialProfile: number[] = [];
  const maxRadius = scale * 3;
  
  for (let r = 1; r <= maxRadius; r++) {
    let sum = 0;
    let count = 0;
    
    // Sample points at this radius
    const circumference = Math.max(8, Math.floor(2 * Math.PI * r));
    for (let i = 0; i < circumference; i++) {
      const angle = (2 * Math.PI * i) / circumference;
      const px = Math.round(x + Math.cos(angle) * r);
      const py = Math.round(y + Math.sin(angle) * r);
      
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const idx = (py * width + px) * 4;
        sum += getLuminance(data[idx], data[idx + 1], data[idx + 2]);
        count++;
      }
    }
    
    if (count > 0) {
      radialProfile.push(sum / count);
    }
  }
  
  // Calculate confidence based on how well the profile matches a star
  let confidence = 0;
  
  // Peak-to-background ratio
  const background = radialProfile[radialProfile.length - 1] || 0;
  const peakRatio = background > 0 ? centerValue / background : centerValue / 10;
  confidence += Math.min(1, peakRatio / 10) * 0.4;
  
  // Radial decay (should decrease with distance)
  let decayScore = 0;
  for (let i = 1; i < radialProfile.length; i++) {
    if (radialProfile[i] <= radialProfile[i - 1]) {
      decayScore++;
    }
  }
  confidence += (decayScore / Math.max(1, radialProfile.length - 1)) * 0.3;
  
  // Signal strength
  const signalStrength = Math.min(1, centerValue / 255);
  confidence += signalStrength * 0.3;
  
  return Math.min(1, confidence);
}

/**
 * Calculate star size using moment analysis
 */
export function calculateStarSize(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  maxRadius: number
): number {
  const { data, width, height } = imageData;
  let totalWeight = 0;
  let weightedSum = 0;

  for (let dy = -maxRadius; dy <= maxRadius; dy++) {
    for (let dx = -maxRadius; dx <= maxRadius; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const luminance = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (luminance > 10) {
          totalWeight += luminance;
          weightedSum += luminance * distance;
        }
      }
    }
  }

  return totalWeight > 0 ? (weightedSum / totalWeight) * 2 : 1;
}

/**
 * Classify star type based on characteristics
 */
export function classifyStar(
  imageData: ImageData,
  x: number,
  y: number,
  scale: number,
  luminance: number
): 'point' | 'extended' | 'saturated' {
  const { data, width, height } = imageData;
  
  // Check for saturation in nearby pixels
  const checkRadius = Math.max(5, scale * 2);
  let saturatedPixelCount = 0;
  let totalPixelsChecked = 0;
  
  for (let dy = -checkRadius; dy <= checkRadius; dy++) {
    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      const px = x + dx;
      const py = y + dy;
      
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= checkRadius) {
          const idx = (py * width + px) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          if (r >= 240 || g >= 240 || b >= 240) {
            saturatedPixelCount++;
          }
          totalPixelsChecked++;
        }
      }
    }
  }
  
  const saturationRatio = saturatedPixelCount / Math.max(1, totalPixelsChecked);
  if (saturationRatio > 0.05 || luminance >= 250) {
    return 'saturated';
  }
  
  const measuredSize = calculateStarSize(imageData, x, y, scale * 2);
  
  if (measuredSize < 2) {
    return 'point';
  } else {
    return 'extended';
  }
}

/**
 * Calculate precise star size based on type
 */
export function calculatePreciseStarSize(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  type: 'point' | 'extended' | 'saturated'
): number {
  const { data, width, height } = imageData;
  const centerIdx = (centerY * width + centerX) * 4;
  const centerValue = getLuminance(data[centerIdx], data[centerIdx + 1], data[centerIdx + 2]);
  
  const maxRadius = type === 'point' ? 5 : type === 'extended' ? 10 : 15;
  const threshold = centerValue * 0.1;
  
  let effectiveRadius = 0.5;
  
  for (let r = 1; r <= maxRadius; r++) {
    let averageBrightness = 0;
    let count = 0;
    
    const samples = Math.max(8, Math.floor(2 * Math.PI * r));
    for (let i = 0; i < samples; i++) {
      const angle = (2 * Math.PI * i) / samples;
      const x = Math.round(centerX + Math.cos(angle) * r);
      const y = Math.round(centerY + Math.sin(angle) * r);
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        averageBrightness += getLuminance(data[idx], data[idx + 1], data[idx + 2]);
        count++;
      }
    }
    
    if (count > 0) {
      averageBrightness /= count;
      if (averageBrightness >= threshold) {
        effectiveRadius = r;
      } else {
        break;
      }
    }
  }
  
  return Math.max(0.5, effectiveRadius);
}

/**
 * Calculate local noise level around a point
 */
export function calculateLocalNoise(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  radius: number
): number {
  const { data, width, height } = imageData;
  const values: number[] = [];

  const innerRadius = radius;
  const outerRadius = radius * 2;

  for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
    for (let r = innerRadius; r <= outerRadius; r += 2) {
      const x = Math.round(centerX + Math.cos(angle) * r);
      const y = Math.round(centerY + Math.sin(angle) * r);

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const luminance = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
        values.push(luminance);
      }
    }
  }

  if (values.length === 0) return 1;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Merge duplicate detections from multiple scales
 */
export function mergeDuplicateDetections(
  stars: RawDetection[],
  mergeRadius: number
): RawDetection[] {
  const merged: RawDetection[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < stars.length; i++) {
    if (used.has(i)) continue;
    
    const star = stars[i];
    const cluster = [star];
    used.add(i);
    
    for (let j = i + 1; j < stars.length; j++) {
      if (used.has(j)) continue;
      
      const other = stars[j];
      const distance = Math.sqrt((star.x - other.x) ** 2 + (star.y - other.y) ** 2);
      
      if (distance <= mergeRadius) {
        cluster.push(other);
        used.add(j);
      }
    }
    
    const best = cluster.reduce((prev, curr) => curr.confidence > prev.confidence ? curr : prev);
    merged.push(best);
  }
  
  return merged;
}

/**
 * Convert detected stars to final format with enhanced properties
 */
export function processDetectedStars(
  stars: RawDetection[],
  imageData: ImageData,
  settings: StarDetectionSettings
): DetectedStar[] {
  const validStars: DetectedStar[] = [];

  console.log(`Processing ${stars.length} detected stars...`);

  for (const star of stars) {
    const size = calculatePreciseStarSize(imageData, star.x, star.y, star.type);
    
    if (size < settings.minStarSize || size > settings.maxStarSize) continue;

    const signal = star.value;
    const noise = calculateLocalNoise(imageData, star.x, star.y, Math.max(3, size * 2));
    const snr = noise > 0 ? signal / noise : signal / 5;

    if (star.confidence < 0.3 || snr < 2.0) continue;

    const brightness = Math.max(0.05, Math.min(1.0, star.value / 255));
    
    let finalSize = size;
    switch (star.type) {
      case 'point':
        finalSize = Math.max(0.5, Math.min(3, size + brightness * 2));
        break;
      case 'extended':
        finalSize = Math.max(2, Math.min(8, size + brightness * 3));
        break;
      case 'saturated':
        finalSize = Math.max(4, Math.min(12, size + brightness * 4));
        break;
    }

    validStars.push({
      x: star.x,
      y: star.y,
      brightness,
      size: finalSize,
      color: star.color,
      signal: snr,
      confidence: star.confidence,
      type: star.type
    });
  }

  console.log(`Found ${validStars.length} valid stars after processing`);

  return validStars
    .sort((a, b) => (b.confidence * b.brightness) - (a.confidence * a.brightness))
    .slice(0, 3000);
}
