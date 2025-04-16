// Enhanced water detection using high-precision coordinates, pre-computed data, and OSM data
import { isWaterLocation as basicWaterCheck } from '../locationWaterCheck';

// Major water bodies with more precise boundaries
const PRECISE_WATER_BODIES = [
  // Major Oceans with detailed boundaries
  {
    name: "Pacific Ocean",
    polygons: [
      { minLat: -60, maxLat: 65, minLng: 125, maxLng: -70 },
      { minLat: -60, maxLat: 65, minLng: -180, maxLng: -70 }
    ]
  },
  // Seas and Gulfs with precise boundaries
  {
    name: "Mediterranean Sea",
    bounds: { minLat: 30, maxLat: 46, minLng: -6, maxLng: 36 }
  },
  // Major Lakes
  {
    name: "Great Lakes",
    bounds: { minLat: 41, maxLat: 49, minLng: -93, maxLng: -76 }
  }
];

// Coastal regions that need special handling
const COASTAL_EXCLUSIONS = [
  // Major port cities and coastal areas that should be considered land
  { name: "New York Harbor", bounds: { minLat: 40.4, maxLat: 40.9, minLng: -74.3, maxLng: -73.7 } },
  { name: "Tokyo Bay", bounds: { minLat: 35.3, maxLat: 35.8, minLng: 139.6, maxLng: 140.1 } },
];

interface WaterDetectionResult {
  isWater: boolean;
  confidence: number;
  source: string;
}

/**
 * Check if location is water using OpenStreetMap's Nominatim API
 */
async function checkOSMWater(latitude: number, longitude: number): Promise<boolean | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SIQSCalculatorApp'
      }
    });
    
    if (!response.ok) {
      console.warn('OSM API request failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    // Check various OSM properties that indicate water
    const category = data.category?.toLowerCase() || '';
    const type = data.type?.toLowerCase() || '';
    const display = data.display_name?.toLowerCase() || '';
    
    const waterKeywords = ['water', 'sea', 'ocean', 'bay', 'gulf', 'lake', 'river'];
    
    return waterKeywords.some(keyword => 
      category.includes(keyword) || 
      type.includes(keyword) || 
      display.includes(keyword)
    );
  } catch (error) {
    console.warn('Error checking OSM water:', error);
    return null;
  }
}

/**
 * Enhanced water detection with multiple verification layers including OSM data
 */
export async function detectWaterLocationAsync(
  latitude: number,
  longitude: number,
  skipCoastalCheck: boolean = false
): Promise<WaterDetectionResult> {
  // Normalize coordinates
  const lat = Math.max(-90, Math.min(90, latitude));
  const lng = ((longitude + 180) % 360 + 360) % 360 - 180;
  
  // First check known coastal exclusions
  if (!skipCoastalCheck) {
    for (const exclusion of COASTAL_EXCLUSIONS) {
      const { bounds } = exclusion;
      if (
        lat >= bounds.minLat && 
        lat <= bounds.maxLat && 
        lng >= bounds.minLng && 
        lng <= bounds.maxLng
      ) {
        return {
          isWater: false,
          confidence: 0.95,
          source: `coastal_exclusion:${exclusion.name}`
        };
      }
    }
  }
  
  // Check OSM data first
  const osmResult = await checkOSMWater(lat, lng);
  if (osmResult !== null) {
    return {
      isWater: osmResult,
      confidence: 0.98,
      source: 'osm_api'
    };
  }
  
  // Fallback to precise water bodies check
  for (const body of PRECISE_WATER_BODIES) {
    if ('polygons' in body) {
      // Check multiple polygons for complex water bodies
      for (const polygon of body.polygons) {
        if (
          lat >= polygon.minLat && 
          lat <= polygon.maxLat &&
          (
            (lng >= polygon.minLng && lng <= 180) ||
            (lng >= -180 && lng <= polygon.maxLng)
          )
        ) {
          return {
            isWater: true,
            confidence: 0.98,
            source: `precise_body:${body.name}`
          };
        }
      }
    } else if ('bounds' in body) {
      // Simple boundary check
      const { bounds } = body;
      if (
        lat >= bounds.minLat && 
        lat <= bounds.maxLat && 
        lng >= bounds.minLng && 
        lng <= bounds.maxLng
      ) {
        return {
          isWater: true,
          confidence: 0.95,
          source: `water_body:${body.name}`
        };
      }
    }
  }
  
  // Use basic water check as final fallback
  const isWater = basicWaterCheck(lat, lng);
  return {
    isWater,
    confidence: 0.85,
    source: 'basic_check'
  };
}

// Keep the sync version for backward compatibility
export function detectWaterLocation(
  latitude: number,
  longitude: number,
  skipCoastalCheck: boolean = false
): WaterDetectionResult {
  // Use the existing synchronous checks only
  // Normalize coordinates
  const lat = Math.max(-90, Math.min(90, latitude));
  const lng = ((longitude + 180) % 360 + 360) % 360 - 180;
  
  // First check known coastal exclusions
  if (!skipCoastalCheck) {
    for (const exclusion of COASTAL_EXCLUSIONS) {
      const { bounds } = exclusion;
      if (
        lat >= bounds.minLat && 
        lat <= bounds.maxLat && 
        lng >= bounds.minLng && 
        lng <= bounds.maxLng
      ) {
        return {
          isWater: false,
          confidence: 0.95,
          source: `coastal_exclusion:${exclusion.name}`
        };
      }
    }
  }
  
  // Check precise water bodies
  for (const body of PRECISE_WATER_BODIES) {
    if ('polygons' in body) {
      // Check multiple polygons for complex water bodies
      for (const polygon of body.polygons) {
        if (
          lat >= polygon.minLat && 
          lat <= polygon.maxLat &&
          (
            (lng >= polygon.minLng && lng <= 180) ||
            (lng >= -180 && lng <= polygon.maxLng)
          )
        ) {
          return {
            isWater: true,
            confidence: 0.98,
            source: `precise_body:${body.name}`
          };
        }
      }
    } else if ('bounds' in body) {
      // Simple boundary check
      const { bounds } = body;
      if (
        lat >= bounds.minLat && 
        lat <= bounds.maxLat && 
        lng >= bounds.minLng && 
        lng <= bounds.maxLng
      ) {
        return {
          isWater: true,
          confidence: 0.95,
          source: `water_body:${body.name}`
        };
      }
    }
  }
  
  // Use basic water check as fallback
  const isWater = basicWaterCheck(lat, lng);
  return {
    isWater,
    confidence: 0.85,
    source: 'basic_check'
  };
}

// Additional helper to verify land locations
export function verifyLandLocation(latitude: number, longitude: number): boolean {
  const result = detectWaterLocation(latitude, longitude);
  return !result.isWater || result.confidence < 0.85;
}
