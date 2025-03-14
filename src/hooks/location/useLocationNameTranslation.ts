
import { useEffect } from "react";
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
  
  // Update location name when language changes
  useEffect(() => {
    const updateLocationNameForLanguage = async () => {
      if (!locationData || !locationData.latitude || !locationData.longitude) return;
      
      try {
        const newName = await getLocationNameForCoordinates(
          locationData.latitude, 
          locationData.longitude, 
          language as Language, 
          { setCachedData, getCachedData }
        );
        
        if (newName !== locationData.name) {
          setLocationData(prevData => {
            if (!prevData) return null;
            return {
              ...prevData,
              name: newName
            };
          });
        }
      } catch (error) {
        console.error("Error updating location name for language change:", error);
      }
    };
    
    if (locationData) {
      updateLocationNameForLanguage();
    }
  }, [language, locationData, setLocationData, setCachedData, getCachedData]);
};
