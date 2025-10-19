/**
 * Caching utilities for star detection operations
 * Memoizes expensive calculations to improve performance
 */

// Cache for Gaussian kernels
const gaussianKernelCache = new Map<string, { kernel: number[][], size: number }>();

/**
 * Get or generate Gaussian kernel (cached)
 */
export function getCachedGaussianKernel(sigma: number): { kernel: number[][], size: number } {
  const key = sigma.toFixed(2);
  
  if (gaussianKernelCache.has(key)) {
    return gaussianKernelCache.get(key)!;
  }
  
  const result = generateGaussianKernel(sigma);
  gaussianKernelCache.set(key, result);
  
  return result;
}

/**
 * Generate Gaussian blur kernel
 */
function generateGaussianKernel(sigma: number): { kernel: number[][], size: number } {
  const size = Math.ceil(sigma * 6) | 1; // Ensure odd size
  const kernel: number[][] = [];
  const center = Math.floor(size / 2);
  let sum = 0;

  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const distance = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      const value = Math.exp(-(distance ** 2) / (2 * sigma ** 2));
      kernel[y][x] = value;
      sum += value;
    }
  }

  // Normalize kernel
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      kernel[y][x] /= sum;
    }
  }

  return { kernel, size };
}

// Cache for circular morphological kernels
const circularKernelCache = new Map<number, boolean[][]>();

/**
 * Get or create circular kernel (cached)
 */
export function getCachedCircularKernel(radius: number): boolean[][] {
  if (circularKernelCache.has(radius)) {
    return circularKernelCache.get(radius)!;
  }
  
  const kernel = createCircularKernel(radius);
  circularKernelCache.set(radius, kernel);
  
  return kernel;
}

/**
 * Create circular morphological kernel
 */
function createCircularKernel(radius: number): boolean[][] {
  const size = radius * 2 + 1;
  const kernel: boolean[][] = [];
  const center = radius;
  
  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const distance = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      kernel[y][x] = distance <= radius;
    }
  }
  
  return kernel;
}

/**
 * Clear all caches (useful for memory management)
 */
export function clearStarDetectionCaches(): void {
  gaussianKernelCache.clear();
  circularKernelCache.clear();
  console.log('Star detection caches cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { gaussianKernels: number; circularKernels: number } {
  return {
    gaussianKernels: gaussianKernelCache.size,
    circularKernels: circularKernelCache.size
  };
}
