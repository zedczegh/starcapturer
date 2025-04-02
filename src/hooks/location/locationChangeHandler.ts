
import { NavigateFunction } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { calculateMoonPhase } from "@/utils/siqsValidation";
import { publishLocationUpdate } from "@/services/locationSyncService";

/**
 * Handle location change with proper ID generation and navigation
 */
export const handleLocationChange = (
  location: { 
    name: string; 
    latitude: number; 
    longitude: number;
    bortleScale?: number;
    weatherData?: any;
  },
  navigate: NavigateFunction,
  additionalProps: Record<string, any> = {}
) => {
  try {
    // Generate a unique ID for this location
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Calculate moon phase
    const moonPhase = calculateMoonPhase();
    
    // Prepare the location data
    const locationData = {
      id,
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortleScale || null,
      weatherData: location.weatherData || null,
      timestamp,
      moonPhase,
      ...additionalProps
    };
    
    // Publish location update for sync
    publishLocationUpdate({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp,
      source: 'location_change'
    });
    
    // Navigate to the location details page
    navigate(`/location/${id}`, {
      state: { locationData },
      replace: true
    });
    
    return id;
  } catch (error) {
    console.error("Error handling location change:", error);
    throw error;
  }
};
