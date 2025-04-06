
import { useState, useCallback } from 'react';
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

  // Get the map center coordinates
  const mapCenter: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : [39.9042, 116.4074]; // Default center (Beijing)

  // Handle map ready event
  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  // Handle location selection
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    setSelectedLocation(location);
    
    // Navigate to location details page
    if (location && location.latitude && location.longitude) {
      navigate(`/location/${location.id || 'custom'}`, { 
        state: location 
      });
      toast.info(t("Opening location details", "正在打开位置详情"));
    }
  }, [navigate, t]);

  // Calculate zoom level based on search radius
  const getZoomLevel = useCallback((radius: number) => {
    if (radius <= 200) return 9;
    if (radius <= 500) return 7;
    if (radius <= 1000) return 6;
    if (radius <= 5000) return 4;
    return 3;
  }, []);

  // Calculate appropriate initial zoom level
  const initialZoom = getZoomLevel(searchRadius);

  return {
    mapReady,
    handleMapReady,
    selectedLocation,
    handleLocationClick,
    validLocations,
    mapCenter,
    initialZoom
  };
};
