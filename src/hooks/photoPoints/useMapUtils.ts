
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

export const useMapUtils = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  /**
   * Get appropriate zoom level based on search radius
   * Provides more granular zoom levels with smoother transitions
   */
  const getZoomLevel = useCallback((radius: number) => {
    // More precise zoom calculations for better UX
    if (radius <= 10) return 12;  // Very close range
    if (radius <= 25) return 11;
    if (radius <= 50) return 10;
    if (radius <= 75) return 9.5;  // Support decimal zoom for smoother transitions
    if (radius <= 100) return 9;
    if (radius <= 150) return 8.5;
    if (radius <= 200) return 8;
    if (radius <= 300) return 7.5;
    if (radius <= 500) return 7;
    if (radius <= 750) return 6.5;
    if (radius <= 1000) return 6;
    if (radius <= 2500) return 5;
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
