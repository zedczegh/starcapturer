/**
 * Traditional Morph Mode - Based on photographingspace.com methodology
 * 
 * This implementation follows the traditional workflow described by J-P Metsavainio
 * and Dylan O'Donnell for creating 3D stereoscopic pairs from separate starless
 * and stars-only astronomical images.
 */
// @ts-ignore
import * as UTIF from 'utif';

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
   * Load and process input images (automatically resize to match dimensions)
   */
  async loadImages(inputs: TraditionalInputs): Promise<{
    starlessImg: HTMLImageElement;
    starsImg: HTMLImageElement;
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

    // Auto-resize images to match dimensions if they don't match
    if (starlessImg.width !== starsImg.width || starlessImg.height !== starsImg.height) {
      console.log(`Auto-resizing images: starless(${starlessImg.width}x${starlessImg.height}) stars(${starsImg.width}x${starsImg.height})`);
      
      // Use the larger dimensions as target
      const targetWidth = Math.max(starlessImg.width, starsImg.width);
      const targetHeight = Math.max(starlessImg.height, starsImg.height);
      
      // Resize starless image if needed
      if (starlessImg.width !== targetWidth || starlessImg.height !== targetHeight) {
        const resizedStarless = await this.resizeImage(starlessImg, targetWidth, targetHeight);
        starlessImg.src = resizedStarless.toDataURL();
        await new Promise(resolve => { starlessImg.onload = resolve; });
      }
      
      // Resize stars image if needed
      if (starsImg.width !== targetWidth || starsImg.height !== targetHeight) {
        const resizedStars = await this.resizeImage(starsImg, targetWidth, targetHeight);
        starsImg.src = resizedStars.toDataURL();
        await new Promise(resolve => { starsImg.onload = resolve; });
      }
    }

    return { starlessImg, starsImg };
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
    
    // Create displaced image with proper interpolation
    const displacedData = this.ctx.createImageData(width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Get displacement amount from luminance (0-255 mapped to displacement range)
        const lumValue = lumData.data[idx] / 255; // Normalize to 0-1
        const displacement = Math.round((lumValue - 0.5) * horizontalAmount);
        
        // Calculate source position with bounds checking
        const srcX = Math.max(0, Math.min(width - 1, x - displacement));
        const srcIdx = (y * width + srcX) * 4;
        
        // Only copy valid pixels from starless image
        if (srcX >= 0 && srcX < width) {
          displacedData.data[idx] = originalData.data[srcIdx];
          displacedData.data[idx + 1] = originalData.data[srcIdx + 1];
          displacedData.data[idx + 2] = originalData.data[srcIdx + 2];
          displacedData.data[idx + 3] = originalData.data[srcIdx + 3];
        } else {
          // Fill with black for out-of-bounds areas
          displacedData.data[idx] = 0;
          displacedData.data[idx + 1] = 0;
          displacedData.data[idx + 2] = 0;
          displacedData.data[idx + 3] = 255;
        }
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
   * Detect individual stars for repositioning (optimized for performance)
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
    const threshold = 80; // Higher threshold for performance - focus on prominent stars
    const minDistance = 5; // Larger minimum distance to reduce star count
    const stepSize = 2; // Skip pixels for faster processing
    
    // Find local maxima that represent star centers with optimized scanning
    for (let y = 3; y < height - 3; y += stepSize) {
      for (let x = 3; x < width - 3; x += stepSize) {
        const idx = (y * width + x) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        
        if (luminance < threshold) continue;
        
        // Quick local maximum check with smaller neighborhood for performance
        let isLocalMax = true;
        for (let dy = -1; dy <= 1 && isLocalMax; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            const nLuminance = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2];
            
            if (nLuminance > luminance) {
              isLocalMax = false;
            }
          }
        }
        
        if (isLocalMax) {
          // Check minimum distance with early termination
          let tooClose = false;
          for (let i = 0; i < stars.length && !tooClose; i++) {
            const existingStar = stars[i];
            const dx = x - existingStar.x;
            const dy = y - existingStar.y;
            const distanceSquared = dx * dx + dy * dy; // Avoid expensive sqrt
            
            if (distanceSquared < minDistance * minDistance) {
              tooClose = true;
              // Keep the brighter star
              if (luminance > existingStar.brightness) {
                stars[i] = { x, y, brightness: luminance };
              }
            }
          }
          
          if (!tooClose) {
            stars.push({ x, y, brightness: luminance });
          }
        }
      }
    }
    
    // Limit to top 100 brightest stars for performance
    return stars.sort((a, b) => b.brightness - a.brightness).slice(0, 100);
  }

  /**
   * Create stereo pair using CORRECT traditional morphing method from photographingspace.com
   */
  async createTraditionalStereoPair(
    inputs: TraditionalInputs, 
    params: TraditionalMorphParams,
    onProgress?: (step: string, progress?: number) => void
  ): Promise<{ leftCanvas: HTMLCanvasElement; rightCanvas: HTMLCanvasElement; depthMap: HTMLCanvasElement }> {
    
    onProgress?.('Loading and validating images...', 10);
    const { starlessImg, starsImg } = await this.loadImages(inputs);
    
    const width = starlessImg.width;
    const height = starlessImg.height;
    
    onProgress?.('Creating luminance map for displacement filter...', 20);
    const luminanceMap = this.createLuminanceMap(starlessImg, params.luminanceBlur);
    
    onProgress?.('Detecting individual stars for proper 3D positioning...', 35);
    const starCenters = this.detectStarCenters(starsImg);
    console.log(`Detected ${starCenters.length} stars for traditional 3D positioning`);
    
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
    
    onProgress?.('Positioning individual bright stars forward...', 75);
    // Step 3: Selectively move individual bright stars RIGHT to bring them forward
    // This is the KEY difference - we're bringing specific stars FORWARD from their background position
    
    let repositionedStars = 0;
    const brightStars = starCenters.filter(star => star.brightness / 255 > 0.4); // Lower threshold for more stars
    
    // Process stars in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < brightStars.length; i += batchSize) {
      const batch = brightStars.slice(i, i + batchSize);
      
      for (const star of batch) {
        const brightnessFactor = star.brightness / 255;
        
        // Simplified shift calculation for performance
        let forwardShift = params.starShiftAmount * (1 + brightnessFactor * 3);
        
        // Simplified star extraction - just use a fixed radius
        const radius = 4;
        const x1 = Math.max(0, star.x - radius);
        const y1 = Math.max(0, star.y - radius);
        const w = Math.min(radius * 2, width - x1);
        const h = Math.min(radius * 2, height - y1);
        
        if (w > 0 && h > 0 && forwardShift > 0) {
          // Position this star forward from its initial left-shifted position
          const finalX = Math.max(0, Math.min(width - w, x1 + initialLeftShift + forwardShift));
          
          // Draw the repositioned star region directly without complex filtering
          rightCtx.drawImage(starsImg, x1, y1, w, h, finalX, y1, w, h);
          
          repositionedStars++;
          
          if (repositionedStars <= 5) {
            const brightnessFactor = star.brightness / 255;
            console.log(`Star repositioned: brightness=${(brightnessFactor * 100).toFixed(1)}%, initial_shift=${initialLeftShift}, forward_shift=${forwardShift}, final_pos=${finalX}`);
          }
        }
      }
    }
    rightCtx.globalCompositeOperation = 'source-over';
    
    console.log(`Repositioned ${repositionedStars} bright stars forward from background position`);
    
    onProgress?.('Applying displacement filter to create nebula depth...', 90);
    // Step 4: Apply displacement filter to the NEBULA layer (not the stars!)
    // This is applied to the composite right image to give the nebula 3D depth
    const imageData = rightCtx.getImageData(0, 0, width, height);
    const lumCtx = luminanceMap.getContext('2d')!;
    const lumData = lumCtx.getImageData(0, 0, width, height);
    const displacedData = rightCtx.createImageData(width, height);
    
    // Apply horizontal displacement based on luminance
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Get displacement from luminance (brighter = more displacement)
        const lumValue = lumData.data[idx] / 255;
        const displacement = Math.round((lumValue - 0.5) * params.horizontalDisplace);
        
        // Calculate source position
        const srcX = Math.max(0, Math.min(width - 1, x - displacement));
        const srcIdx = (y * width + srcX) * 4;
        
        // Copy pixel data
        displacedData.data[idx] = imageData.data[srcIdx];
        displacedData.data[idx + 1] = imageData.data[srcIdx + 1];
        displacedData.data[idx + 2] = imageData.data[srcIdx + 2];
        displacedData.data[idx + 3] = imageData.data[srcIdx + 3];
      }
    }
    
    // Apply the displacement
    rightCtx.putImageData(displacedData, 0, 0);
    
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
