/**
 * Internal API Service for Traditional Morph Processing
 * Handles stereoscopic pair generation from starless and stars-only images
 */

import { TraditionalMorphProcessor } from '@/lib/traditionalMorphMode';

export interface TraditionalMorphParams {
  horizontalDisplace: number;  // Default: 25
  starShiftAmount: number;      // Default: 6
  luminanceBlur: number;        // Default: 1.5
  contrastBoost: number;        // Default: 1.2
  stereoSpacing: number;        // Default: 600
  borderSize: number;           // Default: 300
}

export interface MorphedPairResult {
  leftComposite: HTMLCanvasElement;
  rightComposite: HTMLCanvasElement;
  depthMap: HTMLCanvasElement;
  finalCanvas: HTMLCanvasElement;
}

export class TraditionalMorphService {
  private static processor: TraditionalMorphProcessor | null = null;

  /**
   * Default parameters matching Traditional Morph tool
   */
  static readonly DEFAULT_PARAMS: TraditionalMorphParams = {
    horizontalDisplace: 25,
    starShiftAmount: 6,
    luminanceBlur: 1.5,
    contrastBoost: 1.2,
    stereoSpacing: 600,
    borderSize: 300
  };

  /**
   * Initialize the processor
   */
  private static getProcessor(): TraditionalMorphProcessor {
    if (!this.processor) {
      this.processor = new TraditionalMorphProcessor();
    }
    return this.processor;
  }

  /**
   * Process starless and stars images into stereoscopic pair
   */
  static async createStereoPair(
    starlessFile: File,
    starsFile: File,
    params: Partial<TraditionalMorphParams> = {},
    onProgress?: (step: string, progress?: number) => void
  ): Promise<MorphedPairResult> {
    const processor = this.getProcessor();
    
    // Merge with default params
    const finalParams = {
      ...this.DEFAULT_PARAMS,
      ...params
    };

    try {
      // Create traditional stereo pair using the same algorithm as Stereoscope Processor
      const result = await processor.createTraditionalStereoPair(
        { starlessImage: starlessFile, starsOnlyImage: starsFile },
        {
          horizontalDisplace: finalParams.horizontalDisplace,
          starShiftAmount: finalParams.starShiftAmount,
          luminanceBlur: finalParams.luminanceBlur,
          contrastBoost: finalParams.contrastBoost
        },
        onProgress
      );

      // Create final side-by-side canvas with borders
      const finalCanvas = processor.createFinalStereoPair(
        result.leftCanvas,
        result.rightCanvas,
        finalParams.stereoSpacing,
        finalParams.borderSize > 0
      );

      return {
        leftComposite: result.leftCanvas,
        rightComposite: result.rightCanvas,
        depthMap: result.depthMap,
        finalCanvas
      };

    } catch (error) {
      console.error('Traditional morph processing error:', error);
      throw new Error(`Failed to create stereo pair: ${error}`);
    }
  }

