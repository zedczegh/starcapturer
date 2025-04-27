
/**
 * Clear Sky Data Collector Service
 * 
 * Service for collecting and analyzing clear sky observations from various sources
 */

import { memoize } from "@/utils/memoization";

// Define the structure for clear sky observations
export interface ClearSkyObservation {
  latitude: number;
  longitude: number;
  clearSkyRate: number;
  timestamp: number;
  userId?: string;
  source?: string;
  confidence?: number;
  notes?: string;
}

// Define the structure for clear sky stations
interface ClearSkyStation {
  id: string;
  name?: string;
  latitude: number;
  longitude: number;
  observations: ClearSkyObservation[];
  lastUpdated: number;
}

// Storage for observations
const observations: ClearSkyObservation[] = [];
const stations: Map<string, ClearSkyStation> = new Map();

/**
 * Generate a location key from coordinates
 */
function getLocationKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
}

/**
 * Add an observation to the collector
 * 
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param clearSkyRate Clear sky rate (0-100)
 * @param userId Optional user ID for tracking
 * @returns Success status
 */
function addObservation(
  latitude: number,
  longitude: number,
  clearSkyRate: number,
  userId?: string
): boolean {
  try {
    // Validate inputs
    if (isNaN(latitude) || isNaN(longitude) || isNaN(clearSkyRate)) {
      return false;
    }
    
    if (clearSkyRate < 0 || clearSkyRate > 100) {
      clearSkyRate = Math.max(0, Math.min(100, clearSkyRate));
    }
    
    // Create observation
    const observation: ClearSkyObservation = {
      latitude,
      longitude,
      clearSkyRate,
      timestamp: Date.now(),
      userId
    };
    
    // Add to observations array
    observations.push(observation);
    
    // Update station data if applicable
    const locationKey = getLocationKey(latitude, longitude);
    
    if (!stations.has(locationKey)) {
      stations.set(locationKey, {
        id: locationKey,
        latitude,
        longitude,
        observations: [observation],
        lastUpdated: Date.now()
      });
    } else {
      const station = stations.get(locationKey)!;
      station.observations.push(observation);
      station.lastUpdated = Date.now();
    }
    
    return true;
  } catch (error) {
    console.error("Error adding clear sky observation:", error);
    return false;
  }
}

/**
 * Calculate clear sky rate for a location based on nearby observations
 * 
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate 
 * @param radiusKm Radius to consider in kilometers
 * @returns Calculated clear sky rate with additional info
 */
function calculateClearSkyRate(
  latitude: number,
  longitude: number,
  radiusKm: number = 25
): {
  rate: number;
  confidence: number;
  observations: number;
} {
  try {
    // Find observations within the radius
    const nearbyObservations = observations.filter(obs => {
      const distance = calculateDistance(
        latitude,
        longitude,
        obs.latitude,
        obs.longitude
      );
      
      return distance <= radiusKm;
    });
    
    // If no observations, return default values
    if (nearbyObservations.length === 0) {
      return {
        rate: 0,
        confidence: 0,
        observations: 0
      };
    }
    
    // Calculate weighted average based on distance and recency
    let totalWeight = 0;
    let weightedSum = 0;
    const now = Date.now();
    
    for (const obs of nearbyObservations) {
      // Calculate distance weight (closer = higher weight)
      const distance = calculateDistance(
        latitude, 
        longitude, 
        obs.latitude, 
        obs.longitude
      );
      
      const distanceWeight = 1 - (distance / radiusKm);
      
      // Calculate time weight (more recent = higher weight)
      // Observations older than 30 days get less weight
      const ageInDays = (now - obs.timestamp) / (1000 * 60 * 60 * 24);
      const timeWeight = Math.max(0, 1 - (ageInDays / 30));
      
      // Combined weight
      const weight = distanceWeight * timeWeight;
      
      totalWeight += weight;
      weightedSum += obs.clearSkyRate * weight;
    }
    
    // Calculate final rate
    const rate = totalWeight > 0 
      ? weightedSum / totalWeight 
      : 0;
    
    // Calculate confidence based on number and recency of observations
    const observationCount = nearbyObservations.length;
    const recencyFactor = Math.min(1, observationCount / 10);
    const confidence = 0.5 + (recencyFactor * 0.5);
    
    return {
      rate,
      confidence,
      observations: observationCount
    };
  } catch (error) {
    console.error("Error calculating clear sky rate:", error);
    
    return {
      rate: 0,
      confidence: 0,
      observations: 0
    };
  }
}

