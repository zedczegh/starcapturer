/**
 * Core star detection algorithms
 */
import { getCachedCircularKernel } from '../starDetectionCache';
import { getLuminance, isLocalMaximum } from './imageProcessing';
import { morphologicalTopHat } from './morphological';
import { calculateBackgroundStatistics } from './backgroundEstimation';
import { calculateStarConfidence, classifyStar, mergeDuplicateDetections } from './starAnalysis';
import type { StarDetectionSettings, RawDetection } from './types';

/**
 * Detect stars at a specific scale using morphological operations
 */
export function detectStarsAtScale(
  imageData: ImageData, 
  scale: number, 
  threshold: number,
  settings: StarDetectionSettings
): RawDetection[] {
  const { data, width, height } = imageData;
  const stars: RawDetection[] = [];
  
  const kernel = getCachedCircularKernel(scale);
  const topHat = morphologicalTopHat(imageData, kernel);
  
  const stepSize = Math.max(1, Math.floor(scale / 2));
  
  for (let y = scale * 2; y < height - scale * 2; y += stepSize) {
    for (let x = scale * 2; x < width - scale * 2; x += stepSize) {
      const idx = (y * width + x) * 4;
      const luminance = getLuminance(topHat[idx], topHat[idx + 1], topHat[idx + 2]);
      
      if (luminance < threshold) continue;
      
      if (isLocalMaximum(topHat, width, height, x, y, scale * 2)) {
        const originalIdx = (y * width + x) * 4;
        const originalColor = {
          r: data[originalIdx],
          g: data[originalIdx + 1],
          b: data[originalIdx + 2]
        };
        
        const confidence = calculateStarConfidence(imageData, x, y, scale, threshold);
        const starType = classifyStar(imageData, x, y, scale, luminance);
        
        if (confidence > 0.3) {
          stars.push({
            x,
            y,
            value: luminance,
            color: originalColor,
            confidence,
            type: starType
          });
        }
      }
    }
  }
  
  return stars;
}

/**
 * Multi-scale star detection using morphological operations
 */
export function detectStarsMultiScale(
  imageData: ImageData,
  settings: StarDetectionSettings
): RawDetection[] {
  const stars: RawDetection[] = [];

  const backgroundStats = calculateBackgroundStatistics(imageData);
  const dynamicThreshold = backgroundStats.median + (backgroundStats.mad * 5);

  console.log(`Background: median=${backgroundStats.median.toFixed(2)}, MAD=${backgroundStats.mad.toFixed(2)}, threshold=${dynamicThreshold.toFixed(2)}`);

  const scales = [1, 2, 3, 5];
  
  for (const scale of scales) {
    const detectedAtScale = detectStarsAtScale(imageData, scale, dynamicThreshold, settings);
    stars.push(...detectedAtScale);
  }

  return mergeDuplicateDetections(stars, 3);
}
