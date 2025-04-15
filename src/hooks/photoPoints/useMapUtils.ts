
import { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export const useMapUtils = () => {
  const { t } = useLanguage();

  /**
   * Get appropriate zoom level for a search radius
   */
  const getZoomLevel = useCallback((radius: number): number => {
    // Formula to convert radius in km to zoom level
    if (radius <= 10) return 11;
    if (radius <= 50) return 9;
    if (radius <= 100) return 8;
    if (radius <= 200) return 7;
    if (radius <= 500) return 6;
    if (radius <= 1000) return 5;
    return 4; // For very large radius
  }, []);

  /**
   * Handle location click on the map
   */
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (!location) return;
    
    try {
      // Show location details in a toast
      toast.success(
        t(
          `Selected location: ${location.name || 'Unnamed location'}`,
          `已选择位置: ${location.name || '未命名地点'}`
        ),
        {
          description: location.siqs 
            ? t(
                `SIQS Score: ${location.siqs.toFixed(1)}`,
                `SIQS 评分: ${location.siqs.toFixed(1)}`
              )
            : undefined,
          duration: 3000
        }
      );
      
      console.log('Selected location:', location);
    } catch (error) {
      console.error('Error handling location click:', error);
    }
  }, [t]);

  return {
    getZoomLevel,
    handleLocationClick
  };
};

export default useMapUtils;
