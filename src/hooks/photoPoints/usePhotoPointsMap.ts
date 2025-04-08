
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService/locationUpdateService';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/locationValidator';

interface UsePhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
}

export const usePhotoPointsMap = ({
  userLocation,
  locations,
  searchRadius,
  activeView
}: UsePhotoPointsMapProps) => {
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SharedAstroSpot | null>(null);
  const [enhancedLocations, setEnhancedLocations] = useState<SharedAstroSpot[]>([]);
  const previousLocationRef = useRef<{latitude: number, longitude: number} | null>(null);
  const previousRadiusRef = useRef<number>(0);
  const previousLocationsRef = useRef<SharedAstroSpot[]>([]);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userLocation) return;
    
    if (
      previousLocationRef.current &&
      Math.abs(previousLocationRef.current.latitude - userLocation.latitude) < 0.01 &&
      Math.abs(previousLocationRef.current.longitude - userLocation.longitude) < 0.01 &&
      previousRadiusRef.current === searchRadius
    ) {
      return;
    }
    
    previousLocationRef.current = userLocation;
    previousRadiusRef.current = searchRadius;
    
    if (!previousLocationRef.current || 
        Math.abs(previousLocationRef.current.latitude - userLocation.latitude) > 0.1 ||
        Math.abs(previousLocationRef.current.longitude - userLocation.longitude) > 0.1) {
      previousLocationsRef.current = [];
    }
  }, [userLocation, searchRadius]);

  const validLocations = locations.filter(location => 
    location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number' &&
    // Filter out water locations for calculated spots, never filter certified
    (location.isDarkSkyReserve || 
     location.certification || 
     !isWaterLocation(location.latitude, location.longitude, false))
  );

  const certifiedLocations = validLocations.filter(location => 
    location.isDarkSkyReserve === true || 
    (location.certification && location.certification !== '')
  );
  
  const calculatedLocations = validLocations.filter(location => 
    !(location.isDarkSkyReserve === true || 
    (location.certification && location.certification !== ''))
  );

  const locationMap = new Map<string, SharedAstroSpot>();
  
  // Always include all certified locations regardless of active view
  certifiedLocations.forEach(loc => {
    const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
    locationMap.set(key, loc);
  });
  
  if (activeView === 'calculated') {
    previousLocationsRef.current.forEach(loc => {
      if (!loc.isDarkSkyReserve && !loc.certification) {
        // Don't add water locations
        if (!isWaterLocation(loc.latitude, loc.longitude)) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        }
      }
    });
    
    calculatedLocations.forEach(loc => {
      // Skip water locations for calculated spots
      if (!isWaterLocation(loc.latitude, loc.longitude)) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        const existing = locationMap.get(key);
        if (!existing || (loc.siqs && (!existing.siqs || loc.siqs > existing.siqs))) {
          locationMap.set(key, loc);
        }
      }
    });
  }
  
  const mergedLocations = Array.from(locationMap.values());
  
  if (activeView === 'calculated') {
    previousLocationsRef.current = mergedLocations.filter(
      loc => !loc.isDarkSkyReserve && !loc.certification
    );
  }
  
  const locationsToDisplay = enhancedLocations.length > 0 ? enhancedLocations : mergedLocations;
  
  useEffect(() => {
    if (!mapReady || !userLocation || !validLocations.length) return;
    
    const updateLocations = async () => {
      try {
        const type = activeView;
          
        const locationsInRadius = type === 'calculated' && userLocation ? 
          calculatedLocations.filter(loc => {
            if (!loc.latitude || !loc.longitude) return false;
            
            // Skip water locations for calculated spots
            if (!loc.isDarkSkyReserve && !loc.certification) {
              if (isWaterLocation(loc.latitude, loc.longitude)) {
                return false;
              }
            }
            
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              loc.latitude,
              loc.longitude
            );
            return distance <= searchRadius * 1.1;
          }) : 
          // For certified view, include ALL certified locations regardless of distance
          certifiedLocations;
        
        const updated = await updateLocationsWithRealTimeSiqs(
          locationsInRadius, 
          userLocation, 
          searchRadius,
          type
        );
        
        if (updated && updated.length > 0) {
          setEnhancedLocations(prevLocations => {
            const updatedMap = new Map<string, SharedAstroSpot>();
            
            // Always include all certified locations
            certifiedLocations.forEach(loc => {
              if (loc.latitude && loc.longitude) {
                const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
                updatedMap.set(key, loc);
              }
            });
            
            updated.forEach(loc => {
              if (loc.latitude && loc.longitude) {
                // Skip water locations for calculated spots
                if (!loc.isDarkSkyReserve && !loc.certification && 
                    isWaterLocation(loc.latitude, loc.longitude)) {
                  return;
                }
                
                const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
                updatedMap.set(key, loc);
              }
            });
            
            const combinedLocations = [...prevLocations];
            
            updated.forEach(newLoc => {
              if (!newLoc.latitude || !newLoc.longitude) return;
              
              // Skip water locations for calculated spots
              if (!newLoc.isDarkSkyReserve && !newLoc.certification && 
                  isWaterLocation(newLoc.latitude, newLoc.longitude)) {
                return;
              }
              
              const key = `${newLoc.latitude.toFixed(6)}-${newLoc.longitude.toFixed(6)}`;
              const exists = combinedLocations.some(
                existingLoc => existingLoc.latitude && existingLoc.longitude && 
                `${existingLoc.latitude.toFixed(6)}-${existingLoc.longitude.toFixed(6)}` === key
              );
              
              if (!exists) {
                combinedLocations.push(newLoc);
              } else {
                const index = combinedLocations.findIndex(
                  existingLoc => existingLoc.latitude && existingLoc.longitude &&
                  `${existingLoc.latitude.toFixed(6)}-${existingLoc.longitude.toFixed(6)}` === key
                );
                if (index !== -1) {
                  combinedLocations[index] = newLoc;
                }
              }
            });
            
            return combinedLocations;
          });
        }
      } catch (error) {
        console.error('Error updating locations with real-time SIQS:', error);
      }
    };
    
    const timeoutId = setTimeout(() => {
      updateLocations();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [validLocations, userLocation, mapReady, searchRadius, activeView, certifiedLocations, calculatedLocations]);

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
