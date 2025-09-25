/**
 * Traditional Morph Mode - Based on photographingspace.com methodology
 * 
 * This implementation follows the traditional workflow described by J-P Metsavainio
 * and Dylan O'Donnell for creating 3D stereoscopic pairs from separate starless
 * and stars-only astronomical images.
 */
// @ts-ignore
import * as UTIF from 'utif';
import { OptimizedDisplacementProcessor } from './optimizedDisplacement';

export interface TraditionalMorphParams {
  horizontalDisplace: number; // 10-30 range for displacement filter
  starShiftAmount: number; // pixels to shift individual stars
  luminanceBlur: number; // 1-2 pixels for luminance map smoothing
  contrastBoost: number; // final contrast adjustment
}

export interface TraditionalInputs {
  starlessImage: File;
  starsOnlyImage: File;
}

export class TraditionalMorphProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    this.ctx = ctx;
  }

  private isTiffFile(file: File): boolean {
    return file.type === 'image/tiff' || file.type === 'image/tif' || 
           !!file.name.toLowerCase().match(/\.tiff?$/);
  }

  private async convertTiffToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const ifds = UTIF.decode(buffer);
          UTIF.decodeImage(buffer, ifds[0]);
          const rgba = UTIF.toRGBA8(ifds[0]);
          
          // Create canvas and draw the TIFF image
          const canvas = document.createElement('canvas');
          canvas.width = ifds[0].width;
          canvas.height = ifds[0].height;
          const ctx = canvas.getContext('2d')!;
          
          const imageData = new ImageData(new Uint8ClampedArray(rgba), ifds[0].width, ifds[0].height);
          ctx.putImageData(imageData, 0, 0);
          
          resolve(canvas.toDataURL());
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  private async createImageUrl(file: File): Promise<string> {
    if (this.isTiffFile(file)) {
      return await this.convertTiffToDataURL(file);
    }
    return URL.createObjectURL(file);
  }

  /**
   * OPTIMIZED: Load and process input images with smart scaling for performance
   */
  async loadImages(inputs: TraditionalInputs): Promise<{
    starlessImg: HTMLImageElement;
    starsImg: HTMLImageElement;
    scaleFactor: number;
    originalSize: { width: number; height: number };
  }> {
    const starlessImg = new Image();
    const starsImg = new Image();
    
    // Load both images with TIFF support
    const starlessUrl = await this.createImageUrl(inputs.starlessImage);
    const starsUrl = await this.createImageUrl(inputs.starsOnlyImage);
    
    await Promise.all([
      new Promise((resolve, reject) => {
        starlessImg.onload = resolve;
        starlessImg.onerror = reject;
        starlessImg.src = starlessUrl;
      }),
      new Promise((resolve, reject) => {
        starsImg.onload = resolve;
        starsImg.onerror = reject;
        starsImg.src = starsUrl;
      })
    ]);

    // Get original dimensions
    const originalWidth = Math.max(starlessImg.width, starsImg.width);
    const originalHeight = Math.max(starlessImg.height, starsImg.height);
    
    // PERFORMANCE OPTIMIZATION: Scale down large images for processing
    const MAX_PROCESSING_DIMENSION = 2048; // Max dimension for processing
    let scaleFactor = 1;
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;
    
    if (originalWidth > MAX_PROCESSING_DIMENSION || originalHeight > MAX_PROCESSING_DIMENSION) {
      scaleFactor = MAX_PROCESSING_DIMENSION / Math.max(originalWidth, originalHeight);
      targetWidth = Math.round(originalWidth * scaleFactor);
      targetHeight = Math.round(originalHeight * scaleFactor);
      console.log(`Scaling large images for performance: ${originalWidth}x${originalHeight} -> ${targetWidth}x${targetHeight} (factor: ${scaleFactor.toFixed(3)})`);
    }
    
    // Resize both images to target dimensions
    if (starlessImg.width !== targetWidth || starlessImg.height !== targetHeight || 
        starsImg.width !== targetWidth || starsImg.height !== targetHeight) {
      
      const resizedStarless = await this.resizeImage(starlessImg, targetWidth, targetHeight);
      starlessImg.src = resizedStarless.toDataURL();
      await new Promise(resolve => { starlessImg.onload = resolve; });
      
      const resizedStars = await this.resizeImage(starsImg, targetWidth, targetHeight);
      starsImg.src = resizedStars.toDataURL();
      await new Promise(resolve => { starsImg.onload = resolve; });
    }

    return { 
      starlessImg, 
      starsImg, 
      scaleFactor,
      originalSize: { width: originalWidth, height: originalHeight }
    };
  }

  /**
   * Resize image to target dimensions
   */
  private async resizeImage(img: HTMLImageElement, targetWidth: number, targetHeight: number): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    // Draw image centered and scaled to fit while maintaining aspect ratio
    const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const offsetX = (targetWidth - scaledWidth) / 2;
    const offsetY = (targetHeight - scaledHeight) / 2;
    
    // Fill with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    
    // Draw resized image
    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
    
    return canvas;
  }

  /**
   * ENHANCED: Multi-scale depth analysis for superior 3D representation
   */
  createAdvancedDepthMap(starlessImg: HTMLImageElement, blur: number): {
    primaryDepth: HTMLCanvasElement;
    structureDepth: HTMLCanvasElement;
    edgeDepth: HTMLCanvasElement;
    combinedDepth: HTMLCanvasElement;
  } {
    const width = starlessImg.width;
    const height = starlessImg.height;
    
    // Set up processing canvas
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.drawImage(starlessImg, 0, 0);
    
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 1. PRIMARY DEPTH: Enhanced luminance with perceptual weighting
    const primaryCanvas = document.createElement('canvas');
    const primaryCtx = primaryCanvas.getContext('2d')!;
    primaryCanvas.width = width;
    primaryCanvas.height = height;
    
    const primaryData = new ImageData(width, height);
    for (let i = 0; i < data.length; i += 4) {
      // Enhanced luminance with blue bias for nebula depth perception
      const luminance = 0.2 * data[i] + 0.5 * data[i + 1] + 0.8 * data[i + 2];
      const enhancedLum = Math.pow(luminance / 255, 0.8) * 255; // Gamma correction for depth
      primaryData.data[i] = primaryData.data[i + 1] = primaryData.data[i + 2] = enhancedLum;
      primaryData.data[i + 3] = 255;
    }
    primaryCtx.putImageData(primaryData, 0, 0);
    
    if (blur > 0) {
      primaryCtx.filter = `blur(${blur}px)`;
      primaryCtx.drawImage(primaryCanvas, 0, 0);
      primaryCtx.filter = 'none';
    }
    
    // 2. STRUCTURE DEPTH: Edge-aware depth mapping
    const structureCanvas = this.createStructureDepthMap(imageData, width, height);
    
    // 3. EDGE DEPTH: Preserve sharp boundaries
    const edgeCanvas = this.createEdgeDepthMap(imageData, width, height);
    
    // 4. COMBINED DEPTH: Intelligent fusion of all depth layers
    const combinedCanvas = this.fuseDepthMaps(primaryCanvas, structureCanvas, edgeCanvas);
    
    return {
      primaryDepth: primaryCanvas,
      structureDepth: structureCanvas,
      edgeDepth: edgeCanvas,
      combinedDepth: combinedCanvas
    };
  }

  /**
   * Create structure-aware depth map using gradient analysis
   */
  private createStructureDepthMap(imageData: ImageData, width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    
    const data = imageData.data;
    const structureData = new ImageData(width, height);
    
    // Analyze local gradients and structures
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate gradients in all directions
        const gradients = this.calculateGradients(data, x, y, width);
        const gradientMagnitude = Math.sqrt(gradients.gx * gradients.gx + gradients.gy * gradients.gy);
        
        // Local contrast analysis for structure detection
        const localContrast = this.calculateLocalContrast(data, x, y, width, height, 3);
        
        // Combine gradient and contrast for structure depth
        const structureDepth = Math.min(255, gradientMagnitude * 0.5 + localContrast * 0.8);
        
        structureData.data[idx] = structureData.data[idx + 1] = structureData.data[idx + 2] = structureDepth;
        structureData.data[idx + 3] = 255;
      }
    }
    
    ctx.putImageData(structureData, 0, 0);
    
    // Smooth structure map
    ctx.filter = 'blur(1px)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
    
    return canvas;
  }

  /**
   * Create edge-preserving depth map
   */
  private createEdgeDepthMap(imageData: ImageData, width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    
    const data = imageData.data;
    const edgeData = new ImageData(width, height);
    
    // Sobel edge detection with depth assignment
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Sobel operators
        const sobelX = this.applySobelX(data, x, y, width);
        const sobelY = this.applySobelY(data, x, y, width);
        const edgeStrength = Math.sqrt(sobelX * sobelX + sobelY * sobelY);
        
        // Edge-based depth: stronger edges = more forward
        const edgeDepth = Math.min(255, edgeStrength * 2);
        
        edgeData.data[idx] = edgeData.data[idx + 1] = edgeData.data[idx + 2] = 255 - edgeDepth; // Invert for depth
        edgeData.data[idx + 3] = 255;
      }
    }
    
    ctx.putImageData(edgeData, 0, 0);
    return canvas;
  }

  /**
   * Intelligently fuse multiple depth maps
   */
  private fuseDepthMaps(primary: HTMLCanvasElement, structure: HTMLCanvasElement, edge: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = primary.width;
    canvas.height = primary.height;
    
    const width = primary.width;
    const height = primary.height;
    
    // Get data from all depth maps
    const primaryData = primary.getContext('2d')!.getImageData(0, 0, width, height);
    const structureData = structure.getContext('2d')!.getImageData(0, 0, width, height);
    const edgeData = edge.getContext('2d')!.getImageData(0, 0, width, height);
    
    const fusedData = new ImageData(width, height);
    
    for (let i = 0; i < primaryData.data.length; i += 4) {
      const primaryVal = primaryData.data[i] / 255;
      const structureVal = structureData.data[i] / 255;
      const edgeVal = edgeData.data[i] / 255;
      
      // Intelligent fusion with adaptive weights
      const structureWeight = Math.min(1, structureVal * 2); // More weight for high-structure areas
      const edgeWeight = Math.min(1, (1 - edgeVal) * 1.5); // More weight for edge areas
      
      // Combine with adaptive weighting
      const fusedVal = (
        primaryVal * 0.5 +
        structureVal * structureWeight * 0.3 +
        edgeVal * edgeWeight * 0.2
      ) * 255;
      
      fusedData.data[i] = fusedData.data[i + 1] = fusedData.data[i + 2] = Math.min(255, fusedVal);
      fusedData.data[i + 3] = 255;
    }
    
    ctx.putImageData(fusedData, 0, 0);
    
    // Final smoothing
    ctx.filter = 'blur(0.5px)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
    
    return canvas;
  }

  /**
   * Calculate gradients at a point
   */
  private calculateGradients(data: Uint8ClampedArray, x: number, y: number, width: number) {
    const getPixel = (px: number, py: number) => {
      const idx = (py * width + px) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    };
    
    const gx = (getPixel(x + 1, y) - getPixel(x - 1, y)) / 2;
    const gy = (getPixel(x, y + 1) - getPixel(x, y - 1)) / 2;
    
    return { gx, gy };
  }

  /**
   * Calculate local contrast in a neighborhood
   */
  private calculateLocalContrast(data: Uint8ClampedArray, x: number, y: number, width: number, height: number, radius: number): number {
    let min = 255, max = 0;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.max(0, Math.min(width - 1, x + dx));
        const py = Math.max(0, Math.min(height - 1, y + dy));
        const idx = (py * width + px) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        
        min = Math.min(min, luminance);
        max = Math.max(max, luminance);
      }
    }
    
    return max - min;
  }

  /**
   * Apply Sobel X operator
   */
  private applySobelX(data: Uint8ClampedArray, x: number, y: number, width: number): number {
    const getPixel = (px: number, py: number) => {
      const idx = (py * width + px) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    };
    
    return (
      -1 * getPixel(x - 1, y - 1) + 1 * getPixel(x + 1, y - 1) +
      -2 * getPixel(x - 1, y) + 2 * getPixel(x + 1, y) +
      -1 * getPixel(x - 1, y + 1) + 1 * getPixel(x + 1, y + 1)
    );
  }

  /**
   * Apply Sobel Y operator
   */
  private applySobelY(data: Uint8ClampedArray, x: number, y: number, width: number): number {
    const getPixel = (px: number, py: number) => {
      const idx = (py * width + px) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    };
    
    return (
      -1 * getPixel(x - 1, y - 1) + -2 * getPixel(x, y - 1) + -1 * getPixel(x + 1, y - 1) +
      1 * getPixel(x - 1, y + 1) + 2 * getPixel(x, y + 1) + 1 * getPixel(x + 1, y + 1)
    );
  }

  /**
   * Legacy method for backward compatibility
   */
  createLuminanceMap(starlessImg: HTMLImageElement, blur: number): HTMLCanvasElement {
    const depthMaps = this.createAdvancedDepthMap(starlessImg, blur);
    return depthMaps.combinedDepth;
  }

  /**
   * FIXED: Simple and reliable displacement without black boxes or doubling
   */
  applyAdvancedDisplacement(
    source: HTMLImageElement | HTMLCanvasElement, 
    depthMaps: { primaryDepth: HTMLCanvasElement; structureDepth: HTMLCanvasElement; edgeDepth: HTMLCanvasElement; combinedDepth: HTMLCanvasElement },
    horizontalAmount: number
  ): HTMLCanvasElement {
    const width = source.width;
    const height = source.height;
    
    // Use only the primary depth for reliable displacement
    const depthData = depthMaps.primaryDepth.getContext('2d')!.getImageData(0, 0, width, height);
    
    // Set up canvas
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.drawImage(source, 0, 0);
    const originalData = this.ctx.getImageData(0, 0, width, height);
    
    const displacedData = this.ctx.createImageData(width, height);
    
    // Initialize with black background
    for (let i = 0; i < displacedData.data.length; i += 4) {
      displacedData.data[i] = 0;     // R
      displacedData.data[i + 1] = 0; // G
      displacedData.data[i + 2] = 0; // B
      displacedData.data[i + 3] = 255; // A
    }
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Simple depth-based displacement
        const depth = depthData.data[idx] / 255;
        const displacement = Math.round((depth - 0.5) * horizontalAmount);
        
        // Source position
        const srcX = x - displacement;
        
        // Only process pixels within bounds
        if (srcX >= 0 && srcX < width) {
          const srcIdx = (y * width + srcX) * 4;
          
          // Direct pixel copy - no interpolation to avoid artifacts
          displacedData.data[idx] = originalData.data[srcIdx];
          displacedData.data[idx + 1] = originalData.data[srcIdx + 1];
          displacedData.data[idx + 2] = originalData.data[srcIdx + 2];
          displacedData.data[idx + 3] = 255;
        }
        // Out-of-bounds pixels remain black (already initialized)
      }
    }
    
    const resultCanvas = document.createElement('canvas');
    const resultCtx = resultCanvas.getContext('2d')!;
    resultCanvas.width = width;
    resultCanvas.height = height;
    resultCtx.putImageData(displacedData, 0, 0);
    
    return resultCanvas;
  }

  /**
   * OPTIMIZED: Chunked displacement processing for better performance
   */
  async applyOptimizedDisplacement(
    source: HTMLImageElement | HTMLCanvasElement,
    depthMaps: { primaryDepth: HTMLCanvasElement; structureDepth: HTMLCanvasElement; edgeDepth: HTMLCanvasElement; combinedDepth: HTMLCanvasElement },
    horizontalAmount: number,
    onProgress?: (step: string, progress?: number) => void
  ): Promise<HTMLCanvasElement> {
    return OptimizedDisplacementProcessor.applyOptimizedDisplacement(
      source, 
      depthMaps, 
      horizontalAmount, 
      onProgress
    );
  }

  /**
   * Legacy method for backward compatibility
   */
  applyDisplacementFilter(
    starlessImg: HTMLImageElement, 
    luminanceMap: HTMLCanvasElement, 
    horizontalAmount: number
  ): HTMLCanvasElement {
    // Use advanced displacement with simplified depth map structure
    const depthMaps = {
      primaryDepth: luminanceMap,
      structureDepth: luminanceMap,
      edgeDepth: luminanceMap,
      combinedDepth: luminanceMap
    };
    return this.applyAdvancedDisplacement(starlessImg, depthMaps, horizontalAmount);
  }

  /**
   * ENHANCED: Detect full star patterns including diffraction spikes (Newtonian, JWST, etc.)
   */
  detectStarPatterns(starsImg: HTMLImageElement): Array<{ 
    centerX: number; 
    centerY: number; 
    brightness: number;
    pattern: 'point' | 'newtonian' | 'jwst' | 'complex';
    boundingBox: { x: number; y: number; width: number; height: number };
    spikes?: Array<{ angle: number; length: number }>;
  }> {
    this.canvas.width = starsImg.width;
    this.canvas.height = starsImg.height;
    this.ctx.drawImage(starsImg, 0, 0);
    
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    const stars: Array<{ 
      centerX: number; 
      centerY: number; 
      brightness: number;
      pattern: 'point' | 'newtonian' | 'jwst' | 'complex';
      boundingBox: { x: number; y: number; width: number; height: number };
      spikes?: Array<{ angle: number; length: number }>;
    }> = [];
    
    const threshold = 60; // Lower threshold to catch fainter spike components
    const minDistance = 15; // Larger distance to avoid detecting same star multiple times
    const stepSize = 2;
    
    // Find star centers first
    const starCenters: Array<{ x: number; y: number; brightness: number }> = [];
    
    for (let y = 5; y < height - 5; y += stepSize) {
      for (let x = 5; x < width - 5; x += stepSize) {
        const idx = (y * width + x) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        
        if (luminance < threshold) continue;
        
        // Check if it's a local maximum
        let isLocalMax = true;
        let maxLuminance = luminance;
        
        for (let dy = -2; dy <= 2 && isLocalMax; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            const nLuminance = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2];
            
            if (nLuminance > luminance) {
              isLocalMax = false;
            }
            maxLuminance = Math.max(maxLuminance, nLuminance);
          }
        }
        
        if (isLocalMax && luminance > threshold * 1.5) {
          // Check minimum distance
          let tooClose = false;
          for (const existing of starCenters) {
            const dx = x - existing.x;
            const dy = y - existing.y;
            const distanceSquared = dx * dx + dy * dy;
            
            if (distanceSquared < minDistance * minDistance) {
              tooClose = true;
              if (luminance > existing.brightness) {
                existing.x = x;
                existing.y = y;
                existing.brightness = luminance;
              }
              break;
            }
          }
          
          if (!tooClose) {
            starCenters.push({ x, y, brightness: luminance });
          }
        }
      }
    }
    
    // Analyze each star center to detect diffraction patterns
    for (const center of starCenters.slice(0, 50)) { // Limit to 50 brightest for performance
      const pattern = this.analyzeStarPattern(data, center.x, center.y, width, height);
      stars.push({
        centerX: center.x,
        centerY: center.y,
        brightness: center.brightness,
        pattern: pattern.type,
        boundingBox: pattern.boundingBox,
        spikes: pattern.spikes
      });
    }
    
    return stars.sort((a, b) => b.brightness - a.brightness);
  }

  /**
   * Analyze individual star to detect diffraction pattern type and extent
   */
  private analyzeStarPattern(
    data: Uint8ClampedArray, 
    centerX: number, 
    centerY: number, 
    width: number, 
    height: number
  ): {
    type: 'point' | 'newtonian' | 'jwst' | 'complex';
    boundingBox: { x: number; y: number; width: number; height: number };
    spikes?: Array<{ angle: number; length: number }>;
  } {
    const maxRadius = 25; // Maximum search radius for spikes
    const spikeThreshold = 40; // Minimum brightness for spike detection
    
    // Sample in 8 directions to detect spikes
    const directions = [
      { angle: 0, dx: 1, dy: 0 },      // Right
      { angle: 45, dx: 1, dy: 1 },     // Bottom-right
      { angle: 90, dx: 0, dy: 1 },     // Down
      { angle: 135, dx: -1, dy: 1 },   // Bottom-left
      { angle: 180, dx: -1, dy: 0 },   // Left
      { angle: 225, dx: -1, dy: -1 },  // Top-left
      { angle: 270, dx: 0, dy: -1 },   // Up
      { angle: 315, dx: 1, dy: -1 }    // Top-right
    ];
    
    const detectedSpikes: Array<{ angle: number; length: number }> = [];
    let minX = centerX, maxX = centerX, minY = centerY, maxY = centerY;
    
    // Check each direction for spikes
    for (const dir of directions) {
      let spikeLength = 0;
      let consecutiveBright = 0;
      
      for (let r = 3; r <= maxRadius; r++) {
        const x = Math.round(centerX + dir.dx * r);
        const y = Math.round(centerY + dir.dy * r);
        
        if (x < 0 || x >= width || y < 0 || y >= height) break;
        
        const idx = (y * width + x) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        
        if (luminance > spikeThreshold) {
          consecutiveBright++;
          spikeLength = r;
          
          // Expand bounding box
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        } else {
          if (consecutiveBright < 2) {
            consecutiveBright = 0;
          } else {
            break; // End of spike
          }
        }
      }
      
      // Consider it a spike if it extends at least 4 pixels
      if (spikeLength >= 4 && consecutiveBright >= 3) {
        detectedSpikes.push({ angle: dir.angle, length: spikeLength });
      }
    }
    
    // Add padding to bounding box
    const padding = 3;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);
    
    // Determine pattern type based on spike configuration
    let patternType: 'point' | 'newtonian' | 'jwst' | 'complex' = 'point';
    
    if (detectedSpikes.length === 0) {
      patternType = 'point';
    } else if (detectedSpikes.length === 4) {
      // Check if spikes form cross pattern (Newtonian)
      const angles = detectedSpikes.map(s => s.angle).sort((a, b) => a - b);
      if (Math.abs(angles[0] - 0) < 20 && Math.abs(angles[1] - 90) < 20 && 
          Math.abs(angles[2] - 180) < 20 && Math.abs(angles[3] - 270) < 20) {
        patternType = 'newtonian';
      } else {
        patternType = 'complex';
      }
    } else if (detectedSpikes.length === 6) {
      // JWST-like hexagonal pattern
      patternType = 'jwst';
    } else if (detectedSpikes.length > 0) {
      patternType = 'complex';
    }
    
    return {
      type: patternType,
      boundingBox: {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
      },
      spikes: detectedSpikes.length > 0 ? detectedSpikes : undefined
    };
  }

  /**
   * Create stereo pair using CORRECT traditional morphing method from photographingspace.com
   */
  async createTraditionalStereoPair(
    inputs: TraditionalInputs, 
    params: TraditionalMorphParams,
    onProgress?: (step: string, progress?: number) => void
  ): Promise<{ leftCanvas: HTMLCanvasElement; rightCanvas: HTMLCanvasElement; depthMap: HTMLCanvasElement }> {
    
    onProgress?.('Loading and optimizing images for processing...', 10);
    const { starlessImg, starsImg, scaleFactor, originalSize } = await this.loadImages(inputs);
    
    const width = starlessImg.width;
    const height = starlessImg.height;
    
    onProgress?.('Creating advanced multi-layer depth analysis...', 20);
    const depthMaps = this.createAdvancedDepthMap(starlessImg, params.luminanceBlur);
    
    onProgress?.('Detecting star patterns including diffraction spikes...', 35);
    const starPatterns = this.detectStarPatterns(starsImg);
    console.log(`Detected ${starPatterns.length} star patterns: ${starPatterns.filter(s => s.pattern !== 'point').length} with diffraction spikes`);
    
    // Log pattern distribution
    const patternCounts = starPatterns.reduce((acc, star) => {
      acc[star.pattern] = (acc[star.pattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('Pattern distribution:', patternCounts);
    
    onProgress?.('Creating left view (original complete image)...', 50);
    // LEFT VIEW: Original complete image (starless + stars)
    const leftCanvas = document.createElement('canvas');
    const leftCtx = leftCanvas.getContext('2d')!;
    leftCanvas.width = width;
    leftCanvas.height = height;
    
    // Draw starless background
    leftCtx.drawImage(starlessImg, 0, 0);
    
    // Add stars with screen blending
    leftCtx.globalCompositeOperation = 'screen';
    leftCtx.drawImage(starsImg, 0, 0);
    leftCtx.globalCompositeOperation = 'source-over';
    
    onProgress?.('Creating right view using correct JP methodology...', 65);
    // RIGHT VIEW: Following exact JP methodology from photographingspace.com
    const rightCanvas = document.createElement('canvas');
    const rightCtx = rightCanvas.getContext('2d')!;
    rightCanvas.width = width;
    rightCanvas.height = height;
    
    // Step 1: Draw starless nebula as base layer
    rightCtx.drawImage(starlessImg, 0, 0);
    
    // Step 2: Add star layer with initial LEFT shift (2-3 pixels behind nebula)
    const initialLeftShift = -3; // ALL stars start 2-3 pixels left (behind nebula)
    
    // Create canvas for shifted star layer
    const shiftedStarsCanvas = document.createElement('canvas');
    const shiftedStarsCtx = shiftedStarsCanvas.getContext('2d')!;
    shiftedStarsCanvas.width = width;
    shiftedStarsCanvas.height = height;
    
    // Draw all stars shifted left initially (behind nebula)
    shiftedStarsCtx.drawImage(starsImg, initialLeftShift, 0);
    
    // Add this shifted star layer with screen blending
    rightCtx.globalCompositeOperation = 'screen';
    rightCtx.drawImage(shiftedStarsCanvas, 0, 0);
    
    onProgress?.('Moving complete star patterns (including spikes) - NO BLACK BOXES...', 75);
    // Step 3: ENHANCED pattern-aware star repositioning with full spike support
    
    let repositionedStars = 0;
    const brightStars = starPatterns.filter(star => star.brightness / 255 > 0.35).slice(0, 15); // Brightest stars with patterns
    
    // Create removal mask for original star positions
    const starRemovalMaskCanvas = document.createElement('canvas');
    const starRemovalMaskCtx = starRemovalMaskCanvas.getContext('2d')!;
    starRemovalMaskCanvas.width = width;
    starRemovalMaskCanvas.height = height;
    starRemovalMaskCtx.fillStyle = 'white';
    starRemovalMaskCtx.fillRect(0, 0, width, height);
    
    // Create repositioned stars canvas
    const repositionedStarsCanvas = document.createElement('canvas');
    const repositionedStarsCtx = repositionedStarsCanvas.getContext('2d')!;
    repositionedStarsCanvas.width = width;
    repositionedStarsCanvas.height = height;
    
    // Track processed areas
    const processedAreas: Array<{x: number, y: number, w: number, h: number}> = [];
    
    // Process each star pattern (center + spikes as complete unit)
    for (const star of brightStars) {
      const brightnessFactor = star.brightness / 255;
      let forwardShift = params.starShiftAmount * (1 + brightnessFactor);
      
      // Use the full bounding box of the star pattern (includes spikes)
      const bbox = star.boundingBox;
      const originalShiftedX = Math.max(0, Math.min(width - bbox.width, bbox.x + initialLeftShift));
      const finalX = Math.max(0, Math.min(width - bbox.width, bbox.x + initialLeftShift + forwardShift));
      
      // Check for overlap with already processed areas
      let hasOverlap = false;
      for (const area of processedAreas) {
        if (!(finalX >= area.x + area.w || finalX + bbox.width <= area.x || 
              bbox.y >= area.y + area.h || bbox.y + bbox.height <= area.y)) {
          hasOverlap = true;
          break;
        }
      }
      
      if (!hasOverlap && finalX + bbox.width < width) {
        // STEP 1: Mark original star pattern position for complete removal
        starRemovalMaskCtx.fillStyle = 'black';
        starRemovalMaskCtx.fillRect(originalShiftedX, bbox.y, bbox.width, bbox.height);
        
        // STEP 2: Move complete star pattern (center + all spikes) to new position
        repositionedStarsCtx.drawImage(
          starsImg, 
          bbox.x, bbox.y, bbox.width, bbox.height,  // Source: full pattern
          finalX, bbox.y, bbox.width, bbox.height   // Dest: repositioned
        );
        
        // Track this area
        processedAreas.push({x: finalX, y: bbox.y, w: bbox.width, h: bbox.height});
        repositionedStars++;
        
        if (repositionedStars <= 3) {
          console.log(`${star.pattern.toUpperCase()} pattern moved: ${bbox.width}x${bbox.height} from ${originalShiftedX} to ${finalX}, spikes: ${star.spikes?.length || 0}`);
        }
      }
    }
    
    // STEP 3: Apply removal mask to eliminate original star patterns completely
    rightCtx.globalCompositeOperation = 'multiply';
    rightCtx.drawImage(starRemovalMaskCanvas, 0, 0);
    
    // STEP 4: Add repositioned complete star patterns
    rightCtx.globalCompositeOperation = 'screen';
    rightCtx.drawImage(repositionedStarsCanvas, 0, 0);
    rightCtx.globalCompositeOperation = 'source-over';
    
    console.log(`Repositioned ${repositionedStars} bright stars forward from background position`);
    
    onProgress?.('Applying optimized displacement with chunked processing...', 90);
    // Step 4: OPTIMIZED displacement processing
    const displacedCanvas = await this.applyOptimizedDisplacement(rightCanvas, depthMaps, params.horizontalDisplace, onProgress);
    
    // Replace right canvas content with displacement result
    rightCtx.clearRect(0, 0, width, height);
    rightCtx.drawImage(displacedCanvas, 0, 0);
    
    onProgress?.('Applying final contrast adjustments...', 95);
    // Apply contrast boost to both views if specified
    if (params.contrastBoost !== 1.0) {
      [leftCtx, rightCtx].forEach(ctx => {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * params.contrastBoost);
          data[i + 1] = Math.min(255, data[i + 1] * params.contrastBoost);
          data[i + 2] = Math.min(255, data[i + 2] * params.contrastBoost);
        }
        
        ctx.putImageData(imageData, 0, 0);
      });
    }
    
    // Scale back to original size if we downscaled for processing
    if (scaleFactor < 1) {
      onProgress?.('Upscaling to original resolution...', 98);
      
      const finalLeftCanvas = document.createElement('canvas');
      const finalRightCanvas = document.createElement('canvas');
      
      finalLeftCanvas.width = originalSize.width;
      finalLeftCanvas.height = originalSize.height;
      finalRightCanvas.width = originalSize.width;
      finalRightCanvas.height = originalSize.height;
      
      const finalLeftCtx = finalLeftCanvas.getContext('2d')!;
      const finalRightCtx = finalRightCanvas.getContext('2d')!;
      
      // High-quality upscaling
      finalLeftCtx.imageSmoothingEnabled = true;
      finalLeftCtx.imageSmoothingQuality = 'high';
      finalRightCtx.imageSmoothingEnabled = true;
      finalRightCtx.imageSmoothingQuality = 'high';
      
      finalLeftCtx.drawImage(leftCanvas, 0, 0, originalSize.width, originalSize.height);
      finalRightCtx.drawImage(rightCanvas, 0, 0, originalSize.width, originalSize.height);
      
      return { 
        leftCanvas: finalLeftCanvas, 
        rightCanvas: finalRightCanvas, 
        depthMap: depthMaps.combinedDepth 
      };
    }

    return { 
      leftCanvas, 
      rightCanvas, 
      depthMap: depthMaps.combinedDepth 
    };
  }

  /**
   * Combine left and right views into final stereo pair with spacing
   */
  createFinalStereoPair(
    leftCanvas: HTMLCanvasElement, 
    rightCanvas: HTMLCanvasElement, 
    spacing: number = 300,
    addBorders: boolean = true
  ): HTMLCanvasElement {
    const width = leftCanvas.width;
    const height = leftCanvas.height;
    
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d')!;
    
    if (addBorders) {
      // Add 600px borders around the entire image
      const borderSize = 600;
      const totalWidth = width * 2 + spacing + (borderSize * 2);
      const totalHeight = height + (borderSize * 2);
      
      finalCanvas.width = totalWidth;
      finalCanvas.height = totalHeight;
      
      // Fill entire canvas with black (creates the border)
      finalCtx.fillStyle = '#000000';
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      // Draw left and right views with border offset
      finalCtx.drawImage(leftCanvas, borderSize, borderSize);
      finalCtx.drawImage(rightCanvas, borderSize + width + spacing, borderSize);
    } else {
      // No borders - standard layout
      finalCanvas.width = width * 2 + spacing;
      finalCanvas.height = height;
      
      // Black background
      finalCtx.fillStyle = '#000000';
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      // Draw left and right views with spacing
      finalCtx.drawImage(leftCanvas, 0, 0);
      finalCtx.drawImage(rightCanvas, width + spacing, 0);
    }
    
    return finalCanvas;
  }

  /**
   * Cleanup resources
   */
  dispose() {
    // Canvas cleanup happens automatically when references are lost
  }
}
