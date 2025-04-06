
import { useState, useCallback, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface UsePhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
}

export const usePhotoPointsMap = ({
  userLocation,
  locations,
  searchRadius
}: UsePhotoPointsMapProps) => {
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SharedAstroSpot | null>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Filter valid locations
  const validLocations = locations.filter(location => 
    location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number'
  );

  // Get the map center coordinates - prioritize user location
  const mapCenter: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : validLocations.length > 0
      ? [validLocations[0].latitude, validLocations[0].longitude]
      : [39.9042, 116.4074]; // Default center (Beijing)

  // Handle map ready event
  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  // Handle location selection
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    setSelectedLocation(location);
    
    const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
    
    // Navigate to location details page
    if (location && location.latitude && location.longitude) {
      navigate(`/location/${locationId}`, { 
        state: {
          id: locationId,
          name: location.name,
          chineseName: location.chineseName,
          latitude: location.latitude,
          longitude: location.longitude,
          bortleScale: location.bortleScale || 4,
          siqs: location.siqs,
          siqsResult: location.siqs ? { score: location.siqs } : undefined,
          certification: location.certification,
          isDarkSkyReserve: location.isDarkSkyReserve,
          timestamp: new Date().toISOString(),
          fromPhotoPoints: true
        } 
      });
      toast.info(t("Opening location details", "正在打开位置详情"));
    }
  }, [navigate, t]);

  // Calculate zoom level based on search radius
  const getZoomLevel = useCallback((radius: number) => {
    if (radius <= 50) return 10;
    if (radius <= 100) return 9;
    if (radius <= 200) return 8;
    if (radius <= 500) return 7;
    if (radius <= 1000) return 6;
    if (radius <= 5000) return 4;
    return 3;
  }, []);

  // Calculate appropriate initial zoom level
  const initialZoom = getZoomLevel(searchRadius);

  // Filter locations by type
  const certifiedLocations = useCallback(() => {
    return validLocations.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
  }, [validLocations]);

  const calculatedLocations = useCallback(() => {
    return validLocations.filter(loc => 
      !loc.isDarkSkyReserve && !loc.certification
    );
  }, [validLocations]);

  return {
    mapReady,
    handleMapReady,
    selectedLocation,
    handleLocationClick,
    validLocations,
    mapCenter,
    initialZoom,
    certifiedLocations: certifiedLocations(),
    calculatedLocations: calculatedLocations()
  };
};
