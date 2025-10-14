/**
 * Simple depth map generation for stereoscopic pairs
 * Based on edge detection and brightness analysis
 */

export interface SimpleDepthParams {
  depth: number; // 1-50, controls how much depth to apply
  edgeWeight: number; // 0-1, how much edges contribute to depth
  brightnessWeight: number; // 0-1, how much brightness contributes
}

/**
 * Simple Sobel edge detection
 */
function detectEdges(data: Uint8ClampedArray, width: number, height: number): Float32Array {
  const edges = new Float32Array(width * height);
  
  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      
      // Apply Sobel operator
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          
          gx += gray * sobelX[kernelIdx];
          gy += gray * sobelY[kernelIdx];
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = Math.min(255, magnitude);
    }
  }
  
  return edges;
}

/**
 * Calculate brightness map
 */
function calculateBrightness(data: Uint8ClampedArray, width: number, height: number): Float32Array {
  const brightness = new Float32Array(width * height);
  
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    // Simple luminance calculation
    brightness[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  
  return brightness;
}

/**
 * Normalize array to 0-255 range
 */
function normalize(arr: Float32Array): Float32Array {
  let min = Infinity;
  let max = -Infinity;
  
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
    if (arr[i] > max) max = arr[i];
  }
  
  const range = max - min;
  const normalized = new Float32Array(arr.length);
  
  if (range > 0) {
    for (let i = 0; i < arr.length; i++) {
      normalized[i] = ((arr[i] - min) / range) * 255;
    }
  }
  
  return normalized;
}

/**
 * Apply Gaussian blur for smoothing
 */
function gaussianBlur(data: Float32Array, width: number, height: number, radius: number = 2): Float32Array {
  const blurred = new Float32Array(width * height);
  const kernel: number[] = [];
  let kernelSum = 0;
  
  // Generate 1D Gaussian kernel
  for (let i = -radius; i <= radius; i++) {
    const value = Math.exp(-(i * i) / (2 * radius * radius));
    kernel.push(value);
    kernelSum += value;
  }
  
  // Normalize kernel
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= kernelSum;
  }
  
  // Horizontal pass
  const temp = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let i = -radius; i <= radius; i++) {
        const sx = Math.max(0, Math.min(width - 1, x + i));
        sum += data[y * width + sx] * kernel[i + radius];
      }
      temp[y * width + x] = sum;
    }
  }
  
  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let i = -radius; i <= radius; i++) {
        const sy = Math.max(0, Math.min(height - 1, y + i));
        sum += temp[sy * width + x] * kernel[i + radius];
      }
      blurred[y * width + x] = sum;
    }
  }
  
  return blurred;
}

/**
 * Generate simple depth map from image
 */
export function generateSimpleDepthMap(
  imageData: ImageData,
  params: SimpleDepthParams
): ImageData {
  const { width, height, data } = imageData;
  
  // 1. Detect edges (sharp edges = foreground/closer)
  const edges = detectEdges(data, width, height);
  const normalizedEdges = normalize(edges);
  
  // 2. Calculate brightness (brighter = closer for astronomy)
  const brightness = calculateBrightness(data, width, height);
  const normalizedBrightness = normalize(brightness);
  
  // 3. Combine edge and brightness with weights
  const combined = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    combined[i] = 
      normalizedEdges[i] * params.edgeWeight +
      normalizedBrightness[i] * params.brightnessWeight;
  }
  
  // 4. Normalize combined result
  const normalizedCombined = normalize(combined);
  
  // 5. Apply Gaussian blur for smooth depth transitions
  const blurRadius = Math.max(2, Math.floor(params.depth / 10));
  const smoothed = gaussianBlur(normalizedCombined, width, height, blurRadius);
  
  // 6. Apply depth factor
  const depthFactor = params.depth / 50; // Normalize depth parameter
  
  // 7. Create final depth map ImageData
  const depthMap = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const depthValue = Math.min(255, smoothed[i] * depthFactor * 2);
    const idx = i * 4;
    depthMap.data[idx] = depthValue;
    depthMap.data[idx + 1] = depthValue;
    depthMap.data[idx + 2] = depthValue;
    depthMap.data[idx + 3] = 255;
  }
  
  return depthMap;
}

/**
 * Detect bright stars and their diffraction spikes
 */
export function detectStars(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number = 200
): Uint8ClampedArray {
  const starMask = new Uint8ClampedArray(width * height);
  
  // Step 1: Detect bright star cores
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const brightness = Math.max(data[idx], data[idx + 1], data[idx + 2]);
    
    if (brightness > threshold) {
      starMask[i] = 255;
    }
  }
  
  // Step 2: Expand mask to capture diffraction spikes
  // Use morphological dilation to grow star regions
  const expandedMask = new Uint8ClampedArray(width * height);
  const expandRadius = 8; // Expand by 8 pixels to capture spike extent
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (starMask[idx] === 255) {
        // This is a star core - expand in cross pattern for diffraction spikes
        for (let dy = -expandRadius; dy <= expandRadius; dy++) {
          for (let dx = -expandRadius; dx <= expandRadius; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              const pixelIdx = nIdx * 4;
              
              // Check if this pixel is bright enough to be part of the spike
              const brightness = Math.max(data[pixelIdx], data[pixelIdx + 1], data[pixelIdx + 2]);
              
              // Include pixels that are reasonably bright and within the expansion radius
              // This captures the gradual falloff of diffraction spikes
              if (brightness > threshold * 0.3) { // 30% of threshold for spike detection
                expandedMask[nIdx] = 255;
              }
            }
          }
        }
      }
    }
  }
  
  // Step 3: Additional pass to capture linear spike patterns (cross shape)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixelIdx = idx * 4;
      const brightness = Math.max(data[pixelIdx], data[pixelIdx + 1], data[pixelIdx + 2]);
      
      if (expandedMask[idx] === 255) {
        // Already marked as star - check for linear extensions (spikes)
        // Look for bright pixels in cardinal directions
        const spikeLength = 15;
        
        for (let dir = 0; dir < 4; dir++) {
          const dx = dir === 0 ? 1 : dir === 1 ? -1 : 0;
          const dy = dir === 2 ? 1 : dir === 3 ? -1 : 0;
          
          for (let dist = 1; dist <= spikeLength; dist++) {
            const nx = x + dx * dist;
            const ny = y + dy * dist;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIdx = ny * width + nx;
              const nPixelIdx = nIdx * 4;
              const nBrightness = Math.max(data[nPixelIdx], data[nPixelIdx + 1], data[nPixelIdx + 2]);
              
              // If pixel is bright enough, include it in spike
              if (nBrightness > threshold * 0.25) {
                expandedMask[nIdx] = 255;
              } else {
                break; // Stop extending in this direction if we hit dark pixels
              }
            }
          }
        }
      }
    }
  }
  
  return expandedMask;
}