  /**
   * Create separated stereo layers (backgrounds and stars separate)
   * This is needed for video generation where layers must be kept separate
   */
  static async createSeparatedStereoPair(
    starlessFile: File,
    starsFile: File,
    params: Partial<TraditionalMorphParams> = {},
    onProgress?: (step: string, progress?: number) => void
  ): Promise<{
    leftBackground: HTMLCanvasElement;
    leftStars: HTMLCanvasElement;
    rightBackground: HTMLCanvasElement;
    rightStars: HTMLCanvasElement;
    depthMap: HTMLCanvasElement;
    luminanceMap: HTMLCanvasElement;
  }> {
    const processor = this.getProcessor();
    
    // Merge with default params
    const finalParams = {
      ...this.DEFAULT_PARAMS,
      ...params
    };

    try {
      onProgress?.('Loading images...', 10);
      const { starlessImg, starsImg } = await processor.loadImages({
        starlessImage: starlessFile,
        starsOnlyImage: starsFile
      });

      const width = starlessImg.width;
      const height = starlessImg.height;

      onProgress?.('Creating depth maps...', 30);
      const depthMaps = processor.createAdvancedDepthMap(starlessImg, finalParams.luminanceBlur);

      // LEFT SIDE: Keep original
      const leftBackground = document.createElement('canvas');
      leftBackground.width = width;
      leftBackground.height = height;
      const leftBgCtx = leftBackground.getContext('2d')!;
      leftBgCtx.drawImage(starlessImg, 0, 0);

      const leftStars = document.createElement('canvas');
      leftStars.width = width;
      leftStars.height = height;
      const leftStarsCtx = leftStars.getContext('2d')!;
      leftStarsCtx.drawImage(starsImg, 0, 0);

      onProgress?.('Creating right view with star repositioning...', 50);
      
      // RIGHT SIDE: Reposition stars following Traditional Morph logic
      const rightStars = document.createElement('canvas');
      rightStars.width = width;
      rightStars.height = height;
      const rightStarsCtx = rightStars.getContext('2d')!;

      // Initial left shift for all stars (behind nebula)
      const initialLeftShift = -3;
      rightStarsCtx.drawImage(starsImg, initialLeftShift, 0);

      // Reposition bright stars forward
      // Provide default profile to avoid null reference errors
      const defaultProfile = {
        spikeDetectionSensitivity: 0.8,
        chunkSize: 128,
        maxStarsToProcess: 10000
      };
      const starPatterns = processor.detectStarPatterns(starsImg, defaultProfile);
      const brightStars = starPatterns.filter(star => star.brightness / 255 > 0.35).slice(0, 15);

      for (const star of brightStars) {
        const brightnessFactor = star.brightness / 255;
        const forwardShift = finalParams.starShiftAmount * (1 + brightnessFactor);
        
        const padding = Math.max(3, Math.ceil(star.boundingBox.width * 0.15));
        const expandedBbox = {
          x: Math.max(0, star.boundingBox.x - padding),
          y: Math.max(0, star.boundingBox.y - padding),
          width: Math.min(width - (star.boundingBox.x - padding), star.boundingBox.width + padding * 2),
          height: Math.min(height - (star.boundingBox.y - padding), star.boundingBox.height + padding * 2)
        };

        const originalShiftedX = expandedBbox.x + initialLeftShift;
        const finalX = expandedBbox.x + initialLeftShift + forwardShift;

        if (finalX < 0 || finalX + expandedBbox.width >= width - 2 || originalShiftedX < 0) {
          continue;
        }

        // Remove star from original position (make transparent)
        rightStarsCtx.clearRect(originalShiftedX, expandedBbox.y, expandedBbox.width, expandedBbox.height);

        // Draw star at new position
        rightStarsCtx.drawImage(
          starsImg,
          expandedBbox.x, expandedBbox.y, expandedBbox.width, expandedBbox.height,
          finalX, expandedBbox.y, expandedBbox.width, expandedBbox.height
        );
      }

      onProgress?.('Applying displacement to background...', 80);
      
      // Apply displacement to background
      const rightBgCanvas = document.createElement('canvas');
      rightBgCanvas.width = width;
      rightBgCanvas.height = height;
      const rightBgCtx = rightBgCanvas.getContext('2d')!;
      rightBgCtx.drawImage(starlessImg, 0, 0);

      const displacedBg = await processor.applyOptimizedDisplacement(
        rightBgCanvas,
        depthMaps,
        finalParams.horizontalDisplace,
        onProgress
      );

      const rightBackground = document.createElement('canvas');
      rightBackground.width = width;
      rightBackground.height = height;
      const rightBackgroundCtx = rightBackground.getContext('2d')!;
      rightBackgroundCtx.drawImage(displacedBg, 0, 0);

      return {
        leftBackground,
        leftStars,
        rightBackground,
        rightStars,
        depthMap: depthMaps.combinedDepth,
        luminanceMap: depthMaps.primaryDepth
      };

    } catch (error) {
      console.error('Separated stereo pair creation error:', error);
      throw new Error(`Failed to create separated stereo pair: ${error}`);
    }
  }

  /**
   * Extract left and right composites as images
   */
  static async extractCompositeImages(result: MorphedPairResult): Promise<{
    leftImage: string;
    rightImage: string;
  }> {
    const leftImage = result.leftComposite.toDataURL('image/png');
    const rightImage = result.rightComposite.toDataURL('image/png');
    
    return { leftImage, rightImage };
  }

  /**
   * Clean up resources
   */
  static dispose(): void {
    if (this.processor) {
      this.processor.dispose();
      this.processor = null;
    }
  }
}
