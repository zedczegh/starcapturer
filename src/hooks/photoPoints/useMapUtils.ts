
import { useCallback, useEffect, useState } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/mapUtils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { isWaterLocation } from '@/utils/locationValidator';

/**
 * Process and filter map locations based on distance and active view
 */
export const useMapLocations = ({
  userLocation,
  locations,
  searchRadius,
  activeView,
  mapReady
}: {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  mapReady: boolean;
}) => {
  const [processedLocations, setProcessedLocations] = useState<SharedAstroSpot[]>([]);
  
  useEffect(() => {
    if (!locations.length) return;
    
    // For certified view, include all certified locations regardless of distance
    if (activeView === 'certified') {
      setProcessedLocations(locations.filter(loc => 
        loc.certification || loc.isDarkSkyReserve
      ));
      return;
    }
    
    // For calculated view, apply normal filtering
    const validLocations = locations.filter(location => {
      // Skip filtering for certified locations - always include them
      if (location.certification || location.isDarkSkyReserve) {
        return true;
      }
      
      // For calculated locations, filter out water locations
      if (isWaterLocation(location.latitude, location.longitude)) {
        return false;
      }
      
      // Apply distance filtering only to non-certified locations
      if (userLocation) {
        const distance = location.distance || calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          location.latitude,
          location.longitude
        );
        
        // Only include locations within search radius
        return distance <= searchRadius;
      }
      
      return true;
    });
    
    // Sort by certification status first, then by distance
    const sortedLocations = [...validLocations].sort((a, b) => {
      // Prioritize certified locations
      const aIsCertified = Boolean(a.isDarkSkyReserve || a.certification);
      const bIsCertified = Boolean(b.isDarkSkyReserve || b.certification);
      
      if (aIsCertified && !bIsCertified) return -1;
      if (!aIsCertified && bIsCertified) return 1;
      
      // Then sort by distance
      return (a.distance || Infinity) - (b.distance || Infinity);
    });
    
    setProcessedLocations(sortedLocations);
  }, [locations, userLocation, searchRadius, activeView, mapReady]);
  
  return { processedLocations };
};

/**
 * Hook to provide map utility functions
 */
export const useMapUtils = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  /**
   * Get appropriate zoom level based on search radius
   */
  const getZoomLevel = useCallback((radius: number) => {
    if (radius <= 50) return 10;
    if (radius <= 100) return 9;
    if (radius <= 200) return 8;
    if (radius <= 500) return 7;
    if (radius <= 1000) return 6;
    if (radius <= 5000) return 4;
    return 3;
  }, []);

  /**
   * Handle clicking on a location marker
   */
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
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

  return {
    getZoomLevel,
    handleLocationClick
  };
};
