/**
 * Star-nebula separation utilities
 */
import { lerp } from './imageProcessing';
import { estimateLocalBackground } from './backgroundEstimation';
import { renderStarWithPSF, createPreciseStarMask } from './starRendering';
import type { DetectedStar } from './types';

/**
 * Remove stars from image using sophisticated gradient-aware inpainting
 */
export function removeStarsFromImage(
  imageData: ImageData,
  stars: DetectedStar[],
  mask: Float32Array
): ImageData {
  const { data, width, height } = imageData;
  const result = new ImageData(new Uint8ClampedArray(data), width, height);
  const resultData = result.data;
  
  // Sort stars by size (process smaller stars first to avoid contamination)
  const sortedStars = [...stars].sort((a, b) => a.size - b.size);
  
  for (const star of sortedStars) {
    const radius = Math.max(5, star.size * 4); // Reduced radius for tighter inpainting
    const centerX = Math.round(star.x);
    const centerY = Math.round(star.y);
    
    // Pre-calculate background reference
    const outerSamplingRadius = radius * 1.5;
    
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
              // Use gradient-aware interpolation for each pixel
              const background = estimateLocalBackground(
                imageData, 
                x, 
                y, 
                Math.max(radius * 1.1, distance + 2),
                Math.max(radius * 2, outerSamplingRadius)
              );
              
              // Smooth falloff with cubic easing
              const t = Math.min(1, maskValue);
              const smoothBlend = t * t * (3 - 2 * t); // Smoothstep
              
              resultData[idx] = lerp(data[idx], background.r, smoothBlend);
              resultData[idx + 1] = lerp(data[idx + 1], background.g, smoothBlend);
              resultData[idx + 2] = lerp(data[idx + 2], background.b, smoothBlend);
            }
          }
        }
      }
    }
  }
  
  // Apply light diffusion pass to smooth any remaining seams
  applyDiffusionSmoothing(resultData, mask, width, height, 2);
  
  return result;
}

/**
 * Apply diffusion-based smoothing to masked regions
 */
function applyDiffusionSmoothing(
  data: Uint8ClampedArray,
  mask: Float32Array,
  width: number,
  height: number,
  iterations: number
): void {
  const temp = new Uint8ClampedArray(data);
  
  for (let iter = 0; iter < iterations; iter++) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const maskIdx = y * width + x;
        const maskValue = mask[maskIdx];
        
        // Only smooth pixels that were part of stars
        if (maskValue > 0.3) {
          // 5x5 Gaussian-weighted average
          let rSum = 0, gSum = 0, bSum = 0, weightSum = 0;
          
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = (ny * width + nx) * 4;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const weight = Math.exp(-dist * dist / 2); // Gaussian
                
                rSum += temp[nIdx] * weight;
                gSum += temp[nIdx + 1] * weight;
                bSum += temp[nIdx + 2] * weight;
                weightSum += weight;
              }
            }
          }
          
          if (weightSum > 0) {
            // Blend based on mask strength
            const blendFactor = Math.min(0.5, maskValue * 0.5);
            data[idx] = lerp(data[idx], rSum / weightSum, blendFactor);
            data[idx + 1] = lerp(data[idx + 1], gSum / weightSum, blendFactor);
            data[idx + 2] = lerp(data[idx + 2], bSum / weightSum, blendFactor);
          }
        }
      }
    }
    // Update temp buffer for next iteration
    temp.set(data);
  }
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

      const originalWidth = imageElement.naturalWidth;
      const originalHeight = imageElement.naturalHeight;
      
      // Add padding to prevent edge star clipping (largest possible star halo)
      const maxStarSize = Math.max(...detectedStars.map(s => s.size), 10);
      const padding = Math.ceil(maxStarSize * 12); // farOuterHaloSize from renderStarWithPSF
      
      canvas.width = originalWidth + padding * 2;
      canvas.height = originalHeight + padding * 2;

      const starMask = createPreciseStarMask(originalWidth, originalHeight, detectedStars);
      
      // Generate star-only image with padding
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render stars with offset for padding
      for (const star of detectedStars) {
        const offsetStar = {
          ...star,
          x: star.x + padding,
          y: star.y + padding
        };
        renderStarWithPSF(ctx, offsetStar);
      }
      
      // Crop back to original dimensions
      const paddedImageData = ctx.getImageData(padding, padding, originalWidth, originalHeight);
      canvas.width = originalWidth;
      canvas.height = originalHeight;
      ctx.putImageData(paddedImageData, 0, 0);
      
      const starImage = canvas.toDataURL('image/png');

      // Create nebula image (use original dimensions)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageElement, 0, 0, originalWidth, originalHeight);
      
      const imageData = ctx.getImageData(0, 0, originalWidth, originalHeight);
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
