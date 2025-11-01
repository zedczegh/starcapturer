/**
 * Main entry point for star detection system
 * Refactored for better organization and maintainability
 */
import { applyGaussianBlur } from './imageProcessing';
import { detectStarsMultiScale } from './detection';
import { processDetectedStars } from './starAnalysis';
import { separateStarsAndNebula } from './separation';
import { DEFAULT_SETTINGS } from './types';
import type { DetectedStar, StarDetectionSettings } from './types';

// Re-export types and constants
export type { DetectedStar, StarDetectionSettings } from './types';
export { DEFAULT_SETTINGS } from './types';

// Re-export main functions
export { separateStarsAndNebula } from './separation';

/**
 * Main star detection function with advanced multi-scale approach
 */
export async function detectStarsFromImage(
  imageElement: HTMLImageElement,
  settings: StarDetectionSettings = DEFAULT_SETTINGS
): Promise<DetectedStar[]> {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting advanced star detection...');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      ctx.drawImage(imageElement, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      console.log(`Processing image: ${canvas.width}x${canvas.height}`);

      const blurredData = applyGaussianBlur(imageData, settings.sigma);
      const rawDetections = detectStarsMultiScale(blurredData, settings);
      console.log(`Multi-scale detection found ${rawDetections.length} candidates`);

      const detectedStars = processDetectedStars(rawDetections, imageData, settings);
      console.log(`Final result: ${detectedStars.length} high-quality stars detected`);
      
      resolve(detectedStars);
    } catch (error) {
      console.error('Star detection error:', error);
      reject(error);
    }
  });
}
