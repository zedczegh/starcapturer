
import { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/locationValidator';
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';

// Hook for handling location loading and filtering services
export const useRecommendedLocationServices = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Filter out invalid locations and water spots
  const filterValidLocations = useCallback((locations: SharedAstroSpot[]): SharedAstroSpot[] => {
    return locations.filter(location => 
      location && 
      typeof location.latitude === 'number' && 
      typeof location.longitude === 'number' &&
      // Filter out water locations for calculated spots, never filter certified
      (location.isDarkSkyReserve || 
       location.certification || 
       !isWaterLocation(location.latitude, location.longitude, false))
    );
  }, []);
  
  // Extract certified and calculated locations
  const separateLocationTypes = useCallback((locations: SharedAstroSpot[]) => {
    const certifiedLocations = locations.filter(location => 
      location.isDarkSkyReserve === true || 
      (location.certification && location.certification !== '')
    );
    
    const calculatedLocations = locations.filter(location => 
      !(location.isDarkSkyReserve === true || 
      (location.certification && location.certification !== ''))
    );

    return { certifiedLocations, calculatedLocations };
  }, []);
  
  // Filter locations by distance
  const filterByDistance = useCallback((
    locations: SharedAstroSpot[],
    userLocation: { latitude: number; longitude: number } | null,
    radius: number
  ) => {
    if (!userLocation) return locations;
    
    return locations.filter(loc => {
      const distance = loc.distance || calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        loc.latitude,
        loc.longitude
      );
      
      return distance <= radius;
    });
  }, []);
  
  // Display error toast
  const showErrorToast = useCallback((title: string, description?: string) => {
    toast({
      variant: "destructive",
      title: t(title, title === "Failed to load recommended locations" ? "加载推荐位置失败" : title),
      description: description ? t(description, "请重试。") : undefined
    });
  }, [toast, t]);

  return {
    filterValidLocations,
    separateLocationTypes,
    filterByDistance,
    showErrorToast
  };
};
