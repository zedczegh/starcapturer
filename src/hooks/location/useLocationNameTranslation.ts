
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { updateLocationName } from "@/lib/locationNameUpdater";
import { identifyRemoteRegion } from "@/services/geocoding/remoteRegionResolver";
import { getEnhancedLocationDetails } from "@/services/geocoding/enhancedReverseGeocoding";

interface UseLocationNameTranslationProps {
  locationData: any;
  setLocationData: (data: any) => void;
  setCachedData: (key: string, data: any) => void;
  getCachedData: (key: string) => any;
}

/**
 * Hook to handle location name translation based on language changes
 * Enhanced for better geocoding in remote regions and consistent detail level
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
  const initialRenderRef = useRef(true);
  const updateTimerRef = useRef<number | null>(null);

  // Update location name when language changes or on initial page load
  useEffect(() => {
    if (!locationData || !locationData.latitude || !locationData.longitude) return;
    
    // Skip if we're updating already
    if (isUpdating) return;
    
    // Skip if location data isn't ready
    if (!locationData.name) return;
    
    // Create a unique key for this location and language combination
    const locationKey = `${locationData.latitude.toFixed(4)}-${locationData.longitude.toFixed(4)}-${language}`;
    
    // Skip if we already processed this exact combination
    if (locationKey === lastProcessedKey && !initialRenderRef.current) return;
    
    // Skip translation for special locations like Beijing
    if (locationData.name === "北京" || locationData.name === "Beijing") {
      setLastProcessedKey(locationKey);
      initialRenderRef.current = false;
      return;
    }
    
    // Clear any existing timer
    if (updateTimerRef.current) {
      window.clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }
    
    // For initial load or language change, add a small delay to ensure component is mounted
    const delay = initialRenderRef.current ? 100 : 0;
    
    updateTimerRef.current = window.setTimeout(() => {
      // Always update the name to ensure detailed information in both languages
      const updateNameForLanguage = async () => {
        try {
          setIsUpdating(true);
          
          // Check if we're in a remote region that needs special handling
          const isRemoteRegion = identifyRemoteRegion(locationData.latitude, locationData.longitude);
          
          // For initial render, log this information
          if (initialRenderRef.current) {
            console.log("Initial render detected, updating location name for:", locationData.name);
          }
          
          // Always get enhanced location details for better language support
          const enhancedDetails = await getEnhancedLocationDetails(
            locationData.latitude,
            locationData.longitude,
            language === 'zh' ? 'zh' : 'en'
          );
          
          // Update the location data with enhanced details
          if (enhancedDetails) {
            // For Chinese language, update the Chinese name
            if (language === 'zh') {
              if (enhancedDetails.formattedName && enhancedDetails.formattedName !== '偏远地区') {
                console.log(`Location name updated for Chinese: "${locationData.name}" -> "${enhancedDetails.formattedName}"`);
                
                setLocationData({
                  ...locationData,
                  name: enhancedDetails.formattedName,
                  chineseName: enhancedDetails.formattedName
                });
              }
            } else {
              // For English language, update the name with detailed information
              if (enhancedDetails.formattedName && enhancedDetails.formattedName !== 'Remote area') {
                console.log(`Location name updated for English: "${locationData.name}" -> "${enhancedDetails.formattedName}"`);
                
                setLocationData({
                  ...locationData,
                  name: enhancedDetails.formattedName
                });
              }
            }
          } else {
            // Fallback to the old update method if enhanced details fail
            const newName = await updateLocationName(
              locationData.latitude,
              locationData.longitude,
              locationData.name,
              language === 'zh' ? 'zh' : 'en',
              { setCachedData, getCachedData }
            );
            
            if (newName && newName !== locationData.name) {
              console.log(`Location name updated: "${locationData.name}" -> "${newName}"`);
              
              if (language === 'zh') {
                setLocationData({
                  ...locationData,
                  name: newName,
                  chineseName: newName
                });
              } else {
                setLocationData({
                  ...locationData,
                  name: newName
                });
              }
            }
          }
          
          // Mark this combination as processed
          setLastProcessedKey(locationKey);
          initialRenderRef.current = false;
        } catch (error) {
          console.error("Error updating location name for language change:", error);
        } finally {
          setIsUpdating(false);
          updateTimerRef.current = null;
        }
      };
      
      // Run the update for all locations to ensure detailed information
      updateNameForLanguage();
    }, delay);

    // Cleanup function
    return () => {
      if (updateTimerRef.current) {
        window.clearTimeout(updateTimerRef.current);
        updateTimerRef.current = null;
      }
    };
  }, [language, locationData, setLocationData, setCachedData, getCachedData, isUpdating, lastProcessedKey]);

  return null;
}
