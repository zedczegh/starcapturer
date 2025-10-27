/**
 * Astrophysics Mode Service
 * 
 * Uses Gaia DR3 data for precise stereoscopic depth generation
 * based on actual star parallax measurements.
 */

import { supabase } from '@/integrations/supabase/client';

export interface GaiaStar {
  sourceId: string;
  ra: number;
  dec: number;
  parallax: number;
  gMag: number;
  bpRp: number;
  distance: number;
  color: {
    r: number;
    g: number;
    b: number;
  };
}

export interface GaiaQueryResult {
  stars: GaiaStar[];
  center: { ra: number; dec: number };
  count: number;
}

export interface AstrophysicsParams {
  objectName?: string;
  ra?: number;
  dec?: number;
  radius?: number;
  baseline?: number;
  fovDeg?: number;
  scaleFactor?: number;
}

export interface DetectedStar {
  x: number;
  y: number;
  flux: number;
  radius: number;
}

export class AstrophysicsService {
  /**
   * Query Gaia DR3 for stars in the field
   */
  static async queryGaiaStars(params: AstrophysicsParams): Promise<GaiaQueryResult> {
    try {
      console.log('Querying Gaia with params:', params);
      
      const { data, error } = await supabase.functions.invoke('query-gaia', {
        body: {
          objectName: params.objectName,
          ra: params.ra,
          dec: params.dec,
          radius: params.radius || 0.5,
          maxMag: 19,
          minParallax: 0.1,
        },
      });

      console.log('Gaia query response:', { data, error });

      if (error) {
        console.error('Gaia query error:', error);
        throw new Error(`Failed to query Gaia database: ${error.message || 'Unknown error'}`);
      }

      if (!data) {
        throw new Error('No response from Gaia database. Please check your connection.');
      }

      if (data.error) {
        throw new Error(`Gaia database error: ${data.error}`);
      }

      if (!data.stars || data.stars.length === 0) {
        throw new Error('No stars found in Gaia database for this object/region. Try a different object or check coordinates.');
      }

      console.log(`Successfully retrieved ${data.stars.length} stars from Gaia`);
      return data as GaiaQueryResult;
    } catch (error) {
      console.error('Error querying Gaia:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to Gaia database. Please try again.');
    }
  }

  /**
   * Match detected stars to Gaia catalog
   */
  static matchStarsToGaia(
    detectedStars: DetectedStar[],
    gaiaStars: GaiaStar[],
    imageWidth: number,
    imageHeight: number,
    fovDeg: number = 1.0,
    tolerancePixels: number = 5
  ): Array<{ detected: DetectedStar; gaia: GaiaStar }> {
    const pixelsPerDeg = imageWidth / fovDeg;
    const toleranceArcsec = (tolerancePixels / pixelsPerDeg) * 3600;

    const matches: Array<{ detected: DetectedStar; gaia: GaiaStar }> = [];
    const usedGaia = new Set<number>();

    // Simple nearest-neighbor matching
    for (const detected of detectedStars) {
      // Convert pixel to approximate RA/Dec offset from center
      const raOffset = (detected.x - imageWidth / 2) / pixelsPerDeg;
      const decOffset = (detected.y - imageHeight / 2) / pixelsPerDeg;

      let bestMatch: { index: number; distance: number } | null = null;

      gaiaStars.forEach((gaia, index) => {
        if (usedGaia.has(index)) return;

        // Simple angular distance approximation
        const dRa = (gaia.ra - raOffset) * 3600; // to arcsec
        const dDec = (gaia.dec - decOffset) * 3600;
        const distance = Math.sqrt(dRa * dRa + dDec * dDec);

        if (distance < toleranceArcsec && (!bestMatch || distance < bestMatch.distance)) {
          bestMatch = { index, distance };
        }
      });

      if (bestMatch) {
        matches.push({
          detected,
          gaia: gaiaStars[bestMatch.index],
        });
        usedGaia.add(bestMatch.index);
      }
    }

    return matches;
  }

  /**
   * Calculate stereo shift based on parallax
   */
  static calculateStereoShift(
    distance: number,
    baseline: number = 1.0,
    fovDeg: number = 1.0,
    imageWidth: number = 2048,
    scaleFactor: number = 1000
  ): { shiftLeft: number; shiftRight: number } {
    // Parallax in milliarcseconds
    const parallaxMas = (baseline / Math.max(distance, 1)) * 1000;
    
    // Convert to degrees
    const shiftDeg = parallaxMas * (1 / 3600000); // mas to deg
    
    // Convert to pixels
    const pixelsPerDeg = imageWidth / fovDeg;
    const shiftPixels = shiftDeg * pixelsPerDeg * scaleFactor;

    return {
      shiftLeft: -shiftPixels / 2,
      shiftRight: shiftPixels / 2,
    };
  }

