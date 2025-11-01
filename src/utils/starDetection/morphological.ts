/**
 * Morphological operations for star detection
 */

/**
 * Morphological erosion
 */
export function morphologicalErosion(imageData: ImageData, kernel: boolean[][]): Uint8ClampedArray {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  const kernelRadius = Math.floor(kernel.length / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let minR = 255, minG = 255, minB = 255;
      
      for (let ky = 0; ky < kernel.length; ky++) {
        for (let kx = 0; kx < kernel[0].length; kx++) {
          if (!kernel[ky][kx]) continue;
          
          const ny = y + ky - kernelRadius;
          const nx = x + kx - kernelRadius;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = (ny * width + nx) * 4;
            minR = Math.min(minR, data[nIdx]);
            minG = Math.min(minG, data[nIdx + 1]);
            minB = Math.min(minB, data[nIdx + 2]);
          }
        }
      }
      
      result[idx] = minR;
      result[idx + 1] = minG;
      result[idx + 2] = minB;
      result[idx + 3] = data[idx + 3];
    }
  }
  
  return result;
}

/**
 * Morphological dilation
 */
export function morphologicalDilation(imageData: ImageData, kernel: boolean[][]): Uint8ClampedArray {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  const kernelRadius = Math.floor(kernel.length / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let maxR = 0, maxG = 0, maxB = 0;
      
      for (let ky = 0; ky < kernel.length; ky++) {
        for (let kx = 0; kx < kernel[0].length; kx++) {
          if (!kernel[ky][kx]) continue;
          
          const ny = y + ky - kernelRadius;
          const nx = x + kx - kernelRadius;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = (ny * width + nx) * 4;
            maxR = Math.max(maxR, data[nIdx]);
            maxG = Math.max(maxG, data[nIdx + 1]);
            maxB = Math.max(maxB, data[nIdx + 2]);
          }
        }
      }
      
      result[idx] = maxR;
      result[idx + 1] = maxG;
      result[idx + 2] = maxB;
      result[idx + 3] = data[idx + 3];
    }
  }
  
  return result;
}

/**
 * Morphological opening (erosion followed by dilation)
 */
export function morphologicalOpening(imageData: ImageData, kernel: boolean[][]): Uint8ClampedArray {
  const eroded = morphologicalErosion(imageData, kernel);
  const erodedImageData = new ImageData(new Uint8ClampedArray(eroded), imageData.width, imageData.height);
  return morphologicalDilation(erodedImageData, kernel);
}

/**
 * Morphological top-hat transform to enhance point sources
 */
export function morphologicalTopHat(imageData: ImageData, kernel: boolean[][]): Uint8ClampedArray {
  const { data } = imageData;
  const result = new Uint8ClampedArray(data.length);
  const opened = morphologicalOpening(imageData, kernel);
  
  // Top-hat = original - opening
  for (let i = 0; i < data.length; i += 4) {
    result[i] = Math.max(0, data[i] - opened[i]); // R
    result[i + 1] = Math.max(0, data[i + 1] - opened[i + 1]); // G
    result[i + 2] = Math.max(0, data[i + 2] - opened[i + 2]); // B
    result[i + 3] = data[i + 3]; // A
  }
  
  return result;
}
