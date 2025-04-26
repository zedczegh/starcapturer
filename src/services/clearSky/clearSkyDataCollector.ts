/**
 * Clear Sky Data Collector Service
 * 
 * Collects user observations and official weather station data to improve
 * the accuracy of clear sky predictions globally.
 */
import { getLocationKey } from '@/utils/locationUtils';
import { getClimateAdjustmentFactor } from '@/services/realTimeSiqs/climateRegions';

interface ClearSkyObservation {
  latitude: number;
  longitude: number;
  timestamp: string;
  cloudCover: number;
  visibility: number;
  source: 'user' | 'station' | 'satellite';
  confidence: number;  // 0-1 scale
}

// In-memory cache for faster repeated access
const recentObservationsCache = new Map<string, ClearSkyObservation[]>();

export const clearSkyDataCollector = {
  /**
   * Store a new observation in the local storage and memory cache
   */
  storeObservation(observation: ClearSkyObservation): void {
    try {
      // Generate location key for storage
      const locationKey = getLocationKey(observation.latitude, observation.longitude, 0.1);
      
      // Store in local storage
      const storageKey = `clear-sky-observations`;
      const storedData = localStorage.getItem(storageKey);
      const observations = storedData ? JSON.parse(storedData) : {};
      
      // Initialize location array if needed
      if (!observations[locationKey]) {
        observations[locationKey] = [];
      }
      
      // Add new observation
      observations[locationKey].push(observation);
      
      // Limit storage size (keep last 30 days of observations per location)
      if (observations[locationKey].length > 30) {
        observations[locationKey] = observations[locationKey]
          .sort((a: ClearSkyObservation, b: ClearSkyObservation) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 30);
      }
      
      // Save back to storage
      localStorage.setItem(storageKey, JSON.stringify(observations));
      
      // Update in-memory cache
      if (!recentObservationsCache.has(locationKey)) {
        recentObservationsCache.set(locationKey, []);
      }
      recentObservationsCache.get(locationKey)?.push(observation);
      
      console.log(`Stored clear sky observation for ${locationKey}`);
      
    } catch (error) {
      console.error("Error storing clear sky observation:", error);
    }
  },

  /**
   * Record current conditions observation from user
   */
  recordUserObservation(
    latitude: number,
    longitude: number,
    cloudCover: number,
    visibility: number
  ): void {
    const observation: ClearSkyObservation = {
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
      cloudCover,  // 0-100 scale
      visibility,  // 0-100 scale 
      source: 'user',
      confidence: 0.85  // User reports are given high confidence
    };
    
    this.storeObservation(observation);
  },
  
  /**
   * Record station/API weather data
   */
  recordStationData(
    latitude: number,
    longitude: number,
    cloudCover: number,
    visibility: number
  ): void {
    const observation: ClearSkyObservation = {
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
      cloudCover,
      visibility,
      source: 'station',
      confidence: 0.95  // Station data is highly reliable
    };
    
    this.storeObservation(observation);
  },
  
  /**
   * Get stored observations for a location
   */
  getObservationsForLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): ClearSkyObservation[] {
    try {
      // First try in-memory cache
      const nearbyObservations: ClearSkyObservation[] = [];
      const targetKey = getLocationKey(latitude, longitude, 0.1);
      
      if (recentObservationsCache.has(targetKey)) {
        return recentObservationsCache.get(targetKey) || [];
      }
      
      // If not in cache, try local storage
      const storageKey = `clear-sky-observations`;
      const storedData = localStorage.getItem(storageKey);
      if (!storedData) return [];
      
      const observations = JSON.parse(storedData);
      
      // Find all observations within the radius
      Object.keys(observations).forEach(locationKey => {
        const [lat, lng] = locationKey.split('-').map(Number);
        const distance = this.calculateDistance(latitude, longitude, lat, lng);
        
        if (distance <= radiusKm) {
          nearbyObservations.push(...observations[locationKey]);
        }
      });
      
      return nearbyObservations;
    } catch (error) {
      console.error("Error retrieving clear sky observations:", error);
      return [];
    }
  },
  
  /**
   * Calculate distance between two points in kilometers using Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },
  
  /**
   * Convert degrees to radians
   */
  deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  },
  
  /**
   * Calculate average clear sky rate based on collected observations
   */
  calculateClearSkyRate(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): {rate: number, confidence: number} | null {
    const observations = this.getObservationsForLocation(latitude, longitude, radiusKm);
    if (observations.length === 0) return null;
    
    // Weight observations by recency and confidence
    let totalWeight = 0;
    let weightedSumClearSky = 0;
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    
    observations.forEach(obs => {
      // Calculate recency weight - observations within last day are weighted higher
      const obsDate = new Date(obs.timestamp).getTime();
      const ageInDays = (now - obsDate) / oneDay;
      const recencyWeight = Math.max(0.2, 1 - (ageInDays / 30)); // 0.2-1.0 range
      
      // Combine with confidence weight
      const totalObsWeight = recencyWeight * obs.confidence;
      
      // Convert cloud cover to clear sky rate (100 - cloudCover)
      const clearSkyRate = 100 - obs.cloudCover;
      
      weightedSumClearSky += clearSkyRate * totalObsWeight;
      totalWeight += totalObsWeight;
    });
    
    if (totalWeight === 0) return null;
    
    // Calculate weighted average
    const avgClearSkyRate = weightedSumClearSky / totalWeight;
    
    // Calculate confidence based on number of observations and their weights
    const confidence = Math.min(0.95, 0.5 + (observations.length / 20) * 0.4 + (totalWeight / observations.length) * 0.1);
    
    return {
      rate: Math.round(avgClearSkyRate),
      confidence
    };
  },
  
  /**
   * Export collected data for analysis
   */
  exportCollectedData(): string {
    try {
      const storageKey = `clear-sky-observations`;
      const storedData = localStorage.getItem(storageKey);
      if (!storedData) return JSON.stringify({});
      
      return storedData;
    } catch (error) {
      console.error("Error exporting clear sky data:", error);
      return "{}";
    }
  },
  
  /**
   * Clear all stored observations
   */
  clearAllData(): void {
    try {
      localStorage.removeItem('clear-sky-observations');
      recentObservationsCache.clear();
      console.log("All clear sky observations cleared");
    } catch (error) {
      console.error("Error clearing clear sky observations:", error);
    }
  }
};

export default clearSkyDataCollector;
