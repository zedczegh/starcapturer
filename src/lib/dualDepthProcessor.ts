/**
 * Dual Depth Processing System
 * Separate depth analysis for stars and nebula for maximum 3D accuracy
 */

export interface StellarDepthData {
  x: number;
  y: number;
  brightness: number;
  color: { r: number; g: number; b: number };
  estimatedDistance: number; // 0-1 (0=closest, 1=farthest)
  stellarClass: 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'Unknown';
  confidence: number;
}

export interface NebulaDepthData {
  densityMap: HTMLCanvasElement;
  structureMap: HTMLCanvasElement;
  emissionMap: HTMLCanvasElement;
  combinedDepthMap: HTMLCanvasElement;
}

export interface CombinedDepthMap {
  stellarDepthMap: HTMLCanvasElement;
  nebulaDepthMap: HTMLCanvasElement;
  unifiedDepthMap: HTMLCanvasElement;
  metadata: {
    starCount: number;
    nebulaComplexity: number;
    depthRange: number;
  };
}

export class DualDepthProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');
    this.ctx = ctx;
  }

  /**
   * STELLAR DEPTH UNIT: Analyze star depths based on astrophysical principles
   */
  async processStellarDepth(
    starsImg: HTMLImageElement,
    starPatterns: Array<any>,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<{ stellarData: StellarDepthData[]; depthMap: HTMLCanvasElement }> {
    
    onProgress?.('Analyzing stellar photometry and distances...', 10);
    
    const width = starsImg.width;
    const height = starsImg.height;
    
    // Extract star image data
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.drawImage(starsImg, 0, 0);
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const stellarData: StellarDepthData[] = [];
    
    onProgress?.('Performing stellar classification and distance estimation...', 30);
    
    // Analyze each detected star
    for (let i = 0; i < starPatterns.length; i++) {
      const star = starPatterns[i];
      
      // Extract color and brightness data
      const colorData = this.extractStellarPhotometry(data, star.centerX, star.centerY, width, star.boundingBox);
      
      // Estimate stellar class based on color
      const stellarClass = this.classifyStar(colorData.color);
      
      // Calculate distance estimate using brightness-distance relationship
      const estimatedDistance = this.estimateStellarDistance(colorData.brightness, colorData.color, stellarClass);
      
      stellarData.push({
        x: star.centerX,
        y: star.centerY,
        brightness: colorData.brightness,
        color: colorData.color,
        estimatedDistance,
        stellarClass,
        confidence: colorData.confidence
      });
      
      if (i % 10 === 0) {
        onProgress?.(`Analyzing star ${i + 1}/${starPatterns.length}...`, 30 + (i / starPatterns.length) * 40);
      }
    }
    
    onProgress?.('Creating stellar depth map...', 75);
    
    // Create stellar-specific depth map
    const stellarDepthMap = this.createStellarDepthMap(stellarData, width, height);
    
    onProgress?.('Stellar depth analysis complete', 100);
    
    console.log(`🌟 Stellar Analysis: Processed ${stellarData.length} stars`);
    console.log('Stellar classes:', stellarData.reduce((acc, s) => { acc[s.stellarClass] = (acc[s.stellarClass] || 0) + 1; return acc; }, {} as Record<string, number>));
    
    return { stellarData, depthMap: stellarDepthMap };
  }

  /**
   * NEBULA DEPTH UNIT: Analyze nebula depth based on emission and density
   */
  async processNebulaDepth(
    starlessImg: HTMLImageElement,
    luminanceBlur: number,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<NebulaDepthData> {
    
    onProgress?.('Analyzing nebular emission structure...', 10);
    
    const width = starlessImg.width;
    const height = starlessImg.height;
    
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.drawImage(starlessImg, 0, 0);
    const imageData = this.ctx.getImageData(0, 0, width, height);
    
    onProgress?.('Creating density map from luminance...', 25);
    const densityMap = this.createDensityMap(imageData, luminanceBlur);
    
    onProgress?.('Analyzing nebular structure...', 50);
    const structureMap = this.createStructuralDepthMap(imageData, width, height);
    
    onProgress?.('Processing emission regions...', 75);
    const emissionMap = this.createEmissionDepthMap(imageData, width, height);
    
    onProgress?.('Combining nebular depth layers...', 90);
    const combinedDepthMap = this.combineNebulaDepthMaps(densityMap, structureMap, emissionMap);
    
    onProgress?.('Nebular depth analysis complete', 100);
    
    console.log('🌌 Nebular Analysis: Multi-layer depth mapping complete');
    
    return {
      densityMap,
      structureMap,
      emissionMap,
      combinedDepthMap
    };
  }

  /**
   * UNIFIED PROCESSOR: Combine stellar and nebular depth maps intelligently
   */
  async createUnifiedDepthMap(
    stellarDepthMap: HTMLCanvasElement,
    nebulaDepthMap: HTMLCanvasElement,
    stellarData: StellarDepthData[],
    onProgress?: (stage: string, progress: number) => void
  ): Promise<CombinedDepthMap> {
    
    onProgress?.('Unifying stellar and nebular depth data...', 10);
    
    const width = Math.max(stellarDepthMap.width, nebulaDepthMap.width);
    const height = Math.max(stellarDepthMap.height, nebulaDepthMap.height);
    
    // Create unified depth map canvas
    const unifiedCanvas = document.createElement('canvas');
    const unifiedCtx = unifiedCanvas.getContext('2d')!;
    unifiedCanvas.width = width;
    unifiedCanvas.height = height;
    
    onProgress?.('Extracting depth data layers...', 30);
    
    // Get depth data from both maps
    const stellarDepthData = stellarDepthMap.getContext('2d')!.getImageData(0, 0, width, height);
    const nebulaDepthData = nebulaDepthMap.getContext('2d')!.getImageData(0, 0, width, height);
    
    const unifiedData = unifiedCtx.createImageData(width, height);
    
    onProgress?.('Computing intelligent depth fusion...', 60);
    
    // Intelligent fusion algorithm
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        const stellarDepth = stellarDepthData.data[idx] / 255;
        const nebulaDepth = nebulaDepthData.data[idx] / 255;
        
        // Find if there's a star at this position
        const nearestStar = this.findNearestStar(stellarData, x, y, 8);
        
        let finalDepth: number;
        
        if (nearestStar) {
          // Star region: prioritize stellar depth with nebula influence
          const starWeight = Math.max(0.7, nearestStar.confidence);
          const nebulaWeight = 1 - starWeight;
          finalDepth = stellarDepth * starWeight + nebulaDepth * nebulaWeight;
          
          // Apply stellar distance correction
          finalDepth = finalDepth * (1 - nearestStar.estimatedDistance * 0.3);
        } else {
          // Nebula region: use nebula depth with slight stellar influence for context
          const stellarInfluence = Math.min(0.2, stellarDepth * 0.5);
          finalDepth = nebulaDepth * 0.9 + stellarInfluence * 0.1;
        }
        
        // Ensure valid range
        finalDepth = Math.max(0, Math.min(1, finalDepth));
        
        const depthValue = Math.round(finalDepth * 255);
        unifiedData.data[idx] = depthValue;
        unifiedData.data[idx + 1] = depthValue;
        unifiedData.data[idx + 2] = depthValue;
        unifiedData.data[idx + 3] = 255;
      }
      
      if (y % 50 === 0) {
        onProgress?.(`Processing unified depth row ${y}/${height}...`, 60 + (y / height) * 30);
      }
    }
    
    unifiedCtx.putImageData(unifiedData, 0, 0);
    
    // Apply slight smoothing to unified map
    unifiedCtx.filter = 'blur(0.5px)';
    unifiedCtx.drawImage(unifiedCanvas, 0, 0);
    unifiedCtx.filter = 'none';
    
    onProgress?.('Unified depth map complete', 100);
    
    // Calculate metadata
    const depthRange = this.calculateDepthRange(unifiedData);
    const nebulaComplexity = this.calculateComplexity(nebulaDepthData);
    
    console.log(`🎯 Unified Depth: ${stellarData.length} stars integrated with nebular structure`);
    console.log(`📊 Depth range: ${depthRange.toFixed(2)}, Complexity: ${nebulaComplexity.toFixed(2)}`);
    
    return {
      stellarDepthMap,
      nebulaDepthMap,
      unifiedDepthMap: unifiedCanvas,
      metadata: {
        starCount: stellarData.length,
        nebulaComplexity,
        depthRange
      }
    };
  }

  /**
   * Extract photometric data from star region
   */
  private extractStellarPhotometry(
    data: Uint8ClampedArray,
    centerX: number,
    centerY: number,
    width: number,
    boundingBox: any
  ): { brightness: number; color: { r: number; g: number; b: number }; confidence: number } {
    
    let totalR = 0, totalG = 0, totalB = 0, totalBrightness = 0;
    let pixelCount = 0;
    
    // Sample in a small radius around star center
    const radius = Math.min(5, Math.max(2, boundingBox.width / 4));
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < width && y >= 0) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= radius) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Weight by inverse distance (center pixels more important)
            const weight = 1 / (1 + distance * 0.5);
            
            totalR += r * weight;
            totalG += g * weight;
            totalB += b * weight;
            totalBrightness += brightness * weight;
            pixelCount += weight;
          }
        }
      }
    }
    
    if (pixelCount > 0) {
      const avgR = totalR / pixelCount;
      const avgG = totalG / pixelCount;
      const avgB = totalB / pixelCount;
      const avgBrightness = totalBrightness / pixelCount;
      
      // Confidence based on brightness and color separation
      const colorSeparation = Math.max(avgR, avgG, avgB) - Math.min(avgR, avgG, avgB);
      const confidence = Math.min(1, (avgBrightness / 255) * 0.7 + (colorSeparation / 255) * 0.3);
      
      return {
        brightness: avgBrightness,
        color: { r: avgR, g: avgG, b: avgB },
        confidence
      };
    }
    
    return { brightness: 0, color: { r: 0, g: 0, b: 0 }, confidence: 0 };
  }

  /**
   * Classify star based on color (simplified stellar classification)
   */
  private classifyStar(color: { r: number; g: number; b: number }): 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'Unknown' {
    const { r, g, b } = color;
    const total = r + g + b;
    
    if (total < 50) return 'Unknown';
    
    // Normalize colors
    const rn = r / total;
    const gn = g / total;
    const bn = b / total;
    
    // Simplified color-temperature classification
    if (bn > 0.4) return 'O'; // Very blue - very hot
    if (bn > 0.35) return 'B'; // Blue - hot
    if (bn > 0.32 && gn > 0.32) return 'A'; // Blue-white
    if (gn > 0.35) return 'F'; // White
    if (gn > 0.33 && rn > 0.32) return 'G'; // Yellow-white (like Sun)
    if (rn > 0.4) return 'K'; // Orange
    if (rn > 0.45) return 'M'; // Red
    
    return 'Unknown';
  }

  /**
   * Estimate stellar distance based on brightness and spectral class
   */
  private estimateStellarDistance(
    brightness: number,
    color: { r: number; g: number; b: number },
    stellarClass: string
  ): number {
    // Simplified distance estimation (in reality would need absolute magnitude)
    // Brighter stars are assumed closer (with spectral class corrections)
    
    let baseMagnitude = 5.0; // Assume main sequence
    
    // Spectral class corrections (approximate absolute magnitudes)
    switch (stellarClass) {
      case 'O': baseMagnitude = -4.0; break; // Very luminous
      case 'B': baseMagnitude = -1.0; break;
      case 'A': baseMagnitude = 1.0; break;
      case 'F': baseMagnitude = 3.0; break;
      case 'G': baseMagnitude = 5.0; break; // Sun-like
      case 'K': baseMagnitude = 7.0; break;
      case 'M': baseMagnitude = 10.0; break;
      default: baseMagnitude = 5.0; break;
    }
    
    // Convert apparent brightness to apparent magnitude (simplified)
    const apparentMagnitude = -2.5 * Math.log10(brightness / 255 + 0.001);
    
    // Distance modulus (very simplified)
    const distanceModulus = apparentMagnitude - baseMagnitude;
    
    // Convert to 0-1 scale (0 = close, 1 = far)
    const normalizedDistance = Math.max(0, Math.min(1, (distanceModulus + 5) / 15));
    
    return normalizedDistance;
  }

  /**
   * Create stellar-specific depth map
   */
  private createStellarDepthMap(stellarData: StellarDepthData[], width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    
    // Initialize with mid-depth (0.5)
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, width, height);
    
    // Draw each star with its estimated depth
    for (const star of stellarData) {
      const depth = 1 - star.estimatedDistance; // Invert: closer stars = higher depth value
      const depthValue = Math.round(depth * 255);
      const color = `rgb(${depthValue}, ${depthValue}, ${depthValue})`;
      
      // Create radial gradient for star influence
      const radius = Math.max(3, star.brightness / 255 * 12);
      const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, '#808080'); // Blend to background
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return canvas;
  }

  /**
   * Create density-based depth map
   */
  private createDensityMap(imageData: ImageData, blur: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    
    const data = imageData.data;
    const densityData = ctx.createImageData(imageData.width, imageData.height);
    
    // Convert to luminance-based density
    for (let i = 0; i < data.length; i += 4) {
      const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const density = Math.pow(luminance / 255, 0.8) * 255; // Gamma correction
      
      densityData.data[i] = density;
      densityData.data[i + 1] = density;
      densityData.data[i + 2] = density;
      densityData.data[i + 3] = 255;
    }
    
    ctx.putImageData(densityData, 0, 0);
    
    if (blur > 0) {
      ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }
    
    return canvas;
  }

  /**
   * Create structural depth map
   */
  private createStructuralDepthMap(imageData: ImageData, width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    
    const data = imageData.data;
    const structureData = ctx.createImageData(width, height);
    
    // Analyze local structure patterns
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Local variance analysis
        let variance = 0;
        let mean = 0;
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            const lum = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2];
            mean += lum;
            count++;
          }
        }
        
        mean /= count;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            const lum = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2];
            variance += (lum - mean) * (lum - mean);
          }
        }
        
        variance = Math.sqrt(variance / count);
        const structureDepth = Math.min(255, variance * 2);
        
        structureData.data[idx] = structureDepth;
        structureData.data[idx + 1] = structureDepth;
        structureData.data[idx + 2] = structureDepth;
        structureData.data[idx + 3] = 255;
      }
    }
    
    ctx.putImageData(structureData, 0, 0);
    return canvas;
  }

  /**
   * Create emission-based depth map
   */
  private createEmissionDepthMap(imageData: ImageData, width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    
    const data = imageData.data;
    const emissionData = ctx.createImageData(width, height);
    
    // Analyze color-based emission regions
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Emission line emphasis (red = H-alpha, blue = OIII, etc.)
      const emissionStrength = Math.max(r * 0.6, b * 0.8) + g * 0.2;
      const normalizedEmission = Math.min(255, emissionStrength);
      
      emissionData.data[i] = normalizedEmission;
      emissionData.data[i + 1] = normalizedEmission;
      emissionData.data[i + 2] = normalizedEmission;
      emissionData.data[i + 3] = 255;
    }
    
    ctx.putImageData(emissionData, 0, 0);
    return canvas;
  }

  /**
   * Combine nebula depth maps intelligently
   */
  private combineNebulaDepthMaps(
    densityMap: HTMLCanvasElement,
    structureMap: HTMLCanvasElement,
    emissionMap: HTMLCanvasElement
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = densityMap.width;
    canvas.height = densityMap.height;
    
    const width = densityMap.width;
    const height = densityMap.height;
    
    const densityData = densityMap.getContext('2d')!.getImageData(0, 0, width, height);
    const structureData = structureMap.getContext('2d')!.getImageData(0, 0, width, height);
    const emissionData = emissionMap.getContext('2d')!.getImageData(0, 0, width, height);
    
    const combinedData = ctx.createImageData(width, height);
    
    for (let i = 0; i < densityData.data.length; i += 4) {
      const density = densityData.data[i] / 255;
      const structure = structureData.data[i] / 255;
      const emission = emissionData.data[i] / 255;
      
      // Weighted combination
      const combined = (
        density * 0.5 +      // Primary depth from density
        structure * 0.3 +    // Structure adds detail
        emission * 0.2       // Emission adds color-based depth
      ) * 255;
      
      const value = Math.min(255, Math.max(0, combined));
      combinedData.data[i] = value;
      combinedData.data[i + 1] = value;
      combinedData.data[i + 2] = value;
      combinedData.data[i + 3] = 255;
    }
    
    ctx.putImageData(combinedData, 0, 0);
    return canvas;
  }

  /**
   * Find nearest star to given position
   */
  private findNearestStar(stellarData: StellarDepthData[], x: number, y: number, maxDistance: number): StellarDepthData | null {
    let nearest = null;
    let minDistance = maxDistance;
    
    for (const star of stellarData) {
      const distance = Math.sqrt((x - star.x) ** 2 + (y - star.y) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = star;
      }
    }
    
    return nearest;
  }

  /**
   * Calculate depth range for metadata
   */
  private calculateDepthRange(imageData: ImageData): number {
    const data = imageData.data;
    let min = 255, max = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const value = data[i];
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    
    return (max - min) / 255;
  }

  /**
   * Calculate complexity metric
   */
  private calculateComplexity(imageData: ImageData): number {
    const data = imageData.data;
    let variance = 0;
    let mean = 0;
    let count = 0;
    
    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      mean += data[i];
      count++;
    }
    mean /= count;
    
    for (let i = 0; i < data.length; i += 40) {
      variance += (data[i] - mean) ** 2;
    }
    variance = Math.sqrt(variance / count);
    
    return Math.min(1, variance / 128);
  }
}