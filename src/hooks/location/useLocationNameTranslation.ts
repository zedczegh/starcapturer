
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { updateLocationName } from "@/lib/locationNameUpdater";

interface UseLocationNameTranslationProps {
  locationData: any;
  setLocationData: (data: any) => void;
  setCachedData: (key: string, data: any) => void;
  getCachedData: (key: string) => any;
}

/**
 * Hook to handle location name translation based on language changes
 * Enhanced for better geocoding in remote regions
 */
export function useLocationNameTranslation({
  locationData,
  setLocationData,
  setCachedData,
  getCachedData
}: UseLocationNameTranslationProps) {
  const { language } = useLanguage();

  // Update location name when language changes
  useEffect(() => {
    if (!locationData || !locationData.latitude || !locationData.longitude) return;
    
    // Skip if we're on the initial render or location data isn't ready
    if (!locationData.name) return;
    
    // Use our optimized location name updater
    const updateNameForLanguage = async () => {
      try {
        const newName = await updateLocationName(
          locationData.latitude,
          locationData.longitude,
          locationData.name,
          language === 'zh' ? 'zh' : 'en',
          { setCachedData, getCachedData }
        );
        
        if (newName && newName !== locationData.name) {
          setLocationData({
            ...locationData,
            name: newName
          });
        }
      } catch (error) {
        console.error("Error updating location name for language change:", error);
      }
    };
    
    // Run the update, but only if the location name might need adjustment
    updateNameForLanguage();
  }, [language, locationData, setLocationData, setCachedData, getCachedData]);

  return null;
}