  /**
   * Render stars onto canvas with depth-based positioning
   */
  static renderStarsWithDepth(
    canvas: HTMLCanvasElement,
    detectedStars: DetectedStar[],
    gaiaStars: GaiaStar[],
    matches: Array<{ detected: DetectedStar; gaia: GaiaStar }>,
    params: AstrophysicsParams,
    isLeftView: boolean
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageWidth = canvas.width;
    const baseline = params.baseline || 1.0;
    const fovDeg = params.fovDeg || 1.0;
    const scaleFactor = params.scaleFactor || 1000;

    // Find max flux for normalization
    const maxFlux = Math.max(...detectedStars.map(s => s.flux), 1);

    matches.forEach(({ detected, gaia }) => {
      const { shiftLeft, shiftRight } = this.calculateStereoShift(
        gaia.distance,
        baseline,
        fovDeg,
        imageWidth,
        scaleFactor
      );

      const shift = isLeftView ? shiftLeft : shiftRight;
      const x = detected.x + shift;
      const y = detected.y;

      // Skip if out of bounds
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
        return;
      }

      // Calculate star brightness
      const intensity = Math.min((detected.flux / maxFlux) * 0.1, 1.0);
      const radius = Math.max(detected.radius * 1.5, 2);

      // Draw star with color
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${gaia.color.r * 255}, ${gaia.color.g * 255}, ${gaia.color.b * 255}, ${intensity})`);
      gradient.addColorStop(1, `rgba(${gaia.color.r * 255}, ${gaia.color.g * 255}, ${gaia.color.b * 255}, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * Create complete stereo pair using astrophysics mode
   */
  static async createAstrophysicsStereoPair(
    starlessImage: File,
    starsImage: File,
    detectedStars: DetectedStar[],
    params: AstrophysicsParams,
    onProgress?: (step: string, progress?: number) => void
  ): Promise<{ leftCanvas: HTMLCanvasElement; rightCanvas: HTMLCanvasElement; gaiaData: GaiaQueryResult }> {
    try {
      if (!detectedStars || detectedStars.length === 0) {
        throw new Error('No stars detected in image. Please upload an image with visible stars.');
      }

      onProgress?.('Querying Gaia DR3 database...', 10);
      
      // Query Gaia for stars
      const gaiaData = await this.queryGaiaStars(params);
      
      if (gaiaData.count === 0) {
        throw new Error('No stars found in Gaia database for this region');
      }

      onProgress?.(`Found ${gaiaData.count} stars in Gaia`, 30);

      // Load starless background - handle TIFF and other formats
      onProgress?.('Loading background image...', 40);
      
      // Check if it's a TIFF file
      const isTiff = starlessImage.type === 'image/tiff' || 
                     starlessImage.type === 'image/tif' || 
                     starlessImage.name.toLowerCase().match(/\.tiff?$/);
      
      let starlessUrl: string;
      if (isTiff) {
        // Convert TIFF to data URL first
        const buffer = await starlessImage.arrayBuffer();
        // @ts-ignore
        const UTIF = (window as any).UTIF || await import('utif');
        const ifds = UTIF.decode(buffer);
        UTIF.decodeImage(buffer, ifds[0]);
        const rgba = UTIF.toRGBA8(ifds[0]);
        
        const canvas = document.createElement('canvas');
        canvas.width = ifds[0].width;
        canvas.height = ifds[0].height;
        const ctx = canvas.getContext('2d')!;
        
        const imageData = new ImageData(new Uint8ClampedArray(rgba), ifds[0].width, ifds[0].height);
        ctx.putImageData(imageData, 0, 0);
        
        starlessUrl = canvas.toDataURL();
      } else {
        starlessUrl = URL.createObjectURL(starlessImage);
      }
      
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = (e) => {
          console.error('Failed to load starless image:', e);
          reject(new Error('Failed to load starless background image. Please check the file format.'));
        };
        image.src = starlessUrl;
      });

      // Create canvases
      const leftCanvas = document.createElement('canvas');
      const rightCanvas = document.createElement('canvas');
      leftCanvas.width = rightCanvas.width = img.width;
      leftCanvas.height = rightCanvas.height = img.height;

      // Draw background on both
      const leftCtx = leftCanvas.getContext('2d')!;
      const rightCtx = rightCanvas.getContext('2d')!;
      leftCtx.drawImage(img, 0, 0);
      rightCtx.drawImage(img, 0, 0);

      // Clean up URL only if not a data URL (TIFF conversions create data URLs)
      if (!starlessUrl.startsWith('data:')) {
        URL.revokeObjectURL(starlessUrl);
      }

      onProgress?.('Matching stars to Gaia catalog...', 50);

      // Match detected stars to Gaia
      const matches = this.matchStarsToGaia(
        detectedStars,
        gaiaData.stars,
        img.width,
        img.height,
        params.fovDeg || 1.0
      );

      onProgress?.(`Matched ${matches.length} stars`, 60);

      onProgress?.('Rendering left view...', 70);
      this.renderStarsWithDepth(leftCanvas, detectedStars, gaiaData.stars, matches, params, true);

      onProgress?.('Rendering right view...', 85);
      this.renderStarsWithDepth(rightCanvas, detectedStars, gaiaData.stars, matches, params, false);

      onProgress?.('Stereo pair complete', 100);

      return { leftCanvas, rightCanvas, gaiaData };
    } catch (error) {
      console.error('Error creating astrophysics stereo pair:', error);
      throw error;
    }
  }
}
