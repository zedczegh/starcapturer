import { supabase } from "@/integrations/supabase/client";

export interface PlateSolveResult {
  success: boolean;
  error?: string;
  calibration?: {
    ra: number;
    dec: number;
    radius: number;
    pixscale: number;
    orientation: number;
    parity: number;
  };
  objectsInField: string[];
  machineTags: string[];
}

/**
 * Convert a blob URL or image URL to a base64 data URL
 */
async function convertToBase64DataUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Limit size for API (max 2048px for plate solving - needs detail)
      const maxDim = 2048;
      let width = img.width;
      let height = img.height;
      
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Use JPEG with higher quality for plate solving (needs star details)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for conversion'));
    };
    
    img.src = imageUrl;
  });
}

export async function plateSolveImage(imageDataUrl: string): Promise<PlateSolveResult> {
  try {
    const base64DataUrl = await convertToBase64DataUrl(imageDataUrl);
    
    const { data, error } = await supabase.functions.invoke('plate-solve', {
      body: {
        imageBase64: base64DataUrl,
      }
    });

    if (error) {
      console.error('Plate solve error:', error);
      return {
        success: false,
        error: error.message || 'Failed to plate solve image',
        objectsInField: [],
        machineTags: [],
      };
    }

    return data as PlateSolveResult;
  } catch (err) {
    console.error('Failed to plate solve image:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      objectsInField: [],
      machineTags: [],
    };
  }
}

/**
 * Format RA (Right Ascension) from degrees to hours:minutes:seconds
 */
export function formatRA(raDegrees: number): string {
  const hours = raDegrees / 15;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = ((hours - h) * 60 - m) * 60;
  return `${h}h ${m}m ${s.toFixed(1)}s`;
}

/**
 * Format Dec (Declination) from degrees to degrees:arcminutes:arcseconds
 */
export function formatDec(decDegrees: number): string {
  const sign = decDegrees >= 0 ? '+' : '-';
  const absVal = Math.abs(decDegrees);
  const d = Math.floor(absVal);
  const m = Math.floor((absVal - d) * 60);
  const s = ((absVal - d) * 60 - m) * 60;
  return `${sign}${d}° ${m}' ${s.toFixed(1)}"`;
}

/**
 * Get constellation from RA/Dec coordinates (simplified lookup)
 */
export function getConstellation(ra: number, dec: number): string {
  // Simplified constellation lookup based on rough RA/Dec ranges
  // This is not astronomically accurate but gives a rough idea
  if (dec > 50) {
    if (ra > 180 && ra < 270) return "Draco";
    if (ra > 60 && ra < 180) return "Ursa Major";
    return "Cassiopeia";
  }
  if (dec > 0 && dec < 50) {
    if (ra > 75 && ra < 100) return "Orion";
    if (ra > 180 && ra < 220) return "Boötes";
    if (ra > 300 && ra < 340) return "Pegasus";
    if (ra > 230 && ra < 280) return "Hercules";
    return "Leo";
  }
  if (dec < 0 && dec > -50) {
    if (ra > 80 && ra < 140) return "Canis Major";
    if (ra > 155 && ra < 200) return "Centaurus";
    if (ra > 250 && ra < 290) return "Sagittarius";
    return "Scorpius";
  }
  return "Southern Sky";
}
