import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService/locationUpdateService';

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
  const [enhancedLocations, setEnhancedLocations] = useState<SharedAstroSpot[]>([]);
  const previousLocationRef = useRef<{latitude: number, longitude: number} | null>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userLocation) return;
    
    if (
      previousLocationRef.current &&
      Math.abs(previousLocationRef.current.latitude - userLocation.latitude) < 0.01 &&
      Math.abs(previousLocationRef.current.longitude - userLocation.longitude) < 0.01
    ) {
      return;
    }
    
    previousLocationRef.current = userLocation;
    
  }, [userLocation]);

  const validLocations = locations.filter(location => 
    location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number'
  );

  const locationsToDisplay = enhancedLocations.length > 0 ? enhancedLocations : validLocations;
  
  useEffect(() => {
    if (!mapReady || !userLocation || !validLocations.length) return;
    
    const updateLocations = async () => {
      try {
        const type = validLocations.some(loc => loc.isDarkSkyReserve || loc.certification) ? 
          'certified' : 'calculated';
          
        const updated = await updateLocationsWithRealTimeSiqs(
          validLocations, 
          userLocation, 
          searchRadius,
          type
        );
        
        if (updated && updated.length > 0) {
          setEnhancedLocations(updated);
        }
      } catch (error) {
        console.error('Error updating locations with real-time SIQS:', error);
      }
    };
    
    updateLocations();
  }, [validLocations, userLocation, mapReady, searchRadius]);

  const mapCenter: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : locationsToDisplay.length > 0
      ? [locationsToDisplay[0].latitude, locationsToDisplay[0].longitude]
      : [39.9042, 116.4074];

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    setSelectedLocation(location);
    
    const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
    
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

  const getZoomLevel = useCallback((radius: number) => {
    if (radius <= 50) return 10;
    if (radius <= 100) return 9;
    if (radius <= 200) return 8;
    if (radius <= 500) return 7;
    if (radius <= 1000) return 6;
    if (radius <= 5000) return 4;
    return 3;
  }, []);

  const initialZoom = getZoomLevel(searchRadius);

  return {
    mapReady,
    handleMapReady,
    selectedLocation,
    handleLocationClick,
    validLocations: locationsToDisplay,
    mapCenter,
    initialZoom
  };
};
