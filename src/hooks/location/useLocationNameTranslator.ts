
import { useCallback, useState } from "react";
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import { useLanguage } from "@/contexts/LanguageContext";
import { convertToSimplifiedChinese } from "@/utils/chineseCharacterConverter";

interface UseLocationNameTranslatorProps {
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
  setCachedData: (key: string, data: any) => void;
  getCachedData: (key: string, maxAge?: number) => any;
}

export const useLocationNameTranslator = ({
  onLocationUpdate,
  setCachedData,
  getCachedData
}: UseLocationNameTranslatorProps) => {
  const { language } = useLanguage();
  const [lastTranslationRequest, setLastTranslationRequest] = useState<string | null>(null);
  const [isProcessingLanguageChange, setIsProcessingLanguageChange] = useState(false);

  // Create a debounced translation request key
  const createTranslationRequestKey = useCallback((location: { latitude: number; longitude: number } | null) => {
    if (!location) return null;
    return `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}-${language}`;
  }, [language]);

  // Update location name when language changes
  const updateLocationNameForLanguage = useCallback(async (
    currentLocation: { name: string; latitude: number; longitude: number } | null
  ) => {
    // Skip if no location or already processing
    if (!currentLocation || isProcessingLanguageChange) return false;
    
    const currentRequestKey = createTranslationRequestKey(currentLocation);
    
    // Skip if we've already processed this exact request
    if (currentRequestKey === lastTranslationRequest) return false;
    
    // Skip special locations like Beijing
    if (currentLocation.name === "北京" || currentLocation.name === "Beijing") return false;
    
    try {
      setIsProcessingLanguageChange(true);
      let locationName = await getLocationNameForCoordinates(
        currentLocation.latitude,
        currentLocation.longitude,
        language,
        { setCachedData, getCachedData }
      );
      
      // Ensure Chinese names are in simplified format
      if (language === 'zh' && locationName) {
        locationName = convertToSimplifiedChinese(locationName);
      }
      
      // Only update if the name changed to avoid unnecessary re-renders
      if (locationName && locationName !== currentLocation.name) {
        await onLocationUpdate({
          name: locationName,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        });
      }
      
      // Update the last translation request to prevent duplicates
      setLastTranslationRequest(currentRequestKey);
      setIsProcessingLanguageChange(false);
      return true;
    } catch (error) {
      console.error("Error updating location name on language change:", error);
      setIsProcessingLanguageChange(false);
      return false;
    }
  }, [createTranslationRequestKey, getCachedData, isProcessingLanguageChange, language, lastTranslationRequest, onLocationUpdate, setCachedData]);

  return {
    updateLocationNameForLanguage,
    createTranslationRequestKey,
    isProcessingLanguageChange,
    setLastTranslationRequest
  };
};
