
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { updateLocationName } from "@/lib/locationNameUpdater";
import { identifyRemoteRegion } from "@/services/geocoding/remoteRegionResolver";

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastProcessedKey, setLastProcessedKey] = useState<string | null>(null);

  // Update location name when language changes
  useEffect(() => {
    if (!locationData || !locationData.latitude || !locationData.longitude || isUpdating) return;
    
    // Skip if we're on the initial render or location data isn't ready
    if (!locationData.name) return;
    
    // Create a unique key for this location and language combination
    const locationKey = `${locationData.latitude.toFixed(4)}-${locationData.longitude.toFixed(4)}-${language}`;
    
    // Skip if we already processed this exact combination
    if (locationKey === lastProcessedKey) return;
    
    // Check if we're in a remote region that needs special handling
    const isRemoteRegion = identifyRemoteRegion(locationData.latitude, locationData.longitude);
    
    // Skip translation for special locations like Beijing
    if (locationData.name === "北京" || locationData.name === "Beijing") {
      setLastProcessedKey(locationKey);
      return;
    }
    
    // For remote regions, always update the name to ensure accuracy
    const updateNameForLanguage = async () => {
      try {
        setIsUpdating(true);
        
        // Priority update for remote regions to ensure proper naming
        if (isRemoteRegion) {
          console.log("Remote region detected, updating name with high priority");
        }
        
        const newName = await updateLocationName(
          locationData.latitude,
          locationData.longitude,
          locationData.name,
          language === 'zh' ? 'zh' : 'en',
          { setCachedData, getCachedData }
        );
        
        if (newName && newName !== locationData.name) {
          console.log(`Location name updated: "${locationData.name}" -> "${newName}"`);
          setLocationData({
            ...locationData,
            name: newName
          });
        }
        
        // Mark this combination as processed
        setLastProcessedKey(locationKey);
      } catch (error) {
        console.error("Error updating location name for language change:", error);
      } finally {
        setIsUpdating(false);
      }
    };
    
    // Run the update with priority for remote regions
    updateNameForLanguage();
  }, [language, locationData, setLocationData, setCachedData, getCachedData, isUpdating, lastProcessedKey]);

  return null;
}
