/**
 * Image processing utilities for star detection
 */
import { getCachedGaussianKernel } from '../starDetectionCache';

/**
 * Convert RGB to grayscale luminance
 */
export function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Apply Gaussian blur to reduce noise (optimized with cached kernels)
 */
export function applyGaussianBlur(imageData: ImageData, sigma: number): ImageData {
  const { data, width, height } = imageData;
  const { kernel, size } = getCachedGaussianKernel(sigma);
  const blurred = new ImageData(width, height);
  const center = Math.floor(size / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let ky = 0; ky < size; ky++) {
        for (let kx = 0; kx < size; kx++) {
          const py = y + ky - center;
          const px = x + kx - center;

          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            const weight = kernel[ky][kx];
            
            r += data[idx] * weight;
            g += data[idx + 1] * weight;
            b += data[idx + 2] * weight;
            a += data[idx + 3] * weight;
          }
        }
      }

      const idx = (y * width + x) * 4;
      blurred.data[idx] = Math.round(r);
      blurred.data[idx + 1] = Math.round(g);
      blurred.data[idx + 2] = Math.round(b);
      blurred.data[idx + 3] = Math.round(a);
    }
  }

  return blurred;
}

/**
 * Linear interpolation helper
 */
export function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/**
 * Check if point is local maximum
 */
export function isLocalMaximum(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  radius: number
): boolean {
  const centerIdx = (y * width + x) * 4;
  const centerValue = getLuminance(data[centerIdx], data[centerIdx + 1], data[centerIdx + 2]);
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = (ny * width + nx) * 4;
        const nValue = getLuminance(data[nIdx], data[nIdx + 1], data[nIdx + 2]);
        
        if (nValue >= centerValue) {
          return false;
        }
      }
    }
  }
  
  return true;
}
