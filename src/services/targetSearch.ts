import { supabase } from "@/integrations/supabase/client";

export interface TargetSearchResult {
  name: string;
  ra: number;
  dec: number;
  objectType?: string;
  aliases?: string[];
  distance?: {
    value: number;
    unit: string;
    source: string;
  };
}

export async function searchTarget(query: string): Promise<TargetSearchResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('search-target', {
      body: { query }
    });

    if (error) {
      console.error('Target search error:', error);
      throw error;
    }

    if (data?.error) {
      if (data.error.includes('not found')) {
        return null;
      }
      throw new Error(data.error);
    }

    return data?.result || null;
  } catch (err) {
    console.error('Failed to search target:', err);
    throw err;
  }
}

/**
 * Calculate suggested displacement based on distance in light years
 */
export function calculateDisplacementFromDistance(distanceLY: number): { starless: number; stars: number } {
  let starlessDisp: number;
  let starsDisp: number;
  
  if (distanceLY <= 500) {
    // Very close: max displacement
    starlessDisp = 45;
    starsDisp = 25;
  } else if (distanceLY <= 1500) {
    // Close nebulae (Orion, Rosette)
    starlessDisp = 35;
    starsDisp = 20;
  } else if (distanceLY <= 3000) {
    // Mid-range (Eagle, Lagoon)
    starlessDisp = 25;
    starsDisp = 15;
  } else if (distanceLY <= 7000) {
    // Distant (Carina, Heart)
    starlessDisp = 18;
    starsDisp = 12;
  } else if (distanceLY <= 50000) {
    // Very distant nebulae/clusters
    starlessDisp = 12;
    starsDisp = 8;
  } else if (distanceLY <= 3000000) {
    // Local group galaxies (Andromeda, Triangulum)
    starlessDisp = 8;
    starsDisp = 5;
  } else {
    // Distant galaxies
    starlessDisp = 5;
    starsDisp = 3;
  }
  
  return { starless: starlessDisp, stars: starsDisp };
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
 * Map SIMBAD object types to our categories
 */
export function mapObjectType(simbadType?: string): 'nebula' | 'galaxy' | 'planetary' | 'mixed' {
  if (!simbadType) return 'mixed';
  
  const type = simbadType.toLowerCase();
  
  if (type.includes('gal') || type === 'g') {
    return 'galaxy';
  }
  if (type.includes('pn') || type.includes('planetary')) {
    return 'planetary';
  }
  if (type.includes('neb') || type.includes('hii') || type.includes('snr') || 
      type.includes('rn') || type.includes('en') || type.includes('dn')) {
    return 'nebula';
  }
  
  return 'mixed';
}
