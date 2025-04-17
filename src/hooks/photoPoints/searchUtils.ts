
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { haversineDistance } from '@/utils/haversine';
import { useState, useCallback } from 'react';
import { getSiqsScore, isSiqsGreaterThan } from '@/utils/siqsHelpers';

/**
 * Filter locations by search criteria
 */
export function filterLocations(
  locations: SharedAstroSpot[], 
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  minSiqsScore = 0
): SharedAstroSpot[] {
  if (!locations || locations.length === 0) return [];
  if (!userLocation) return locations;
  
  const { latitude, longitude } = userLocation;
  
  return locations.filter(location => {
    if (!location.latitude || !location.longitude) return false;
    
    // Calculate distance
    const distance = haversineDistance(
      latitude, 
      longitude, 
      location.latitude, 
      location.longitude
    );
    
    // Filter by distance
    const withinRadius = searchRadius <= 0 || distance <= searchRadius;
    
    // Filter by SIQS score
    const goodEnoughScore = minSiqsScore <= 0 || 
      (location.siqs !== undefined && isSiqsGreaterThan(location.siqs, minSiqsScore));
    
    // Add distance to location for later use
    if (withinRadius && goodEnoughScore) {
      location.distance = distance;
      return true;
    }
    
    return false;
  });
}

/**
 * Hook for filtering locations
 */
export function useLocationFiltering() {
  const [filteredLocations, setFilteredLocations] = useState<SharedAstroSpot[]>([]);
  
  const filterLocationsByDistance = useCallback((
    locations: SharedAstroSpot[],
    userLocation: { latitude: number; longitude: number } | null,
    searchRadius: number = 100,
    minSiqsScore: number = 0
  ): SharedAstroSpot[] => {
    const filtered = filterLocations(locations, userLocation, searchRadius, minSiqsScore);
    setFilteredLocations(filtered);
    return filtered;
  }, []);
  
  return {
    filteredLocations,
    filterLocationsByDistance
  };
}

/**
 * Sort locations by SIQS score
 */
export function sortLocationsBySiqs(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    const aScore = getSiqsScore(a.siqs);
    const bScore = getSiqsScore(b.siqs);
    return bScore - aScore;
  });
}

/**
 * Sort locations by distance
 */
export function sortLocationsByDistance(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    const aDistance = a.distance || Infinity;
    const bDistance = b.distance || Infinity;
    return aDistance - bDistance;
  });
}
