
/**
 * Clear Sky Data Collector Service
 * 
 * Collects and processes user-contributed data about clear sky conditions
 */

import { getLocationKey } from '@/utils/locationUtils';

// Define the structure of a user observation
interface ClearSkyObservation {
  latitude: number;
  longitude: number;
  clearSkyRate: number;
  observationDate: string;
  reliability: number; // 0-1 scale 
  userId?: string;
  cloudCover?: number;
  visibility?: number;
  isStationData?: boolean;
  timestamp?: string;
}

// In-memory storage for observations
const observations: ClearSkyObservation[] = [];

// Calculate the distance between two coordinates in km
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// Exported service for clear sky data collection
export const clearSkyDataCollector = {
  // Add a new observation
  addObservation: (
    latitude: number,
    longitude: number,
    clearSkyRate: number,
    userId?: string
  ): boolean => {
    // Validate inputs
    if (
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180 ||
      clearSkyRate < 0 || clearSkyRate > 100
    ) {
      console.error("Invalid observation data");
      return false;
    }
    
    // Create observation
    const observation: ClearSkyObservation = {
      latitude,
      longitude,
      clearSkyRate,
      observationDate: new Date().toISOString(),
      reliability: userId ? 0.9 : 0.6, // Higher reliability for logged-in users
      userId
    };
    
    // Store observation
    observations.push(observation);
    console.log(`Added clear sky observation: ${clearSkyRate}% at ${latitude}, ${longitude}`);
    
    return true;
  },
  
  // Calculate clear sky rate for a location based on nearby observations
  calculateClearSkyRate: (
    latitude: number, 
    longitude: number, 
    radiusKm: number = 20
  ): { rate: number; confidence: number; observations: number } | null => {
    // Find relevant observations
    const relevantObs = observations.filter(obs => 
      calculateDistance(latitude, longitude, obs.latitude, obs.longitude) <= radiusKm
    );
    
    if (relevantObs.length === 0) {
      return null;
    }
    
    // Calculate weighted average
    let totalWeight = 0;
    let weightedSum = 0;
    
    relevantObs.forEach(obs => {
      const distance = calculateDistance(latitude, longitude, obs.latitude, obs.longitude);
      const ageInDays = (Date.now() - new Date(obs.observationDate).getTime()) / (1000 * 60 * 60 * 24);
      
      // Weight by distance, age and reliability
      const distanceWeight = Math.max(0, 1 - distance/radiusKm);
      const ageWeight = Math.max(0.1, 1 - (ageInDays / 90)); // Reduce weight as observation ages
      
      const weight = distanceWeight * ageWeight * obs.reliability;
      
      totalWeight += weight;
      weightedSum += obs.clearSkyRate * weight;
    });
    
    if (totalWeight === 0) {
      return null;
    }
    
    const rate = weightedSum / totalWeight;
    
    // Calculate confidence based on number of observations and their distribution
    const confidence = Math.min(
      0.95, 
      0.4 + (0.05 * Math.min(10, relevantObs.length))
    );
    
    return {
      rate,
      confidence,
      observations: relevantObs.length
    };
  },
  
  // Get all observations for a specific user
  getUserObservations: (userId: string): ClearSkyObservation[] => {
    return observations.filter(obs => obs.userId === userId);
  },
  
  // For testing: clear all observations
  clearObservations: (): void => {
    observations.length = 0;
  },

  // Add station data (automated weather station observations)
  recordStationData: (
    latitude: number,
    longitude: number,
    cloudCover: number,
    visibility: number
  ): boolean => {
    // Convert cloud cover to clear sky rate (inverse relationship)
    const clearSkyRate = Math.max(0, Math.min(100, 100 - cloudCover));
    
    // Create observation with station data fields
    const observation: ClearSkyObservation = {
      latitude,
      longitude,
      clearSkyRate,
      cloudCover,
      visibility,
      observationDate: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      reliability: 0.85, // Slightly less reliable than user data but more than anonymous
      isStationData: true
    };
    
    // Store observation
    observations.push(observation);
    console.log(`Added station data observation: ${clearSkyRate}% at ${latitude}, ${longitude}`);
    
    return true;
  },
  
  // Add manual user observation with cloud cover and visibility
  recordUserObservation: (
    latitude: number,
    longitude: number,
    cloudCover: number,
    visibility: number,
    userId?: string
  ): boolean => {
    // Convert cloud cover to clear sky rate (inverse relationship)
    const clearSkyRate = Math.max(0, Math.min(100, 100 - (cloudCover * 0.9)));
    
    // Create observation
    const observation: ClearSkyObservation = {
      latitude,
      longitude,
      clearSkyRate,
      cloudCover,
      visibility,
      observationDate: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      reliability: userId ? 0.95 : 0.75, // Higher reliability for logged-in users
      userId
    };
    
    // Store observation
    observations.push(observation);
    console.log(`Added user observation: ${clearSkyRate}% at ${latitude}, ${longitude}`);
    
    return true;
  },

  // Get observations for a specific location
  getObservationsForLocation: (
    latitude: number,
    longitude: number,
    limit: number = 10
  ): ClearSkyObservation[] => {
    // Find observations within a reasonable distance
    const radiusKm = 10; // 10km radius
    
    const nearbyObservations = observations.filter(obs => 
      calculateDistance(latitude, longitude, obs.latitude, obs.longitude) <= radiusKm
    );
    
    // Sort by date, newest first
    const sortedObservations = [...nearbyObservations].sort((a, b) => 
      new Date(b.observationDate).getTime() - new Date(a.observationDate).getTime()
    );
    
    return sortedObservations.slice(0, limit);
  },
  
  // Export collected data for backup or analysis
  exportCollectedData: (): string => {
    return JSON.stringify(observations);
  },
  
  // Clear all stored data
  clearAllData: (): void => {
    observations.length = 0;
    console.log("All observation data cleared");
  }
};
