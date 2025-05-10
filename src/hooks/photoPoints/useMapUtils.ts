
import { useState, useCallback, useMemo, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';

interface UseMapLocationsProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  mapReady: boolean;
}

export function useMapLocations({
  userLocation,
  locations,
  searchRadius,
  activeView,
  mapReady
}: UseMapLocationsProps) {
  // Process and filter locations based on view and distance
  const processedLocations = useMemo(() => {
    if (!Array.isArray(locations)) {
      return [];
    }
    
    // Filter out invalid locations
    const validLocations = locations.filter(
      loc => loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number'
    );
    
    // For certified view, show all certified locations without distance filtering
    if (activeView === 'certified') {
      return validLocations;
    }
    
    // For calculated view with user location, apply distance filtering
    if (activeView === 'calculated' && userLocation) {
      return validLocations.map(loc => {
        // Calculate distance
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          loc.latitude,
          loc.longitude
        );
        
        return {
          ...loc,
          distance
        };
      }).filter(loc => {
        // Apply search radius filter
        return loc.distance <= searchRadius;
      }).sort((a, b) => {
        // Sort by distance
        return (a.distance || 0) - (b.distance || 0);
      });
    }
    
    return validLocations;
  }, [locations, userLocation, activeView, searchRadius]);
  
  return {
    processedLocations
  };
}

export function useMapUtils() {
  // Get appropriate zoom level based on search radius
  const getZoomLevel = useCallback((radius: number): number => {
    if (radius <= 100) return 12;
    if (radius <= 300) return 10;
    if (radius <= 500) return 8;
    if (radius <= 800) return 7;
    return 6;
  }, []);
  
  // Handle location click
  const handleLocationClick = useCallback((location: SharedAstroSpot, onClick?: (loc: SharedAstroSpot) => void) => {
    if (onClick && location) {
      onClick(location);
    }
  }, []);
  
  return {
    getZoomLevel,
    handleLocationClick
  };
}
