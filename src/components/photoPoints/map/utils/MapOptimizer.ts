import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
// Fix the import from default export
import MarkerManager from "./markers/MarkerManager";

/**
 * Optimizes location data for map display, especially on mobile devices
 * Reduces the number of markers displayed to improve performance
 */
export const optimizeLocationsForMobile = (
  locations: SharedAstroSpot[],
  isMobile: boolean,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] => {
  if (!isMobile) {
    // No optimization needed for desktop
    return locations;
  }
  
  // For mobile, reduce the number of locations displayed
  const maxMarkers = activeView === 'certified' ? 50 : 25;
  
  if (locations.length <= maxMarkers) {
    // No optimization needed if the number of locations is already within the limit
    return locations;
  }
  
  // Sort locations by SIQS score (higher is better)
  const sortedLocations = [...locations].sort((a, b) => {
    const siqsA = typeof a.siqs === 'number' ? a.siqs : a.siqs?.score || 0;
    const siqsB = typeof b.siqs === 'number' ? b.siqs : b.siqs?.score || 0;
    return siqsB - siqsA;
  });
  
  // Take the top N locations
  const optimizedLocations = sortedLocations.slice(0, maxMarkers);
  
  console.log(`Optimized locations for mobile: reduced from ${locations.length} to ${optimizedLocations.length}`);
  
  return optimizedLocations;
};

/**
 * Filters locations based on user location and search radius
 */
export const filterLocations = (
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] => {
  if (!userLocation || activeView === 'certified') {
    // If no user location or in certified view, return all locations
    return locations;
  }
  
  // Filter locations within the search radius
  const filteredLocations = locations.filter(location => {
    if (!location.latitude || !location.longitude) return false;
    
    const distance = location.distance || calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      location.latitude,
      location.longitude
    );
    
    return distance <= searchRadius;
  });
  
  return filteredLocations;
};

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns Distance in kilometers
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
};

/**
 * Convert degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};
