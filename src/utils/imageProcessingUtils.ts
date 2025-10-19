/**
 * Image Processing Utilities
 * Centralized image loading, TIFF decoding, and downscaling operations
 */
import UTIF from 'utif';
import { CanvasPool } from '@/lib/performance/CanvasPool';

export interface ImageProcessingOptions {
  enableDownscale?: boolean;
  maxResolution?: number;
}

const DEFAULT_OPTIONS: ImageProcessingOptions = {
  enableDownscale: false,
  maxResolution: 4096 * 4096 // 16MP
};

/**
 * Decode TIFF file to data URL with optional downscaling
 */
export async function decodeTiffToDataUrl(
  arrayBuffer: ArrayBuffer, 
  options: ImageProcessingOptions = DEFAULT_OPTIONS
): Promise<string> {
  const canvasPool = CanvasPool.getInstance();
  
  try {
    const ifds = UTIF.decode(arrayBuffer);
    UTIF.decodeImage(arrayBuffer, ifds[0]);
    const rgba = UTIF.toRGBA8(ifds[0]);
    
    const width = ifds[0].width;
    const height = ifds[0].height;
    
    let targetWidth = width;
    let targetHeight = height;
    
    // Only downscale if user has enabled it
    if (options.enableDownscale) {
      const maxRes = options.maxResolution || DEFAULT_OPTIONS.maxResolution!;
      const isHighResolution = width * height > maxRes;
      
      if (isHighResolution) {
        const scale = Math.sqrt(maxRes / (width * height));
        targetWidth = Math.floor(width * scale);
        targetHeight = Math.floor(height * scale);
        console.log(`📐 Downscaling TIFF: ${width}x${height} → ${targetWidth}x${targetHeight} (${(scale * 100).toFixed(0)}%)`);
      }
    }
    
    // Use canvas pool
    const canvas = canvasPool.acquire(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d')!;
    
    try {
      if (targetWidth !== width || targetHeight !== height) {
        // Create temp canvas with original size for downscaling
        const tempCanvas = canvasPool.acquire(width, height);
        const tempCtx = tempCanvas.getContext('2d')!;
        
        const imageData = tempCtx.createImageData(width, height);
        imageData.data.set(rgba);
        tempCtx.putImageData(imageData, 0, 0);
        
        // Downscale with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
        
        canvasPool.release(tempCanvas);
      } else {
        const imageData = ctx.createImageData(targetWidth, targetHeight);
        imageData.data.set(rgba);
        ctx.putImageData(imageData, 0, 0);
      }
      
      return canvas.toDataURL('image/png');
    } finally {
      canvasPool.release(canvas);
    }
  } catch (error) {
    console.error('TIFF decode error:', error);
    throw new Error('Failed to decode TIFF file. The file may be too large or corrupted.');
  }
}

/**
 * Downscale standard image if needed
 */
export async function downscaleImageIfNeeded(
  img: HTMLImageElement,
  options: ImageProcessingOptions = DEFAULT_OPTIONS
): Promise<string> {
  if (!options.enableDownscale) {
    return img.src;
  }
  
  const maxRes = options.maxResolution || DEFAULT_OPTIONS.maxResolution!;
  const isHighResolution = img.width * img.height > maxRes;
  
  if (!isHighResolution) {
    console.log(`✓ Image size ${img.width}x${img.height} within limits`);
    return img.src;
  }
  
  const canvasPool = CanvasPool.getInstance();
  const scale = Math.sqrt(maxRes / (img.width * img.height));
  const targetWidth = Math.floor(img.width * scale);
  const targetHeight = Math.floor(img.height * scale);
  
  console.log(`📐 Downscaling: ${img.width}x${img.height} → ${targetWidth}x${targetHeight}`);
  
  const canvas = canvasPool.acquire(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d')!;
  
  try {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    
    return canvas.toDataURL('image/png', 0.95);
  } finally {
    canvasPool.release(canvas);
  }
}

/**
 * Load image from file with automatic format detection and downscaling
 */
export async function loadImageFromFile(
  file: File,
  options: ImageProcessingOptions = DEFAULT_OPTIONS
): Promise<{ dataUrl: string; element: HTMLImageElement }> {
  const fileName = file.name.toLowerCase();
  const isTiff = fileName.endsWith('.tiff') || fileName.endsWith('.tif');
  
  if (isTiff) {
    // Handle TIFF files
    const arrayBuffer = await file.arrayBuffer();
    const dataUrl = await decodeTiffToDataUrl(arrayBuffer, options);
    
    const img = await loadImageElement(dataUrl);
    return { dataUrl, element: img };
  } else {
    // Handle standard image formats
    const originalDataUrl = await readFileAsDataURL(file);
    
    if (options.enableDownscale) {
      const tempImg = await loadImageElement(originalDataUrl);
      const optimizedDataUrl = await downscaleImageIfNeeded(tempImg, options);
      const finalImg = await loadImageElement(optimizedDataUrl);
      return { dataUrl: optimizedDataUrl, element: finalImg };
    } else {
      const img = await loadImageElement(originalDataUrl);
      return { dataUrl: originalDataUrl, element: img };
    }
  }
}

/**
 * Read file as data URL
 */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Load HTMLImageElement from data URL
 */
function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Validate image file format and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.fits', '.fit', '.tiff', '.tif', '.bmp', '.webp'];
  const fileName = file.name.toLowerCase();
  const isValidFormat = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!isValidFormat) {
    return { valid: false, error: 'Invalid file format' };
  }

  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large (max 500MB)' };
  }

  return { valid: true };
}
