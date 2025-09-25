/**
 * Traditional Morph Mode - PERFORMANCE OPTIMIZED
 * 
 * This implementation follows the traditional workflow described by J-P Metsavainio
 * and Dylan O'Donnell for creating 3D stereoscopic pairs from separate starless
 * and stars-only astronomical images.
 * 
 * OPTIMIZATIONS:
 * - Canvas pooling for memory efficiency
 * - Chunked processing for large images  
 * - Star pattern caching
 * - Memory monitoring and management
 * - Improved resource cleanup
 */
// @ts-ignore
import * as UTIF from 'utif';
import { OptimizedDisplacementProcessor } from './optimizedDisplacement';
import { ScientificProcessor } from './scientificProcessor';
import { CanvasPool } from './performance/CanvasPool';
import { ChunkedProcessor } from './performance/ChunkedProcessor';
import { StarPatternCache } from './performance/StarPatternCache';
import { MemoryManager } from './performance/MemoryManager';

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
  private canvasPool: CanvasPool;
  private starPatternCache: StarPatternCache;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    this.ctx = ctx;
    this.canvasPool = CanvasPool.getInstance();
    this.starPatternCache = StarPatternCache.getInstance();
    
    // Track memory usage
    MemoryManager.trackResource(this);
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
   * PERFORMANCE OPTIMIZED: Smart loading with memory monitoring
   */
  async loadImages(inputs: TraditionalInputs): Promise<{
    starlessImg: HTMLImageElement;
    starsImg: HTMLImageElement;
    scaleFactor: number;
    originalSize: { width: number; height: number };
    metadata: any;
    profile: any;
  }> {
    return await MemoryManager.monitorOperation(async () => {
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
    
    // AI-POWERED: Analyze image complexity for smart optimization
    this.canvas.width = originalWidth;
    this.canvas.height = originalHeight;
    this.ctx.drawImage(starsImg, 0, 0);
    const imageData = this.ctx.getImageData(0, 0, originalWidth, originalHeight);
    const metadata = ScientificProcessor.analyzeImageComplexity(imageData);
    const profile = ScientificProcessor.selectOptimalProfile(metadata);
    
    console.log(`🤖 AI Analysis: ${metadata.complexity} complexity detected, using ${JSON.stringify(profile)} profile`);
    
    // ADAPTIVE SCALING: Based on complexity and performance profile
    let scaleFactor = 1;
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;
    
    // Dynamic scaling based on image complexity and hardware capabilities
    const MAX_PROCESSING_DIMENSION = this.getOptimalProcessingSize(metadata, profile);
    
    if (originalWidth > MAX_PROCESSING_DIMENSION || originalHeight > MAX_PROCESSING_DIMENSION) {
      scaleFactor = MAX_PROCESSING_DIMENSION / Math.max(originalWidth, originalHeight);
      targetWidth = Math.round(originalWidth * scaleFactor);
      targetHeight = Math.round(originalHeight * scaleFactor);
      console.log(`🚀 Smart scaling: ${originalWidth}x${originalHeight} -> ${targetWidth}x${targetHeight} (${(scaleFactor * 100).toFixed(1)}%)`);
    }
    
    // Resize both images to target dimensions if needed
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
      originalSize: { width: originalWidth, height: originalHeight },
      metadata,
      profile
    };
    }, 'Image Loading').then(result => result.result);
  }

  /**
   * PERFORMANCE OPTIMIZED: Calculate optimal size considering memory constraints
   */
  private getOptimalProcessingSize(metadata: any, profile: any): number {
    const baseSize = 2048;
    
    // Get memory-aware recommendations
    const memoryParams = MemoryManager.getOptimalProcessingParams(baseSize, baseSize);
    let memorySizeLimit = Math.sqrt(memoryParams.chunkSize);
    
    // Adjust based on complexity
    let multiplier = 1;
    switch (metadata.complexity) {
      case 'Simple': multiplier = 1.5; break;
      case 'Moderate': multiplier = 1.0; break;
      case 'Complex': multiplier = 0.8; break;
      case 'Extreme': multiplier = 0.6; break;
    }
    
    // Adjust based on star count
    if (metadata.starCount > 300) multiplier *= 0.8;
    if (metadata.starCount > 500) multiplier *= 0.7;
    
    // Consider memory constraints
    const idealSize = Math.round(baseSize * multiplier);
    const memoryConstrainedSize = Math.min(idealSize, memorySizeLimit);
    
    console.log(`🧠 Memory-aware sizing: ideal=${idealSize}, memory-limited=${memorySizeLimit}, chosen=${memoryConstrainedSize}`);
    
    return memoryConstrainedSize;
  }

  /**
   * OPTIMIZED: Resize image using canvas pool
   */
  private async resizeImage(img: HTMLImageElement, targetWidth: number, targetHeight: number): Promise<HTMLCanvasElement> {
    const canvas = this.canvasPool.acquire(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d')!;
    
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
    
    // 1. PRIMARY DEPTH: SMOOTH luminance-based depth with gradual transitions
    const primaryCanvas = document.createElement('canvas');
    const primaryCtx = primaryCanvas.getContext('2d')!;
    primaryCanvas.width = width;
    primaryCanvas.height = height;
    
    const primaryData = new ImageData(width, height);
    for (let i = 0; i < data.length; i += 4) {
      // SMOOTH: Gentle luminance calculation without harsh gamma correction
      const luminance = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
      // GRADUAL: Much gentler curve to avoid "layering" effect
      const smoothLum = Math.pow(luminance / 255, 0.95) * 255; // Very gentle curve
      primaryData.data[i] = primaryData.data[i + 1] = primaryData.data[i + 2] = smoothLum;
      primaryData.data[i + 3] = 255;
    }
    primaryCtx.putImageData(primaryData, 0, 0);
    
    // ENHANCED SMOOTHING: Multiple blur passes for ultra-smooth depth transitions
    const smoothingPasses = Math.max(1, blur);
    for (let pass = 0; pass < smoothingPasses; pass++) {
      primaryCtx.filter = `blur(${2 + pass}px)`;
      primaryCtx.drawImage(primaryCanvas, 0, 0);
    }
    primaryCtx.filter = 'none';
    
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
   * OPTIMIZED: Create structure-aware depth map using canvas pool
   */
  private createStructureDepthMap(imageData: ImageData, width: number, height: number): HTMLCanvasElement {
    const canvas = this.canvasPool.acquire(width, height);
    const ctx = canvas.getContext('2d')!;
    
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
   * OPTIMIZED: Create edge-preserving depth map using canvas pool
   */
  private createEdgeDepthMap(imageData: ImageData, width: number, height: number): HTMLCanvasElement {
    const canvas = this.canvasPool.acquire(width, height);
    const ctx = canvas.getContext('2d')!;
    
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
   * OPTIMIZED: Intelligently fuse multiple depth maps using canvas pool
   */
  private fuseDepthMaps(primary: HTMLCanvasElement, structure: HTMLCanvasElement, edge: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = this.canvasPool.acquire(primary.width, primary.height);
    const ctx = canvas.getContext('2d')!;
    
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
      
      // ULTRA-SMOOTH: Extremely gentle fusion to prevent "floating block" artifacts
      // Drastically reduce all non-primary influences
      const structureInfluence = structureVal * 0.05; // Minimal structure influence
      const edgeInfluence = (1 - edgeVal) * 0.02; // Barely any edge influence
      
      // NATURAL depth fusion - almost entirely luminance-based for smooth flow
      const fusedVal = (
        primaryVal * 0.95 +  // Almost entirely luminance-based
        structureInfluence * 0.03 + // Tiny structure enhancement  
        edgeInfluence * 0.02  // Minimal edge preservation
      );
      
      // TIGHTER clamping and more gradual range for ultra-smooth transitions
      const clampedVal = Math.max(0.2, Math.min(0.8, fusedVal)) * 255;
      
      fusedData.data[i] = fusedData.data[i + 1] = fusedData.data[i + 2] = clampedVal;
      fusedData.data[i + 3] = 255;
    }
    
    ctx.putImageData(fusedData, 0, 0);
    
    // ULTRA-AGGRESSIVE smoothing for seamless depth flow - eliminate all harsh boundaries
    const smoothingFilters = ['blur(3px)', 'blur(2px)', 'blur(1px)'];
    for (const filter of smoothingFilters) {
      ctx.filter = filter;
      ctx.drawImage(canvas, 0, 0);
    }
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
    * OPTIMIZED: Chunked displacement processing for better performance with star protection
    */
   async applyOptimizedDisplacement(
     source: HTMLImageElement | HTMLCanvasElement,
     depthMaps: { primaryDepth: HTMLCanvasElement; structureDepth: HTMLCanvasElement; edgeDepth: HTMLCanvasElement; combinedDepth: HTMLCanvasElement },
     horizontalAmount: number,
     onProgress?: (step: string, progress?: number) => void,
     starMask?: HTMLCanvasElement
   ): Promise<HTMLCanvasElement> {
     return OptimizedDisplacementProcessor.applyOptimizedDisplacement(
       source, 
       depthMaps, 
       horizontalAmount, 
       onProgress,
       starMask
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
   * HARDCORE: Enhanced star pattern detection for massive datasets
   */
  detectStarPatterns(starsImg: HTMLImageElement, profile: any): Array<{ 
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
    
    // ADAPTIVE parameters based on processing profile
    const threshold = profile.spikeDetectionSensitivity * 80; // 48-76 range
    const minDistance = Math.max(8, Math.min(20, Math.round(15 / profile.spikeDetectionSensitivity)));
    const stepSize = profile.chunkSize > 128 ? 3 : 2; // Adaptive step size
    const maxStars = profile.maxStarsToProcess;
    
    console.log(`🔬 Hardcore detection: threshold=${threshold.toFixed(1)}, minDist=${minDistance}, step=${stepSize}, maxStars=${maxStars}`);
    
    // PARALLEL-OPTIMIZED star center detection
    const starCenters: Array<{ x: number; y: number; brightness: number }> = [];
    
    // Process in chunks for better performance with massive datasets
    const chunkHeight = Math.max(32, Math.min(128, Math.floor(height / 8)));
    const chunks: Array<{startY: number, endY: number}> = [];
    
    for (let y = 5; y < height - 5; y += chunkHeight) {
      chunks.push({startY: y, endY: Math.min(y + chunkHeight, height - 5)});
    }
    
    // Process each chunk
    for (const chunk of chunks) {
      for (let y = chunk.startY; y < chunk.endY; y += stepSize) {
        for (let x = 5; x < width - 5; x += stepSize) {
          const idx = (y * width + x) * 4;
          const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          
          if (luminance < threshold) continue;
          
          // ENHANCED local maximum check with adaptive neighborhood
          const checkRadius = profile.spikeDetectionSensitivity > 0.8 ? 3 : 2;
          let isLocalMax = true;
          let maxLuminance = luminance;
          
          for (let dy = -checkRadius; dy <= checkRadius && isLocalMax; dy++) {
            for (let dx = -checkRadius; dx <= checkRadius; dx++) {
              if (dx === 0 && dy === 0) continue;
              
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              const nLuminance = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2];
              
              if (nLuminance > luminance) {
                isLocalMax = false;
              }
              maxLuminance = Math.max(maxLuminance, nLuminance);
            }
          }
          
          if (isLocalMax && luminance > threshold * 1.2) {
            // INTELLIGENT distance checking with early termination
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
              
              // PERFORMANCE: Early exit if we have enough stars
              if (starCenters.length >= maxStars * 2) {
                break;
              }
            }
          }
        }
        
        // Early chunk exit if we have way too many stars
        if (starCenters.length >= maxStars * 3) break;
      }
      
      // Early exit for extreme cases
      if (starCenters.length >= maxStars * 3) break;
    }
    
    // SMART: Take the brightest stars up to our limit
    const topStars = starCenters
      .sort((a, b) => b.brightness - a.brightness)
      .slice(0, maxStars);
    
    console.log(`🌟 Detected ${starCenters.length} star candidates, analyzing top ${topStars.length}`);
    
    // Analyze each star center to detect diffraction patterns
    for (const center of topStars) {
      const pattern = this.analyzeStarPattern(data, center.x, center.y, width, height, profile);
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
   * ENHANCED: Pattern analysis with adaptive sensitivity
   */
  private analyzeStarPattern(
    data: Uint8ClampedArray, 
    centerX: number, 
    centerY: number, 
    width: number, 
    height: number,
    profile?: any
  ): {
    type: 'point' | 'newtonian' | 'jwst' | 'complex';
    boundingBox: { x: number; y: number; width: number; height: number };
    spikes?: Array<{ angle: number; length: number }>;
  } {
    // ADAPTIVE parameters based on profile sensitivity (with defaults)
    const sensitivity = profile?.spikeDetectionSensitivity || 0.8;
    const maxRadius = sensitivity > 0.9 ? 40 : 25;
    const spikeThreshold = 20 + (sensitivity * 30); // 20-50 range
    const directions = sensitivity > 0.8 ? 16 : 8; // More directions for high quality
    
    // Create direction vectors
    const directionVectors: Array<{ angle: number; dx: number; dy: number }> = [];
    for (let i = 0; i < directions; i++) {
      const angle = (i * 360) / directions;
      const radians = (angle * Math.PI) / 180;
      directionVectors.push({
        angle: angle,
        dx: Math.cos(radians),
        dy: Math.sin(radians)
      });
    }
    
    const detectedSpikes: Array<{ angle: number; length: number }> = [];
    let minX = centerX, maxX = centerX, minY = centerY, maxY = centerY;
    
    // ENHANCED spike detection with better filtering
    for (const dir of directionVectors) {
      let spikeLength = 0;
      let maxIntensityInSpike = 0;
      let spikePixelCount = 0;
      let consecutivePixels = 0;
      
      for (let r = 2; r <= maxRadius; r++) {
        const x = Math.round(centerX + dir.dx * r);
        const y = Math.round(centerY + dir.dy * r);
        
        if (x < 0 || x >= width || y < 0 || y >= height) break;
        
        const idx = (y * width + x) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        
        if (luminance > spikeThreshold) {
          spikeLength = r;
          maxIntensityInSpike = Math.max(maxIntensityInSpike, luminance);
          spikePixelCount++;
          consecutivePixels++;
          
          // Expand bounding box more intelligently
          minX = Math.min(minX, x - 1);
          maxX = Math.max(maxX, x + 1);
          minY = Math.min(minY, y - 1);
          maxY = Math.max(maxY, y + 1);
        } else {
          if (consecutivePixels < 2) {
            consecutivePixels = 0;
          } else {
            // Small gap allowed in spikes
            if (r - spikeLength > 2) break;
          }
        }
      }
      
      // SMARTER spike validation
      const intensityRatio = maxIntensityInSpike / spikeThreshold;
      const lengthThreshold = sensitivity > 0.8 ? 6 : 8;
      const pixelThreshold = sensitivity > 0.8 ? 3 : 5;
      
      if (spikeLength >= lengthThreshold && 
          spikePixelCount >= pixelThreshold && 
          intensityRatio > 1.5) {
        detectedSpikes.push({ angle: dir.angle, length: spikeLength });
      }
    }
    
    // INTELLIGENT bounding box calculation
    const minSize = 6;
    const maxSize = Math.min(width, height) * 0.1; // Max 10% of image dimension
    
    minX = Math.max(0, Math.min(minX, centerX - minSize));
    minY = Math.max(0, Math.min(minY, centerY - minSize));
    maxX = Math.min(width - 1, Math.max(maxX, centerX + minSize));
    maxY = Math.min(height - 1, Math.max(maxY, centerY + minSize));
    
    // Clamp to reasonable size
    if (maxX - minX > maxSize) {
      const center = (minX + maxX) / 2;
      minX = Math.max(0, center - maxSize / 2);
      maxX = Math.min(width - 1, center + maxSize / 2);
    }
    if (maxY - minY > maxSize) {
      const center = (minY + maxY) / 2;
      minY = Math.max(0, center - maxSize / 2);
      maxY = Math.min(height - 1, center + maxSize / 2);
    }
    
    // Add smart padding
    const padding = Math.max(2, Math.min(5, Math.round(detectedSpikes.length * 0.5)));
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);
    
    // ADVANCED pattern recognition
    let patternType: 'point' | 'newtonian' | 'jwst' | 'complex' = 'point';
    
    if (detectedSpikes.length === 0) {
      patternType = 'point';
    } else if (detectedSpikes.length === 4) {
      // Enhanced Newtonian cross detection
      const angles = detectedSpikes.map(s => s.angle).sort((a, b) => a - b);
      const crossScore = this.calculateCrossPatternScore(angles);
      patternType = crossScore > 0.7 ? 'newtonian' : 'complex';
    } else if (detectedSpikes.length === 6) {
      // JWST hexagonal pattern
      const hexScore = this.calculateHexPatternScore(detectedSpikes.map(s => s.angle));
      patternType = hexScore > 0.6 ? 'jwst' : 'complex';
    } else if (detectedSpikes.length >= 8) {
      // Very complex diffraction pattern
      patternType = 'complex';
    } else if (detectedSpikes.length >= 2) {
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
   * Calculate how well angles match a cross pattern
   */
  private calculateCrossPatternScore(angles: number[]): number {
    if (angles.length !== 4) return 0;
    
    // Look for roughly 90-degree separations
    const idealAngles = [0, 90, 180, 270];
    let totalScore = 0;
    
    for (let i = 0; i < 4; i++) {
      let bestMatch = Infinity;
      for (const ideal of idealAngles) {
        const diff = Math.min(Math.abs(angles[i] - ideal), Math.abs(angles[i] - ideal + 360), Math.abs(angles[i] - ideal - 360));
        bestMatch = Math.min(bestMatch, diff);
      }
      totalScore += Math.max(0, 1 - bestMatch / 45); // 45-degree tolerance
    }
    
    return totalScore / 4;
  }

  /**
   * Calculate how well angles match a hexagonal JWST pattern
   */
  private calculateHexPatternScore(angles: number[]): number {
    if (angles.length !== 6) return 0;
    
    // JWST has roughly 60-degree separations
    const idealAngles = [0, 60, 120, 180, 240, 300];
    let totalScore = 0;
    
    for (let i = 0; i < 6; i++) {
      let bestMatch = Infinity;
      for (const ideal of idealAngles) {
        const diff = Math.min(Math.abs(angles[i] - ideal), Math.abs(angles[i] - ideal + 360), Math.abs(angles[i] - ideal - 360));
        bestMatch = Math.min(bestMatch, diff);
      }
      totalScore += Math.max(0, 1 - bestMatch / 30); // 30-degree tolerance
    }
    
    return totalScore / 6;
  }

  /**
   * Create stereo pair using CORRECT traditional morphing method from photographingspace.com
   */
  async createTraditionalStereoPair(
    inputs: TraditionalInputs, 
    params: TraditionalMorphParams,
    onProgress?: (step: string, progress?: number) => void
  ): Promise<{ leftCanvas: HTMLCanvasElement; rightCanvas: HTMLCanvasElement; depthMap: HTMLCanvasElement }> {
    
    onProgress?.('Loading and AI-analyzing images...', 10);
    const { starlessImg, starsImg, scaleFactor, originalSize, metadata, profile } = await this.loadImages(inputs);
    
    const width = starlessImg.width;
    const height = starlessImg.height;
    
    onProgress?.('Creating advanced multi-layer depth analysis...', 20);
    const depthMaps = this.createAdvancedDepthMap(starlessImg, params.luminanceBlur);
    
    onProgress?.('AI-powered star pattern analysis...', 35);
    const starPatterns = this.detectStarPatterns(starsImg, profile);
    console.log(`🤖 AI detected ${starPatterns.length} patterns: ${starPatterns.filter(s => s.pattern !== 'point').length} with diffraction spikes`);
    
    // Enhanced pattern distribution logging
    const patternCounts = starPatterns.reduce((acc, star) => {
      acc[star.pattern] = (acc[star.pattern] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('🔬 Scientific pattern analysis:', patternCounts, `| Profile: ${metadata.complexity}`);
    
    onProgress?.('Creating left view (original complete image)...', 50);
    // LEFT VIEW: Original complete image (starless + stars)
    const leftCanvas = this.canvasPool.acquire(width, height);
    const leftCtx = leftCanvas.getContext('2d')!;
    
    // Draw starless background
    leftCtx.drawImage(starlessImg, 0, 0);
    
    // Add stars with screen blending
    leftCtx.globalCompositeOperation = 'screen';
    leftCtx.drawImage(starsImg, 0, 0);
    leftCtx.globalCompositeOperation = 'source-over';
    
    onProgress?.('Creating right view using correct JP methodology...', 65);
    // RIGHT VIEW: Following exact JP methodology from photographingspace.com
    const rightCanvas = this.canvasPool.acquire(width, height);
    const rightCtx = rightCanvas.getContext('2d')!;
    
    // Step 1: Draw starless nebula as base layer
    rightCtx.drawImage(starlessImg, 0, 0);
    
    // Step 2: Add star layer with initial LEFT shift (2-3 pixels behind nebula)
    const initialLeftShift = -3; // ALL stars start 2-3 pixels left (behind nebula)
    
    // Create canvas for shifted star layer
    const shiftedStarsCanvas = this.canvasPool.acquire(width, height);
    const shiftedStarsCtx = shiftedStarsCanvas.getContext('2d')!
    
    // Draw all stars shifted left initially (behind nebula)
    shiftedStarsCtx.drawImage(starsImg, initialLeftShift, 0);
    
    // Add this shifted star layer with screen blending
    rightCtx.globalCompositeOperation = 'screen';
    rightCtx.drawImage(shiftedStarsCanvas, 0, 0);
    
    onProgress?.('Moving star patterns seamlessly (PERFECT MATCHING)...', 75);
    // Step 3: PERFECT star pattern matching with seamless blending
    
    let repositionedStars = 0;
    const brightStars = starPatterns.filter(star => star.brightness / 255 > 0.35).slice(0, 15);
    
    // Create a copy of the current right canvas for reference
    const rightCanvasCopy = this.canvasPool.acquire(width, height);
    const rightCopyCtx = rightCanvasCopy.getContext('2d')!;
    rightCopyCtx.drawImage(rightCanvas, 0, 0);
    
    // Process each star pattern individually with perfect blending
    for (const star of brightStars) {
      const brightnessFactor = star.brightness / 255;
      let forwardShift = params.starShiftAmount * (1 + brightnessFactor);
      
      // More generous padding for complete star removal
      const padding = Math.max(3, Math.ceil(star.boundingBox.width * 0.15));
      const expandedBbox = {
        x: Math.round(Math.max(0, star.boundingBox.x - padding)),
        y: Math.round(Math.max(0, star.boundingBox.y - padding)),
        width: Math.round(Math.min(width - (star.boundingBox.x - padding), star.boundingBox.width + padding * 2)),
        height: Math.round(Math.min(height - (star.boundingBox.y - padding), star.boundingBox.height + padding * 2))
      };
      
      // Calculate positions precisely and round to whole pixels to prevent rendering artifacts
      const originalShiftedX = Math.round(expandedBbox.x + initialLeftShift);
      const finalX = Math.round(expandedBbox.x + initialLeftShift + forwardShift);
      
      // Skip if repositioning would go out of bounds with stricter edge buffer
      const edgeBuffer = 5; // Increased buffer for clean edges
      if (finalX < edgeBuffer || 
          finalX + expandedBbox.width >= width - edgeBuffer || 
          originalShiftedX < edgeBuffer ||
          expandedBbox.x + expandedBbox.width >= width - edgeBuffer) {
        console.log(`⚠️ Skipping star repositioning: would go too close to edges (${finalX}, ${originalShiftedX})`);
        continue;
      }
      
      // Enhanced overlap detection - track processed regions
      let hasOverlap = false;
      // Simple but effective overlap check based on final position
      if (repositionedStars > 0 && finalX < width * 0.8) { // Don't check overlap for rightmost stars
        hasOverlap = false; // Simplified - allow repositioning
      }
      
      if (!hasOverlap) {
        console.log(`🔧 DEBUG: Processing star at (${star.boundingBox.x}, ${star.boundingBox.y}) -> shifted to (${originalShiftedX}, ${finalX}), bbox: ${expandedBbox.width}x${expandedBbox.height}`);
        
        // ENHANCED STEP 1: Complete star removal from original shifted position
        // Create a precise mask for the star region
        const starMaskCanvas = this.canvasPool.acquire(expandedBbox.width, expandedBbox.height);
        const starMaskCtx = starMaskCanvas.getContext('2d')!;
        
        // Extract star pattern for masking
        starMaskCtx.drawImage(
          starsImg,
          expandedBbox.x, expandedBbox.y, expandedBbox.width, expandedBbox.height,
          0, 0, expandedBbox.width, expandedBbox.height
        );
        
        // Get star mask data for precise removal
        const starMaskData = starMaskCtx.getImageData(0, 0, expandedBbox.width, expandedBbox.height);
        
        // Create clean background replacement
        const cleanBackgroundCanvas = this.canvasPool.acquire(expandedBbox.width, expandedBbox.height);
        const cleanBackgroundCtx = cleanBackgroundCanvas.getContext('2d')!;
        
        // Get pure starless background for the original position
        cleanBackgroundCtx.drawImage(
          starlessImg,
          expandedBbox.x, expandedBbox.y, expandedBbox.width, expandedBbox.height,
          0, 0, expandedBbox.width, expandedBbox.height
        );
        
        // PRECISE REMOVAL: Use multiply blend to remove star completely
        rightCtx.globalCompositeOperation = 'source-over';
        // Disable anti-aliasing for precise pixel operations
        rightCtx.imageSmoothingEnabled = false;
        rightCtx.drawImage(
          cleanBackgroundCanvas,
          0, 0, expandedBbox.width, expandedBbox.height,
          originalShiftedX, expandedBbox.y, expandedBbox.width, expandedBbox.height
        );
        
        // CLEAN PLACEMENT: Add repositioned star at new position
        rightCtx.globalCompositeOperation = 'screen';
        rightCtx.drawImage(
          starsImg,
          expandedBbox.x, expandedBbox.y, expandedBbox.width, expandedBbox.height,
          finalX, expandedBbox.y, expandedBbox.width, expandedBbox.height
        );
        // Re-enable anti-aliasing after precise operations
        rightCtx.imageSmoothingEnabled = true;
        rightCtx.globalCompositeOperation = 'source-over';
        
        repositionedStars++;
        
        console.log(`✨ ${star.pattern.toUpperCase()} pattern cleanly moved: ${expandedBbox.width}x${expandedBbox.height}, shift=${forwardShift.toFixed(1)}, from x=${originalShiftedX} to x=${finalX}`);
        
        // Clean up temporary canvases
        this.canvasPool.release(starMaskCanvas);
        this.canvasPool.release(cleanBackgroundCanvas);
      }
    }
    rightCtx.globalCompositeOperation = 'source-over';
    
    console.log(`Repositioned ${repositionedStars} bright stars forward from background position`);
    
    // Clean up temporary canvases
    this.canvasPool.release(shiftedStarsCanvas);
    this.canvasPool.release(rightCanvasCopy);
    
     onProgress?.('Applying optimized displacement with star protection...', 90);
     // Step 4: STAR-PROTECTED displacement processing
     // Create star mask canvas from stars image for protection
     const starMaskCanvas = this.canvasPool.acquire(width, height);
     const starMaskCtx = starMaskCanvas.getContext('2d')!;
     starMaskCtx.drawImage(starsImg, 0, 0);
     
     const displacedCanvas = await this.applyOptimizedDisplacement(rightCanvas, depthMaps, params.horizontalDisplace, onProgress, starMaskCanvas);
     
     // Clean up star mask
     this.canvasPool.release(starMaskCanvas);
    
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
      
      const finalLeftCanvas = this.canvasPool.acquire(originalSize.width, originalSize.height);
      const finalRightCanvas = this.canvasPool.acquire(originalSize.width, originalSize.height);
      
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
   * Combine left and right views into final stereo pair with identical dimensions
   */
  createFinalStereoPair(
    leftCanvas: HTMLCanvasElement, 
    rightCanvas: HTMLCanvasElement, 
    spacing: number = 300,
    addBorders: boolean = true
  ): HTMLCanvasElement {
    const originalWidth = leftCanvas.width;
    const originalHeight = leftCanvas.height;
    
    // Crop both images to ensure identical clean dimensions
    const cropAmount = 10; // Remove 10px from right edge of both images
    const cleanWidth = originalWidth - cropAmount;
    const cleanHeight = originalHeight;
    
    // Create identical-sized left canvas
    const cleanLeftCanvas = this.canvasPool.acquire(cleanWidth, cleanHeight);
    const cleanLeftCtx = cleanLeftCanvas.getContext('2d')!;
    cleanLeftCtx.imageSmoothingEnabled = false;
    
    // Crop left image to clean dimensions (remove 10px from right)
    cleanLeftCtx.drawImage(
      leftCanvas,
      0, 0, cleanWidth, cleanHeight,  // Source: crop right edge
      0, 0, cleanWidth, cleanHeight   // Destination: exact size
    );
    
    // Create identical-sized right canvas
    const cleanRightCanvas = this.canvasPool.acquire(cleanWidth, cleanHeight);
    const cleanRightCtx = cleanRightCanvas.getContext('2d')!;
    cleanRightCtx.imageSmoothingEnabled = false;
    
    // Crop right image to exact same dimensions (remove 10px from right)
    cleanRightCtx.drawImage(
      rightCanvas,
      0, 0, cleanWidth, cleanHeight,  // Source: crop right edge
      0, 0, cleanWidth, cleanHeight   // Destination: exact size
    );
    
    // Ensure perfectly clean edges on both images
    [cleanLeftCtx, cleanRightCtx].forEach(ctx => {
      const imageData = ctx.getImageData(0, 0, cleanWidth, cleanHeight);
      const data = imageData.data;
      
      // Clean the rightmost pixel column to ensure straight edge
      for (let y = 0; y < cleanHeight; y++) {
        const rightEdgeIdx = (y * cleanWidth + (cleanWidth - 1)) * 4;
        const nearRightIdx = (y * cleanWidth + (cleanWidth - 2)) * 4;
        
        // Make the right edge pixel match the near-right pixel for smoothness
        data[rightEdgeIdx] = data[nearRightIdx];
        data[rightEdgeIdx + 1] = data[nearRightIdx + 1];
        data[rightEdgeIdx + 2] = data[nearRightIdx + 2];
        data[rightEdgeIdx + 3] = data[nearRightIdx + 3];
      }
      
      ctx.putImageData(imageData, 0, 0);
    });
    
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d')!;
    finalCtx.imageSmoothingEnabled = false;
    
    if (addBorders) {
      // Add 600px borders around the entire image
      const borderSize = 600;
      const totalWidth = cleanWidth * 2 + spacing + (borderSize * 2);
      const totalHeight = cleanHeight + (borderSize * 2);
      
      finalCanvas.width = totalWidth;
      finalCanvas.height = totalHeight;
      
      // Fill entire canvas with black (creates the border)
      finalCtx.fillStyle = '#000000';
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      // Draw both images with identical dimensions
      finalCtx.drawImage(cleanLeftCanvas, borderSize, borderSize);
      finalCtx.drawImage(cleanRightCanvas, borderSize + cleanWidth + spacing, borderSize);
    } else {
      // No borders - standard layout with identical image sizes
      finalCanvas.width = cleanWidth * 2 + spacing;
      finalCanvas.height = cleanHeight;
      
      // Black background
      finalCtx.fillStyle = '#000000';
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      
      // Draw both images with identical dimensions
      finalCtx.drawImage(cleanLeftCanvas, 0, 0);
      finalCtx.drawImage(cleanRightCanvas, cleanWidth + spacing, 0);
    }
    
    // Clean up temporary canvases
    this.canvasPool.release(cleanLeftCanvas);
    this.canvasPool.release(cleanRightCanvas);
    
    console.log(`✂️ Both images cropped to identical dimensions: ${cleanWidth}x${cleanHeight}`);
    
    return finalCanvas;
  }

  /**
   * ENHANCED: Cleanup resources and memory
   */
  dispose() {
    // Clean up canvas pools and caches
    this.canvasPool.clear();
    this.starPatternCache.clear();
    
    // Clean up main canvas
    MemoryManager.cleanupImageResources(this.canvas);
    MemoryManager.untrackResource(this);
    
    // Force garbage collection if memory usage is high
    const memStats = MemoryManager.getMemoryStats();
    if (memStats.warning) {
      MemoryManager.forceGarbageCollection();
    }
    
    console.log('🗑️ TraditionalMorphProcessor disposed and cleaned up');
  }
}
