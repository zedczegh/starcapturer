
import { useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import type { Language } from "@/services/geocoding/types";

interface UseLocationNameTranslationProps {
  locationData: any;
  setLocationData: (data: any) => void;
  setCachedData: (key: string, data: any) => void;
  getCachedData: (key: string) => any;
}

export const useLocationNameTranslation = ({
  locationData,
  setLocationData,
  setCachedData,
  getCachedData
}: UseLocationNameTranslationProps) => {
  const { language } = useLanguage();
  const lastTranslationRef = useRef<{
    language: string;
    coords: string;
    name: string;
  } | null>(null);
  
  // Memoize the update function to prevent recreation on each render
  const updateLocationNameForLanguage = useCallback(async () => {
    if (!locationData || !locationData.latitude || !locationData.longitude) return;
    
    // Skip translation for explicitly named locations like Beijing
    if (locationData.name === "北京" || locationData.name === "Beijing") return;
    
    const coordsKey = `${locationData.latitude.toFixed(4)}-${locationData.longitude.toFixed(4)}`;
    
    // Skip if we already translated for this language and coordinates recently
    if (lastTranslationRef.current && 
        lastTranslationRef.current.language === language &&
        lastTranslationRef.current.coords === coordsKey &&
        lastTranslationRef.current.name === locationData.name) {
      return;
    }
    
    try {
      const newName = await getLocationNameForCoordinates(
        locationData.latitude, 
        locationData.longitude, 
        language as Language, 
        { setCachedData, getCachedData }
      );
      
      if (newName && newName !== locationData.name) {
        setLocationData(prevData => {
          if (!prevData) return null;
          return {
            ...prevData,
            name: newName
          };
        });
        
        // Also update the cache with the new name
        const cacheKey = `loc-${locationData.latitude.toFixed(4)}-${locationData.longitude.toFixed(4)}`;
        const existingData = getCachedData(cacheKey) || {};
        
        setCachedData(cacheKey, { 
          ...existingData,
          name: newName,
          ...(language === 'en' ? { nameInEnglish: newName } : { nameInChinese: newName }),
          timestamp: Date.now()
        });
        
        // Update our reference to prevent duplicate work
        lastTranslationRef.current = {
          language,
          coords: coordsKey,
          name: newName
        };
      }
    } catch (error) {
      console.error("Error updating location name for language change:", error);
    }
  }, [language, locationData, setLocationData, setCachedData, getCachedData]);
  
  // Update location name when language changes
  useEffect(() => {
    if (locationData) {
      updateLocationNameForLanguage();
    }
  }, [language, updateLocationNameForLanguage]);
};
