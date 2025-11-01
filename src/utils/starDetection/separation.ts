/**
 * Star-nebula separation utilities
 */
import { lerp } from './imageProcessing';
import { estimateLocalBackground } from './backgroundEstimation';
import { renderStarWithPSF, createPreciseStarMask } from './starRendering';
import type { DetectedStar } from './types';

/**
 * Remove stars from image using sophisticated inpainting
 */
export function removeStarsFromImage(
  imageData: ImageData,
  stars: DetectedStar[],
  mask: Float32Array
): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(new Uint8ClampedArray(data), width, height);
  const resultData = result.data;
  
  for (const star of stars) {
    const radius = Math.max(5, star.size * 5);
    const centerX = Math.round(star.x);
    const centerY = Math.round(star.y);
    
    const background = estimateLocalBackground(imageData, centerX, centerY, radius * 2, radius * 3);
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance <= radius) {
            const idx = (y * width + x) * 4;
            const maskIdx = y * width + x;
            const maskValue = mask[maskIdx];
            
            if (maskValue > 0.1) {
              const blendFactor = Math.min(1, maskValue);
              
              resultData[idx] = lerp(data[idx], background.r, blendFactor);
              resultData[idx + 1] = lerp(data[idx + 1], background.g, blendFactor);
              resultData[idx + 2] = lerp(data[idx + 2], background.b, blendFactor);
            }
          }
        }
      }
    }
  }
  
  return result;
}

/**
 * Create separated star and nebula images
 */
export async function separateStarsAndNebula(
  imageElement: HTMLImageElement,
  detectedStars: DetectedStar[]
): Promise<{ starImage: string; nebulaImage: string }> {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting advanced star-nebula separation...');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;

      const starMask = createPreciseStarMask(canvas.width, canvas.height, detectedStars);
      
      // Generate star-only image
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (const star of detectedStars) {
        renderStarWithPSF(ctx, star);
      }
      
      const starImage = canvas.toDataURL('image/png');

      // Create nebula image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageElement, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const nebulaData = removeStarsFromImage(imageData, detectedStars, starMask);
      
      ctx.putImageData(nebulaData, 0, 0);
      const nebulaImage = canvas.toDataURL('image/png');

      console.log('Star-nebula separation completed');
      resolve({ starImage, nebulaImage });
    } catch (error) {
      console.error('Separation error:', error);
      reject(error);
    }
  });
}
