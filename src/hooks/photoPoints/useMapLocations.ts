/**
 * Hook for managing map locations
 */
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/locationWaterCheck';
import { isCertifiedLocation } from '@/services/certifiedLocationsService';

// Common types for map locations
export interface MapLocationCategories {
  certified: SharedAstroSpot[];
  calculated: SharedAstroSpot[];
}

/**
 * Filter out water locations
 */
export const filterWaterLocations = (locations: SharedAstroSpot[]): SharedAstroSpot[] => {
  if (!locations) return [];
  
  return locations.filter(location => {
    // Always keep certified locations
    if (isCertifiedLocation(location)) return true;
    
    // Filter out water locations
    return !isWaterLocation(location.latitude, location.longitude);
  });
};

/**
 * Separate locations into categories
 */
export const separateLocationTypes = (locations: SharedAstroSpot[]): MapLocationCategories => {
  const certified: SharedAstroSpot[] = [];
  const calculated: SharedAstroSpot[] = [];
  
  if (!locations) return { certified, calculated };
  
  locations.forEach(location => {
    if (isCertifiedLocation(location)) {
      certified.push(location);
    } else {
      calculated.push(location);
    }
  });
  
  return { certified, calculated };
};

/**
 * Merge different location arrays
 */
export const mergeLocations = (...locationArrays: SharedAstroSpot[][]): SharedAstroSpot[] => {
  // Create a map to track unique locations by ID
  const locationMap = new Map<string, SharedAstroSpot>();
  
  // Process all location arrays
  locationArrays.forEach(locations => {
    if (!locations) return;
    
    locations.forEach(location => {
      const key = location.id || `${location.latitude}-${location.longitude}`;
      
      // Only add if we don't already have this location
      // or if the existing one doesn't have SIQS but the new one does
      const existing = locationMap.get(key);
      
      if (!existing || 
          (!existing.siqs && location.siqs) || 
          (existing.siqs && location.siqs && 
           typeof existing.siqs === 'object' && 
           typeof location.siqs === 'object' &&
           existing.siqs.score < location.siqs.score)) {
        locationMap.set(key, location);
      }
    });
  });
  
  // Convert map back to array
  return Array.from(locationMap.values());
};

/**
 * Hook for managing map locations
 */
export function useMapLocations(initialLocations: SharedAstroSpot[] = []) {
  const [allLocations, setAllLocations] = useState<SharedAstroSpot[]>(initialLocations);
  const [filteredLocations, setFilteredLocations] = useState<SharedAstroSpot[]>([]);
  const [locationCategories, setLocationCategories] = useState<MapLocationCategories>({
    certified: [],
    calculated: []
  });
  
  // Update filtered locations whenever all locations change
  useEffect(() => {
    // Filter water locations
    const filtered = filterWaterLocations(allLocations);
    setFilteredLocations(filtered);
    
    // Separate into categories
    const categories = separateLocationTypes(filtered);
    setLocationCategories(categories);
  }, [allLocations]);
  
  // Add locations, avoiding duplicates
  const addLocations = useCallback((newLocations: SharedAstroSpot[]) => {
    setAllLocations(prevLocations => mergeLocations(prevLocations, newLocations));
  }, []);
  
  return {
    allLocations,
    filteredLocations,
    locationCategories,
    setAllLocations,
    addLocations
  };
}
