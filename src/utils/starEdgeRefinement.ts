/**
 * Intelligent star edge refinement utilities
 * Smooths rough edges from star extraction while maintaining star sharpness
 */

interface EdgeRefinementSettings {
  smoothingRadius?: number;      // Radius for edge smoothing (default: 2)
  edgeThreshold?: number;         // Threshold for detecting rough edges (default: 40)
  preserveCore?: boolean;         // Preserve bright star cores from smoothing (default: true)
  coreThreshold?: number;         // Brightness threshold for star cores (default: 200)
}

/**
 * Refines star edges by detecting and smoothing rough transitions
 * while preserving the bright cores and overall star shape
 */
export const refineStarEdges = (
  canvas: HTMLCanvasElement,
  settings: EdgeRefinementSettings = {}
): HTMLCanvasElement => {
  const {
    smoothingRadius = 2,
    edgeThreshold = 40,
    preserveCore = true,
    coreThreshold = 200
  } = settings;

  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Create output data
  const outputData = new Uint8ClampedArray(data);

  // Detect edges that need smoothing
  const needsSmoothing = new Uint8Array(width * height);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      
      // Skip fully transparent or fully opaque pixels
      if (alpha === 0 || alpha === 255) continue;
      
      // Get luminance for core detection
      const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      
      // Skip bright star cores if preserveCore is enabled
      if (preserveCore && luminance > coreThreshold) continue;
      
      // Check for rough edges by analyzing alpha gradient
      let maxAlphaDiff = 0;
      
      // Check 8-connected neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          
          const nIdx = (ny * width + nx) * 4;
          const nAlpha = data[nIdx + 3];
          const alphaDiff = Math.abs(alpha - nAlpha);
          
          if (alphaDiff > maxAlphaDiff) {
            maxAlphaDiff = alphaDiff;
          }
        }
      }
      
      // Mark pixels with rough edges
      if (maxAlphaDiff > edgeThreshold) {
        needsSmoothing[y * width + x] = 1;
      }
    }
  }

  // Apply selective Gaussian smoothing to rough edges
  const kernel = createGaussianKernel(smoothingRadius);
  const kernelSize = kernel.length;
  const kernelHalf = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIdx = y * width + x;
      
      // Skip pixels that don't need smoothing
      if (!needsSmoothing[pixelIdx]) continue;
      
      let r = 0, g = 0, b = 0, a = 0, totalWeight = 0;
      
      // Apply Gaussian kernel
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const sx = x + kx - kernelHalf;
          const sy = y + ky - kernelHalf;
          
          if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
          
          const sIdx = (sy * width + sx) * 4;
          const weight = kernel[ky][kx];
          
          r += data[sIdx] * weight;
          g += data[sIdx + 1] * weight;
          b += data[sIdx + 2] * weight;
          a += data[sIdx + 3] * weight;
          totalWeight += weight;
        }
      }
      
      // Normalize and apply smoothed values
      if (totalWeight > 0) {
        const idx = (y * width + x) * 4;
        outputData[idx] = Math.round(r / totalWeight);
        outputData[idx + 1] = Math.round(g / totalWeight);
        outputData[idx + 2] = Math.round(b / totalWeight);
        outputData[idx + 3] = Math.round(a / totalWeight);
      }
    }
  }

  // Apply additional alpha channel refinement for smoother transitions
  refineAlphaChannel(outputData, width, height, smoothingRadius);

  // Create output canvas
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputCtx = outputCanvas.getContext('2d')!;
  
  const refinedImageData = new ImageData(outputData, width, height);
  outputCtx.putImageData(refinedImageData, 0, 0);

  return outputCanvas;
};

/**
 * Creates a normalized Gaussian kernel for smoothing
 */
const createGaussianKernel = (radius: number): number[][] => {
  const size = radius * 2 + 1;
  const kernel: number[][] = [];
  const sigma = radius / 2;
  const sigma2 = 2 * sigma * sigma;
  let sum = 0;

  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - radius;
      const dy = y - radius;
      const value = Math.exp(-(dx * dx + dy * dy) / sigma2);
      kernel[y][x] = value;
      sum += value;
    }
  }

  // Normalize
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      kernel[y][x] /= sum;
    }
  }

  return kernel;
};

/**
 * Refines the alpha channel specifically to create smoother edge transitions
 */
const refineAlphaChannel = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): void => {
  const tempAlpha = new Uint8Array(width * height);
  
  // Copy alpha channel
  for (let i = 0; i < width * height; i++) {
    tempAlpha[i] = data[i * 4 + 3];
  }

  // Apply morphological gradient to detect edges
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const idx = y * width + x;
      const alpha = tempAlpha[idx];
      
      // Skip fully transparent pixels
      if (alpha === 0) continue;
      
      // For edge pixels (0 < alpha < 255), apply subtle gradient smoothing
      if (alpha > 0 && alpha < 255) {
        let sum = 0;
        let count = 0;
        
        // Small neighborhood average
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = (y + dy) * width + (x + dx);
            sum += tempAlpha[nIdx];
            count++;
          }
        }
        
        // Blend original with smoothed value
        const smoothed = sum / count;
        const blendFactor = 0.6; // Keep some original edge character
        const refined = alpha * (1 - blendFactor) + smoothed * blendFactor;
        
        data[(y * width + x) * 4 + 3] = Math.round(refined);
      }
    }
  }
};

/**
 * Batch process multiple star layer canvases
 */
export const refineStarLayers = async (
  layers: {
    bright: HTMLCanvasElement | null;
    medium: HTMLCanvasElement | null;
    dim: HTMLCanvasElement | null;
  },
  settings?: EdgeRefinementSettings
): Promise<{
  bright: ImageBitmap | null;
  medium: ImageBitmap | null;
  dim: ImageBitmap | null;
}> => {
  const refineLayer = async (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return null;
    const refined = refineStarEdges(canvas, settings);
    return await createImageBitmap(refined);
  };

  const [bright, medium, dim] = await Promise.all([
    refineLayer(layers.bright),
    refineLayer(layers.medium),
    refineLayer(layers.dim)
  ]);

  return { bright, medium, dim };
};
