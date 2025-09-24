/**
 * Traditional Morph Mode - Based on photographingspace.com methodology
 * 
 * This implementation follows the traditional workflow described by J-P Metsavainio
 * and Dylan O'Donnell for creating 3D stereoscopic pairs from separate starless
 * and stars-only astronomical images.
 */

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

  /**
   * Load and validate input images
   */
  async loadImages(inputs: TraditionalInputs): Promise<{
    starlessImg: HTMLImageElement;
    starsImg: HTMLImageElement;
  }> {
    const starlessImg = new Image();
    const starsImg = new Image();
    
    // Load both images
    await Promise.all([
      new Promise((resolve, reject) => {
        starlessImg.onload = resolve;
        starlessImg.onerror = reject;
        starlessImg.src = URL.createObjectURL(inputs.starlessImage);
      }),
      new Promise((resolve, reject) => {
        starsImg.onload = resolve;
        starsImg.onerror = reject;
        starsImg.src = URL.createObjectURL(inputs.starsOnlyImage);
      })
    ]);

    // Validate dimensions match
    if (starlessImg.width !== starsImg.width || starlessImg.height !== starsImg.height) {
      throw new Error('Starless and stars-only images must have the same dimensions');
    }

    return { starlessImg, starsImg };
  }

  /**
   * Create luminance map from starless image (Step 3 from article)
   */
  createLuminanceMap(starlessImg: HTMLImageElement, blur: number): HTMLCanvasElement {
    // Set up canvas for luminance processing
    this.canvas.width = starlessImg.width;
    this.canvas.height = starlessImg.height;
    
    // Draw starless image
    this.ctx.drawImage(starlessImg, 0, 0);
    
    // Convert to grayscale
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Convert to luminance using standard weights
      const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = luminance;
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    
    // Apply Gaussian blur for smooth 3D transitions
    if (blur > 0) {
      this.ctx.filter = `blur(${blur}px)`;
      this.ctx.drawImage(this.canvas, 0, 0);
      this.ctx.filter = 'none';
    }
    
    // Create separate canvas for luminance map
    const lumCanvas = document.createElement('canvas');
    const lumCtx = lumCanvas.getContext('2d')!;
    lumCanvas.width = this.canvas.width;
    lumCanvas.height = this.canvas.height;
    lumCtx.drawImage(this.canvas, 0, 0);
    
    return lumCanvas;
  }

  /**
   * Apply displacement filter to create depth effect (Step 5 from article)
   */
  applyDisplacementFilter(
    starlessImg: HTMLImageElement, 
    luminanceMap: HTMLCanvasElement, 
    horizontalAmount: number
  ): HTMLCanvasElement {
    const width = starlessImg.width;
    const height = starlessImg.height;
    
    // Set up canvas
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.drawImage(starlessImg, 0, 0);
    
    // Get original image data
    const originalData = this.ctx.getImageData(0, 0, width, height);
    
    // Get luminance map data for displacement
    const lumCtx = luminanceMap.getContext('2d')!;
    const lumData = lumCtx.getImageData(0, 0, width, height);
    
    // Create displaced image
    const displacedData = this.ctx.createImageData(width, height);
    displacedData.data.fill(0);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Get displacement amount from luminance (0-255 mapped to displacement range)
        const lumValue = lumData.data[idx] / 255; // Normalize to 0-1
        const displacement = Math.round((lumValue - 0.5) * horizontalAmount);
        
        // Calculate source position
        const srcX = Math.max(0, Math.min(width - 1, x - displacement));
        const srcIdx = (y * width + srcX) * 4;
        
        // Copy pixel with displacement
        displacedData.data[idx] = originalData.data[srcIdx];
        displacedData.data[idx + 1] = originalData.data[srcIdx + 1];
        displacedData.data[idx + 2] = originalData.data[srcIdx + 2];
        displacedData.data[idx + 3] = 255; // Full alpha
      }
    }
    
    // Create result canvas
    const resultCanvas = document.createElement('canvas');
    const resultCtx = resultCanvas.getContext('2d')!;
    resultCanvas.width = width;
    resultCanvas.height = height;
    resultCtx.putImageData(displacedData, 0, 0);
    
    return resultCanvas;
  }

  /**
   * Detect individual stars for repositioning (enhanced star detection)
   */
  detectStarCenters(starsImg: HTMLImageElement): Array<{ x: number; y: number; brightness: number }> {
    this.canvas.width = starsImg.width;
    this.canvas.height = starsImg.height;
    this.ctx.drawImage(starsImg, 0, 0);
    
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    const stars: Array<{ x: number; y: number; brightness: number }> = [];
    const threshold = 100; // Adjust based on star brightness
    const minDistance = 5; // Minimum distance between star centers
    
    // Find local maxima that represent star centers
    for (let y = 2; y < height - 2; y++) {
      for (let x = 2; x < width - 2; x++) {
        const idx = (y * width + x) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        
        if (luminance < threshold) continue;
        
        // Check if it's a local maximum
        let isLocalMax = true;
        let maxNeighborBrightness = 0;
        
        for (let dy = -2; dy <= 2 && isLocalMax; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            const nLuminance = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2];
            
            if (nLuminance > luminance) {
              isLocalMax = false;
            }
            maxNeighborBrightness = Math.max(maxNeighborBrightness, nLuminance);
          }
        }
        
        // Additional check: must be significantly brighter than neighbors
        if (isLocalMax && luminance > maxNeighborBrightness * 1.2) {
          // Check minimum distance from existing stars
          let tooClose = false;
          for (const existingStar of stars) {
            const distance = Math.sqrt(
              Math.pow(x - existingStar.x, 2) + Math.pow(y - existingStar.y, 2)
            );
            if (distance < minDistance) {
              tooClose = true;
              // Keep the brighter star
              if (luminance > existingStar.brightness) {
                // Remove the dimmer star and add this one
                const index = stars.indexOf(existingStar);
                stars.splice(index, 1);
                tooClose = false;
              }
              break;
            }
          }
          
          if (!tooClose) {
            stars.push({ x, y, brightness: luminance });
          }
        }
      }
    }
    
    return stars.sort((a, b) => b.brightness - a.brightness); // Sort by brightness
  }

  /**
   * Create stereo pair using traditional morphing method
   */
  async createTraditionalStereoPair(
    inputs: TraditionalInputs, 
    params: TraditionalMorphParams,
    onProgress?: (step: string) => void
  ): Promise<{ leftCanvas: HTMLCanvasElement; rightCanvas: HTMLCanvasElement; depthMap: HTMLCanvasElement }> {
    
    onProgress?.('Loading and validating images...');
    const { starlessImg, starsImg } = await this.loadImages(inputs);
    
    const width = starlessImg.width;
    const height = starlessImg.height;
    
    onProgress?.('Creating luminance map for depth displacement...');
    const luminanceMap = this.createLuminanceMap(starlessImg, params.luminanceBlur);
    
    onProgress?.('Applying traditional displacement filter to nebula...');
    const displacedStarless = this.applyDisplacementFilter(starlessImg, luminanceMap, params.horizontalDisplace);
    
    onProgress?.('Detecting individual stars for 3D positioning...');
    const starCenters = this.detectStarCenters(starsImg);
    console.log(`Detected ${starCenters.length} stars for 3D positioning`);
    
    onProgress?.('Creating left view (original)...');
    // Left view: original starless + original stars
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
    
    onProgress?.('Creating right view with 3D star positioning...');
    // Right view: displaced starless + repositioned stars
    const rightCanvas = document.createElement('canvas');
    const rightCtx = rightCanvas.getContext('2d')!;
    rightCanvas.width = width;
    rightCanvas.height = height;
    
    // Draw displaced starless background
    rightCtx.drawImage(displacedStarless, 0, 0);
    
    // Manually position individual stars in 3D space
    rightCtx.globalCompositeOperation = 'screen';
    
    // Create temporary canvas for individual star manipulation
    const starCanvas = document.createElement('canvas');
    const starCtx = starCanvas.getContext('2d')!;
    starCanvas.width = width;
    starCanvas.height = height;
    starCtx.drawImage(starsImg, 0, 0);
    
    // Position stars based on brightness (brighter = closer, more shift)
    for (const star of starCenters) {
      const brightnessFactor = star.brightness / 255;
      
      // Calculate shift based on brightness and user parameter
      // Brighter stars get more shift (appear closer)
      // Following article: left shift = away, right shift = closer
      let starShift = 0;
      
      if (brightnessFactor > 0.8) {
        // Very bright stars - bring forward
        starShift = params.starShiftAmount * 0.8;
      } else if (brightnessFactor > 0.6) {
        // Medium bright stars - mid-ground
        starShift = params.starShiftAmount * 0.4;
      } else if (brightnessFactor > 0.4) {
        // Dim stars - slight forward
        starShift = params.starShiftAmount * 0.2;
      } else {
        // Very dim stars - background (minimal shift)
        starShift = params.starShiftAmount * 0.1;
      }
      
      // Extract star region and draw it at new position
      const radius = Math.max(2, Math.min(8, Math.ceil(brightnessFactor * 6)));
      const x1 = Math.max(0, star.x - radius);
      const y1 = Math.max(0, star.y - radius);
      const w = Math.min(radius * 2, width - x1);
      const h = Math.min(radius * 2, height - y1);
      
      if (w > 0 && h > 0) {
        const starData = starCtx.getImageData(x1, y1, w, h);
        
        // Position with calculated shift (right shift = closer to viewer)
        const newX = Math.max(0, Math.min(width - w, x1 + starShift));
        rightCtx.putImageData(starData, newX, y1);
      }
    }
    
    rightCtx.globalCompositeOperation = 'source-over';
    
    onProgress?.('Applying final contrast adjustments...');
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
    
    return { 
      leftCanvas, 
      rightCanvas, 
      depthMap: luminanceMap 
    };
  }

  /**
   * Combine left and right views into final stereo pair with spacing
   */
  createFinalStereoPair(
    leftCanvas: HTMLCanvasElement, 
    rightCanvas: HTMLCanvasElement, 
    spacing: number = 300
  ): HTMLCanvasElement {
    const width = leftCanvas.width;
    const height = leftCanvas.height;
    
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d')!;
    finalCanvas.width = width * 2 + spacing;
    finalCanvas.height = height;
    
    // Black background
    finalCtx.fillStyle = '#000000';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    
    // Draw left and right views with spacing
    finalCtx.drawImage(leftCanvas, 0, 0);
    finalCtx.drawImage(rightCanvas, width + spacing, 0);
    
    return finalCanvas;
  }

  /**
   * Cleanup resources
   */
  dispose() {
    // Canvas cleanup happens automatically when references are lost
  }
}
