
/**
 * Enhanced location data for optimized SIQS calculations
 */
import { EnhancedLocation } from './siqsTypes';
import { haversineDistance } from '@/utils/geoUtils';

// Sample enhanced locations with pre-calculated data
const enhancedLocations: EnhancedLocation[] = [
  {
    name: "McDonald Observatory",
    latitude: 30.6714,
    longitude: -104.0214,
    bortleScale: 1,
    elevation: 2070,
    hasDarkSkyStatus: true,
    certification: "IDA Dark Sky Reserve",
    isDarkSkyReserve: true,
    clearSkyRate: 80,
    seasonalTrends: {
      spring: { clearSkyRate: 75, averageTemperature: 18 },
      summer: { clearSkyRate: 70, averageTemperature: 25 },
      fall: { clearSkyRate: 85, averageTemperature: 20 },
      winter: { clearSkyRate: 82, averageTemperature: 10 }
    },
    bestMonths: ["Oct", "Nov", "Mar", "Apr"]
  },
  {
    name: "Atacama Desert",
    latitude: -24.5,
    longitude: -69.25,
    bortleScale: 1,
    elevation: 2400,
    hasDarkSkyStatus: true,
    clearSkyRate: 90,
    seasonalTrends: {
      spring: { clearSkyRate: 88, averageTemperature: 15 },
      summer: { clearSkyRate: 92, averageTemperature: 22 },
      fall: { clearSkyRate: 90, averageTemperature: 18 },
      winter: { clearSkyRate: 85, averageTemperature: 10 }
    },
    bestMonths: ["May", "Jun", "Jul", "Aug"]
  }
];

/**
 * Find closest enhanced location to given coordinates
 */
export function findClosestEnhancedLocation(
  latitude: number,
  longitude: number,
  maxDistance: number = 50 // Maximum distance in kilometers
): EnhancedLocation | null {
  let closestLocation: EnhancedLocation | null = null;
  let minDistance = Infinity;
  
  for (const location of enhancedLocations) {
    const distance = haversineDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude
    );
    
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      closestLocation = location;
    }
  }
  
  return closestLocation;
}

/**
 * Get enhanced location by name
 */
export function getEnhancedLocationByName(name: string): EnhancedLocation | null {
  return enhancedLocations.find(loc => 
    loc.name.toLowerCase() === name.toLowerCase()
  ) || null;
}
