import { useState, useCallback, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/mapUtils';

interface UsePhotoPointsMapProps {
  locations: SharedAstroSpot[];
  userLocation: { latitude: number; longitude: number } | null;
  currentSiqs: number | null;
}

/**
 * Custom hook for managing PhotoPoints map functionality
 */
export const usePhotoPointsMap = ({
  locations,
  userLocation,
  currentSiqs
}: UsePhotoPointsMapProps) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Calculate map center position - prioritize user location
  const mapPosition = useMemo(() => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude] as [number, number];
    }
    
    // If no user location but we have locations, center on the first one
    if (locations.length > 0) {
      return [locations[0].latitude, locations[0].longitude] as [number, number];
    }
    
    // Default position if no user location or locations
    return [39.9, 116.3] as [number, number];
  }, [userLocation, locations]);

  // Calculate initial zoom level based on search radius
  const getInitialZoom = useCallback((radius: number) => {
    if (radius <= 100) return 10;  
    if (radius <= 200) return 9;
    if (radius <= 500) return 7;
    if (radius <= 1000) return 6;
    return 5;  // Default for larger areas
  }, []);

  // Locations with calculated distances
  const locationsWithDistance = useMemo(() => {
    if (!userLocation) return locations;
    
    return locations.map(location => {
      // If distance is already calculated and seems valid, keep it
      if (location.distance !== undefined && location.distance > 0) return location;
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude
      );
      
      return {
        ...location,
        distance
      };
    });
  }, [locations, userLocation]);

  // Filter locations to show better viewing spots
  const filteredLocations = useMemo(() => {
    if (!currentSiqs) return locationsWithDistance;
    
    // Include all certified locations and calculated locations with higher SIQS
    return locationsWithDistance.filter(loc => 
      loc.isDarkSkyReserve || 
      loc.certification || 
      (loc.siqs && loc.siqs > currentSiqs)
    );
  }, [locationsWithDistance, currentSiqs]);

  // Handle map ready event
  const handleMapReady = useCallback(() => {
    setMapLoaded(true);
  }, []);

  // Handle location selection
  const handleLocationSelect = useCallback((location: SharedAstroSpot) => {
    setSelectedLocationId(location.id || `loc-${location.latitude}-${location.longitude}`);
    return location;
  }, []);

  return {
    mapLoaded,
    selectedLocationId,
    mapPosition,
    getInitialZoom,
    filteredLocations,
    handleMapReady,
    handleLocationSelect
  };
};