/**
 * Get all observations for a specific user
 * 
 * @param userId User ID to filter by
 * @returns Array of user's observations
 */
function getUserObservations(userId: string): ClearSkyObservation[] {
  return observations.filter(obs => obs.userId === userId);
}

/**
 * Get observations for a specific location
 * 
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param radiusKm Radius to search within
 * @returns Array of observations
 */
function getObservationsForLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): ClearSkyObservation[] {
  return observations.filter(obs => {
    const distance = calculateDistance(
      latitude,
      longitude,
      obs.latitude,
      obs.longitude
    );
    
    return distance <= radiusKm;
  });
}

/**
 * Record data for a specific station
 * 
 * @param stationId Station identifier
 * @param clearSkyRate Clear sky rate (0-100)
 * @param metadata Additional metadata
 * @returns Success status
 */
function recordStationData(
  stationId: string,
  clearSkyRate: number,
  metadata?: {
    latitude?: number;
    longitude?: number;
    name?: string;
    source?: string;
  }
): boolean {
  try {
    // Require a station ID
    if (!stationId) {
      return false;
    }
    
    // Get or create station
    let station = stations.get(stationId);
    
    if (!station && metadata?.latitude && metadata?.longitude) {
      // Create new station
      station = {
        id: stationId,
        name: metadata.name,
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        observations: [],
        lastUpdated: Date.now()
      };
      
      stations.set(stationId, station);
    } else if (!station) {
      // No existing station and insufficient info to create one
      return false;
    }
    
    // Create observation
    const observation: ClearSkyObservation = {
      latitude: station.latitude,
      longitude: station.longitude,
      clearSkyRate,
      timestamp: Date.now(),
      source: metadata?.source || 'station'
    };
    
    // Add to station and overall observations
    station.observations.push(observation);
    station.lastUpdated = Date.now();
    observations.push(observation);
    
    return true;
  } catch (error) {
    console.error("Error recording station data:", error);
    return false;
  }
}

/**
 * Record a user observation
 */
function recordUserObservation(
  latitude: number,
  longitude: number,
  clearSkyRate: number,
  userId: string,
  notes?: string
): boolean {
  try {
    // Validate inputs
    if (isNaN(latitude) || isNaN(longitude) || isNaN(clearSkyRate) || !userId) {
      return false;
    }
    
    // Create observation
    const observation: ClearSkyObservation = {
      latitude,
      longitude,
      clearSkyRate: Math.max(0, Math.min(100, clearSkyRate)),
      timestamp: Date.now(),
      userId,
      source: 'user',
      confidence: 0.8,
      notes
    };
    
    // Add to observations
    observations.push(observation);
    
    // Update station data
    const locationKey = getLocationKey(latitude, longitude);
    
    if (!stations.has(locationKey)) {
      stations.set(locationKey, {
        id: locationKey,
        latitude,
        longitude,
        observations: [observation],
        lastUpdated: Date.now()
      });
    } else {
      const station = stations.get(locationKey)!;
      station.observations.push(observation);
      station.lastUpdated = Date.now();
    }
    
    return true;
  } catch (error) {
    console.error("Error recording user observation:", error);
    return false;
  }
}

/**
 * Clear all observations
 */
function clearObservations(): void {
  observations.length = 0;
  stations.clear();
}

/**
 * Clear all data for a specific user
 */
function clearAllData(): void {
  observations.length = 0;
  stations.clear();
}

/**
 * Export collected data for analysis
 */
function exportCollectedData(): {
  observations: ClearSkyObservation[];
  stations: ClearSkyStation[];
} {
  return {
    observations: [...observations],
    stations: Array.from(stations.values())
  };
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Export the service
export const clearSkyDataCollector = {
  addObservation,
  calculateClearSkyRate,
  getUserObservations,
  clearObservations,
  getObservationsForLocation,
  recordStationData,
  recordUserObservation,
  exportCollectedData,
  clearAllData
};
