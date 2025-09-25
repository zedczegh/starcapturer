/**
 * Smart Star Shape Matching and Template-Based Positioning
 * Ensures perfect star shape preservation and eliminates duplicates
 */

export interface StarTemplate {
  pattern: ImageData;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  brightness: number;
  patternType: 'point' | 'newtonian' | 'jwst' | 'complex';
  hash: string; // Unique identifier for duplicate detection
}

export interface PositionedStar {
  template: StarTemplate;
  originalX: number;
  originalY: number;
  newX: number;
  newY: number;
  stellarData?: any;
}

export class StarShapeMatching {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');
    this.ctx = ctx;
  }

  /**
   * SMART: Extract perfect star templates from original image
   */
  extractStarTemplates(
    starsImg: HTMLImageElement,
    starPatterns: Array<any>,
    onProgress?: (stage: string, progress: number) => void
  ): StarTemplate[] {
    onProgress?.('Extracting star templates for perfect matching...', 0);
    
    this.canvas.width = starsImg.width;
    this.canvas.height = starsImg.height;
    this.ctx.drawImage(starsImg, 0, 0);
    
    const templates: StarTemplate[] = [];
    const processedHashes = new Set<string>();
    
    for (let i = 0; i < starPatterns.length; i++) {
      const star = starPatterns[i];
      
      // Enhanced bounding box for complete pattern capture
      const padding = this.getPatternPadding(star.pattern);
      const bbox = {
        x: Math.max(0, star.boundingBox.x - padding),
        y: Math.max(0, star.boundingBox.y - padding),
        width: Math.min(starsImg.width - star.boundingBox.x + padding, star.boundingBox.width + padding * 2),
        height: Math.min(starsImg.height - star.boundingBox.y + padding, star.boundingBox.height + padding * 2)
      };
      
      // Extract clean star pattern
      const patternData = this.ctx.getImageData(bbox.x, bbox.y, bbox.width, bbox.height);
      
      // Create unique hash to prevent duplicates
      const hash = this.createPatternHash(patternData, star.centerX, star.centerY);
      
      if (!processedHashes.has(hash)) {
        templates.push({
          pattern: patternData,
          centerX: star.centerX - bbox.x, // Relative to template
          centerY: star.centerY - bbox.y,
          width: bbox.width,
          height: bbox.height,
          brightness: star.brightness,
          patternType: star.pattern,
          hash
        });
        
        processedHashes.add(hash);
      }
      
      if (i % 10 === 0) {
        onProgress?.(`Extracting template ${i + 1}/${starPatterns.length}...`, (i / starPatterns.length) * 100);
      }
    }
    
    console.log(`🎨 Extracted ${templates.length} unique star templates (${starPatterns.length - templates.length} duplicates filtered)`);
    return templates;
  }

  /**
   * SMART: Calculate optimal positions using stellar depth data
   */
  calculateOptimalPositions(
    templates: StarTemplate[],
    stellarData: Array<any>,
    starShiftAmount: number,
    initialLeftShift: number,
    imageWidth: number,
    imageHeight: number,
    onProgress?: (stage: string, progress: number) => void
  ): PositionedStar[] {
    onProgress?.('Calculating optimal star positions...', 0);
    
    const positionedStars: PositionedStar[] = [];
    const occupiedAreas: Array<{x: number, y: number, w: number, h: number}> = [];
    
    // Sort templates by brightness for better positioning priority
    const sortedTemplates = [...templates].sort((a, b) => b.brightness - a.brightness);
    
    for (let i = 0; i < sortedTemplates.length; i++) {
      const template = sortedTemplates[i];
      
      // Find corresponding stellar data
      const stellar = stellarData.find(s => 
        Math.sqrt((s.x - (template.centerX + template.width/2)) ** 2 + 
                 (s.y - (template.centerY + template.height/2)) ** 2) < 10
      );
      
      // Calculate forward shift using stellar physics
      let forwardShift = starShiftAmount;
      if (stellar) {
        const distanceFactor = 1 - stellar.estimatedDistance;
        forwardShift *= (0.8 + distanceFactor * 1.5);
        
        // Spectral class adjustments
        switch (stellar.stellarClass) {
          case 'O': forwardShift *= 0.6; break;
          case 'B': forwardShift *= 0.7; break;
          case 'A': forwardShift *= 0.9; break;
          case 'F': forwardShift *= 1.0; break;
          case 'G': forwardShift *= 1.1; break;
          case 'K': forwardShift *= 1.3; break;
          case 'M': forwardShift *= 1.5; break;
        }
      } else {
        // Brightness-based fallback
        forwardShift *= (1 + template.brightness / 255);
      }
      
      // Calculate positions
      const originalX = template.centerX + initialLeftShift;
      const newX = Math.max(0, Math.min(imageWidth - template.width, originalX + forwardShift));
      const newY = template.centerY;
      
      // Check for overlaps with smart collision detection
      const hasOverlap = occupiedAreas.some(area => 
        this.checkOverlap(
          { x: newX, y: newY, w: template.width, h: template.height },
          area
        )
      );
      
      if (!hasOverlap && newX + template.width < imageWidth) {
        positionedStars.push({
          template,
          originalX: template.centerX,
          originalY: template.centerY,
          newX,
          newY,
          stellarData: stellar
        });
        
        // Mark area as occupied
        occupiedAreas.push({
          x: newX,
          y: newY, 
          w: template.width,
          h: template.height
        });
      }
      
      if (i % 5 === 0) {
        onProgress?.(`Positioning star ${i + 1}/${sortedTemplates.length}...`, (i / sortedTemplates.length) * 100);
      }
    }
    
    console.log(`🎯 Calculated positions for ${positionedStars.length}/${templates.length} stars`);
    return positionedStars;
  }

  /**
   * BUILD: Create perfect right image using templates
   */
  buildPerfectRightImage(
    starlessImg: HTMLImageElement,
    positionedStars: PositionedStar[],
    imageWidth: number,
    imageHeight: number,
    onProgress?: (stage: string, progress: number) => void
  ): HTMLCanvasElement {
    onProgress?.('Building perfect right image with template placement...', 0);
    
    // Create clean right image canvas
    const rightCanvas = document.createElement('canvas');
    const rightCtx = rightCanvas.getContext('2d')!;
    rightCanvas.width = imageWidth;
    rightCanvas.height = imageHeight;
    
    // Start with clean starless nebula
    rightCtx.drawImage(starlessImg, 0, 0);
    
    // Add each star template at its calculated position
    for (let i = 0; i < positionedStars.length; i++) {
      const star = positionedStars[i];
      
      // Create temporary canvas for this star
      const starCanvas = document.createElement('canvas');
      const starCtx = starCanvas.getContext('2d')!;
      starCanvas.width = star.template.width;
      starCanvas.height = star.template.height;
      
      // Draw the star template
      starCtx.putImageData(star.template.pattern, 0, 0);
      
      // Add star to right image with perfect blending
      rightCtx.globalCompositeOperation = 'screen';
      rightCtx.drawImage(starCanvas, star.newX, star.newY);
      rightCtx.globalCompositeOperation = 'source-over';
      
      if (i % 10 === 0) {
        onProgress?.(`Placing star template ${i + 1}/${positionedStars.length}...`, (i / positionedStars.length) * 100);
      }
    }
    
    console.log(`✨ Perfect right image built with ${positionedStars.length} star templates`);
    return rightCanvas;
  }

  /**
   * VERIFY: Ensure perfect matching between left and right images
   */
  verifyStarMatching(
    leftCanvas: HTMLCanvasElement,
    rightCanvas: HTMLCanvasElement,
    positionedStars: PositionedStar[]
  ): { matches: number; mismatches: number; integrity: number } {
    let matches = 0;
    let mismatches = 0;
    
    const leftData = leftCanvas.getContext('2d')!.getImageData(0, 0, leftCanvas.width, leftCanvas.height);
    const rightData = rightCanvas.getContext('2d')!.getImageData(0, 0, rightCanvas.width, rightCanvas.height);
    
    for (const star of positionedStars) {
      const leftSample = this.sampleStarRegion(leftData, star.originalX, star.originalY, 5);
      const rightSample = this.sampleStarRegion(rightData, star.newX + star.template.centerX, star.newY + star.template.centerY, 5);
      
      const similarity = this.calculateSimilarity(leftSample, rightSample);
      
      if (similarity > 0.8) {
        matches++;
      } else {
        mismatches++;
      }
    }
    
    const integrity = matches / (matches + mismatches) * 100;
    
    console.log(`🔍 Star Matching Verification: ${matches} matches, ${mismatches} mismatches (${integrity.toFixed(1)}% integrity)`);
    
    return { matches, mismatches, integrity };
  }

  /**
   * Get padding based on pattern type
   */
  private getPatternPadding(patternType: string): number {
    switch (patternType) {
      case 'newtonian': return 8; // Extra padding for cross spikes
      case 'jwst': return 10; // Extra padding for 6-spike pattern
      case 'complex': return 6;
      default: return 4; // Point stars
    }
  }

  /**
   * Create unique hash for star pattern
   */
  private createPatternHash(patternData: ImageData, centerX: number, centerY: number): string {
    const data = patternData.data;
    let hash = 0;
    
    // Sample key pixels for hash calculation
    const samples = [
      { x: Math.floor(centerX), y: Math.floor(centerY) }, // Center
      { x: Math.floor(centerX - 3), y: Math.floor(centerY) }, // Left
      { x: Math.floor(centerX + 3), y: Math.floor(centerY) }, // Right  
      { x: Math.floor(centerX), y: Math.floor(centerY - 3) }, // Up
      { x: Math.floor(centerX), y: Math.floor(centerY + 3) }  // Down
    ];
    
    for (const sample of samples) {
      if (sample.x >= 0 && sample.x < patternData.width && 
          sample.y >= 0 && sample.y < patternData.height) {
        const idx = (sample.y * patternData.width + sample.x) * 4;
        const luminance = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        hash = ((hash << 5) - hash + Math.floor(luminance)) | 0;
      }
    }
    
    return hash.toString();
  }

  /**
   * Check overlap between two rectangles
   */
  private checkOverlap(
    rect1: {x: number, y: number, w: number, h: number},
    rect2: {x: number, y: number, w: number, h: number}
  ): boolean {
    return !(rect1.x >= rect2.x + rect2.w || 
             rect1.x + rect1.w <= rect2.x || 
             rect1.y >= rect2.y + rect2.h || 
             rect1.y + rect1.h <= rect2.y);
  }

  /**
   * Sample star region for comparison
   */
  private sampleStarRegion(
    imageData: ImageData, 
    centerX: number, 
    centerY: number, 
    radius: number
  ): number[] {
    const samples: number[] = [];
    const data = imageData.data;
    const width = imageData.width;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = Math.floor(centerX + dx);
        const y = Math.floor(centerY + dy);
        
        if (x >= 0 && x < width && y >= 0 && y < imageData.height) {
          const idx = (y * width + x) * 4;
          const luminance = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
          samples.push(luminance);
        }
      }
    }
    
    return samples;
  }

  /**
   * Calculate similarity between two sample arrays
   */
  private calculateSimilarity(sample1: number[], sample2: number[]): number {
    if (sample1.length !== sample2.length) return 0;
    
    let totalDiff = 0;
    let maxDiff = 0;
    
    for (let i = 0; i < sample1.length; i++) {
      const diff = Math.abs(sample1[i] - sample2[i]);
      totalDiff += diff;
      maxDiff = Math.max(maxDiff, Math.abs(sample1[i]), Math.abs(sample2[i]));
    }
    
    if (maxDiff === 0) return 1;
    
    const avgDiff = totalDiff / sample1.length;
    return Math.max(0, 1 - (avgDiff / maxDiff));
  }
}