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
      // Reduced size for faster upload - Astrometry.net downsamples anyway
      // 1400px is enough for reliable plate solving
      const maxDim = 1400;
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
      
      // Use JPEG with moderate quality for faster upload (still enough for star detection)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
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
 * Get constellation from RA/Dec coordinates
 */
export function getConstellation(ra: number, dec: number): string {
  // Convert RA to hours for easier matching
  const raHours = ra / 15;
  
  // Simplified constellation lookup based on RA/Dec ranges
  if (dec > 50) {
    if (ra > 180 && ra < 270) return "Draco";
    if (ra > 60 && ra < 180) return "Ursa Major";
    return "Cassiopeia";
  }
  if (dec > 0 && dec < 50) {
    if (raHours > 5 && raHours < 7) return "Orion";
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

// Deep sky objects database with coordinates and distance info
interface DeepSkyObject {
  name: string;
  commonName?: string;
  ra: number; // degrees
  dec: number; // degrees
  type: 'nebula' | 'galaxy' | 'cluster' | 'planetary' | 'dark_nebula';
  distanceLY?: number; // light years
  angularSize?: number; // degrees
}

const DEEP_SKY_CATALOG: DeepSkyObject[] = [
  // Orion region
  { name: "LDN 1622", commonName: "Boogeyman Nebula", ra: 88.5, dec: 1.9, type: "dark_nebula", distanceLY: 500 },
  { name: "M42", commonName: "Orion Nebula", ra: 83.82, dec: -5.39, type: "nebula", distanceLY: 1344, angularSize: 1.5 },
  { name: "M43", commonName: "De Mairan's Nebula", ra: 83.89, dec: -5.27, type: "nebula", distanceLY: 1600 },
  { name: "NGC 2024", commonName: "Flame Nebula", ra: 85.42, dec: -1.85, type: "nebula", distanceLY: 1350 },
  { name: "IC 434", commonName: "Horsehead Nebula", ra: 85.25, dec: -2.46, type: "dark_nebula", distanceLY: 1500 },
  { name: "M78", commonName: "Reflection Nebula", ra: 86.68, dec: 0.08, type: "nebula", distanceLY: 1600 },
  { name: "NGC 1977", commonName: "Running Man Nebula", ra: 83.85, dec: -4.83, type: "nebula", distanceLY: 1500 },
  { name: "Barnard's Loop", commonName: "Sh2-276", ra: 85.0, dec: -4.0, type: "nebula", distanceLY: 1400, angularSize: 10 },
  
  // Sagittarius region
  { name: "M8", commonName: "Lagoon Nebula", ra: 270.9, dec: -24.38, type: "nebula", distanceLY: 4100 },
  { name: "M17", commonName: "Omega Nebula", ra: 275.2, dec: -16.17, type: "nebula", distanceLY: 5500 },
  { name: "M20", commonName: "Trifid Nebula", ra: 270.6, dec: -23.03, type: "nebula", distanceLY: 4100 },
  { name: "M16", commonName: "Eagle Nebula", ra: 274.7, dec: -13.81, type: "nebula", distanceLY: 7000 },
  
  // Carina region
  { name: "NGC 3372", commonName: "Carina Nebula", ra: 160.9, dec: -59.87, type: "nebula", distanceLY: 7500 },
  
  // Cygnus region
  { name: "NGC 7000", commonName: "North America Nebula", ra: 314.0, dec: 44.0, type: "nebula", distanceLY: 2200 },
  { name: "IC 5070", commonName: "Pelican Nebula", ra: 312.75, dec: 44.35, type: "nebula", distanceLY: 1800 },
  { name: "NGC 6992", commonName: "Veil Nebula (East)", ra: 312.75, dec: 31.72, type: "nebula", distanceLY: 2400 },
  { name: "NGC 6960", commonName: "Veil Nebula (West)", ra: 311.3, dec: 30.72, type: "nebula", distanceLY: 2400 },
  
  // Other popular targets
  { name: "M31", commonName: "Andromeda Galaxy", ra: 10.68, dec: 41.27, type: "galaxy", distanceLY: 2537000 },
  { name: "M33", commonName: "Triangulum Galaxy", ra: 23.46, dec: 30.66, type: "galaxy", distanceLY: 2730000 },
  { name: "M51", commonName: "Whirlpool Galaxy", ra: 202.47, dec: 47.2, type: "galaxy", distanceLY: 23000000 },
  { name: "M101", commonName: "Pinwheel Galaxy", ra: 210.8, dec: 54.35, type: "galaxy", distanceLY: 21000000 },
  { name: "M81", commonName: "Bode's Galaxy", ra: 148.89, dec: 69.07, type: "galaxy", distanceLY: 12000000 },
  { name: "M82", commonName: "Cigar Galaxy", ra: 148.97, dec: 69.68, type: "galaxy", distanceLY: 12000000 },
  { name: "NGC 6644", commonName: "Planetary Nebula", ra: 277.1, dec: -25.12, type: "planetary", distanceLY: 5000 },
  
  // Star clusters
  { name: "M45", commonName: "Pleiades", ra: 56.87, dec: 24.12, type: "cluster", distanceLY: 444 },
  { name: "M44", commonName: "Beehive Cluster", ra: 130.1, dec: 19.67, type: "cluster", distanceLY: 577 },
  { name: "NGC 869", commonName: "Double Cluster (h)", ra: 35.1, dec: 57.13, type: "cluster", distanceLY: 7500 },
  { name: "NGC 884", commonName: "Double Cluster (χ)", ra: 35.62, dec: 57.15, type: "cluster", distanceLY: 7500 },
  
  // Rosette and Monoceros
  { name: "NGC 2237", commonName: "Rosette Nebula", ra: 98.0, dec: 5.0, type: "nebula", distanceLY: 5200 },
  { name: "NGC 2264", commonName: "Cone Nebula", ra: 100.24, dec: 9.9, type: "nebula", distanceLY: 2700 },
  
  // Scorpius
  { name: "NGC 6334", commonName: "Cat's Paw Nebula", ra: 260.2, dec: -35.78, type: "nebula", distanceLY: 5500 },
  { name: "IC 4628", commonName: "Prawn Nebula", ra: 254.4, dec: -40.07, type: "nebula", distanceLY: 6000 },
  
  // California and Pleiades region
  { name: "NGC 1499", commonName: "California Nebula", ra: 60.2, dec: 36.42, type: "nebula", distanceLY: 1000 },
  
  // Heart and Soul
  { name: "IC 1805", commonName: "Heart Nebula", ra: 38.2, dec: 61.47, type: "nebula", distanceLY: 7500 },
  { name: "IC 1848", commonName: "Soul Nebula", ra: 42.05, dec: 60.43, type: "nebula", distanceLY: 7500 },
];

/**
 * Find the closest deep sky object to given coordinates
 */
export function identifyDeepSkyObject(ra: number, dec: number, fieldRadius: number = 1): DeepSkyObject | null {
  let closest: DeepSkyObject | null = null;
  let minDistance = Infinity;
  
  for (const obj of DEEP_SKY_CATALOG) {
    // Calculate angular distance (simplified, good enough for this purpose)
    const dRa = (obj.ra - ra) * Math.cos(dec * Math.PI / 180);
    const dDec = obj.dec - dec;
    const distance = Math.sqrt(dRa * dRa + dDec * dDec);
    
    // Check if within field of view + some margin
    const searchRadius = fieldRadius * 2;
    if (distance < searchRadius && distance < minDistance) {
      minDistance = distance;
      closest = obj;
    }
  }
  
  return closest;
}

/**
 * Calculate suggested displacement based on object distance
 */
export function calculateSuggestedDisplacement(distanceLY: number): { starless: number; stars: number } {
  let starlessDisp: number;
  let starsDisp: number;
  
  if (distanceLY <= 500) {
    // Very close: max displacement
    starlessDisp = 45;
    starsDisp = 25;
  } else if (distanceLY <= 1500) {
    // Close nebulae
    starlessDisp = 35;
    starsDisp = 20;
  } else if (distanceLY <= 3000) {
    // Mid-range
    starlessDisp = 25;
    starsDisp = 15;
  } else if (distanceLY <= 7000) {
    // Distant
    starlessDisp = 18;
    starsDisp = 12;
  } else if (distanceLY <= 50000) {
    // Very distant nebulae/clusters
    starlessDisp = 12;
    starsDisp = 8;
  } else {
    // Galaxies
    starlessDisp = 8;
    starsDisp = 5;
  }
  
  return { starless: starlessDisp, stars: starsDisp };
}
