/**
 * Internal API Service for Traditional Morph Processing
 * Handles stereoscopic pair generation from starless and stars-only images
 */

import { TraditionalMorphProcessor } from '@/lib/traditionalMorphMode';

export interface TraditionalMorphParams {
  horizontalDisplace: number;  // Default: 25
  starShiftAmount: number;      // Default: 6
  starBackgroundShift: number;  // Default: 25 - Initial shift of all stars left/back
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
    starBackgroundShift: 25,  // Initial shift of all stars left/back (SHIFT+ARROW 2-3 times in PhotoShop)
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
          starBackgroundShift: finalParams.starBackgroundShift,
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
