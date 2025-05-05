
import { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { Language } from '@/services/geocoding/types';

interface UseLocationNameTranslationProps {
  locationData: any;
  setLocationData: (data: any) => void;
  setCachedData?: (key: string, data: any) => void;
  getCachedData?: (key: string) => any;
}

export const useLocationNameTranslation = ({
  locationData,
  setLocationData,
  setCachedData,
  getCachedData
}: UseLocationNameTranslationProps) => {
  const { language } = useLanguage();
  const detailedNameFetchedRef = useRef(false);
  const lastFetchAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    if (!locationData || !locationData.latitude || !locationData.longitude) {
      return;
    }

    const cacheKey = `enhanced_location_${locationData.latitude.toFixed(6)}_${locationData.longitude.toFixed(6)}_${language}`;
    const currentLocationKey = `${locationData.latitude.toFixed(6)},${locationData.longitude.toFixed(6)}`;
    
    // Skip if we already fetched for this location in this language
    if (lastFetchAttemptRef.current === cacheKey) {
      return;
    }
    
    lastFetchAttemptRef.current = cacheKey;
    
    // Attempt to use cached enhanced location data first
    const cachedData = getCachedData?.(cacheKey);
    
    if (cachedData && cachedData.formattedName) {
      console.log("Using cached enhanced location name:", cachedData.formattedName);
      
      // Only update if the current name is less detailed or a coordinate
      const currentName = locationData.formattedName || '';
      const isCurrentNameDetailed = currentName && 
                                   !currentName.includes('°') && 
                                   !currentName.includes('Location at') &&
                                   !currentName.includes('Remote area');
      
      const isCachedMoreDetailed = cachedData.formattedName.includes(',') || 
                                  (cachedData.streetName && cachedData.townName);
                                  
      if (!isCurrentNameDetailed || isCachedMoreDetailed) {
        setLocationData({
          ...locationData,
          formattedName: cachedData.formattedName,
          streetName: cachedData.streetName,
          townName: cachedData.townName,
          cityName: cachedData.cityName,
          countyName: cachedData.countyName,
          stateName: cachedData.stateName
        });
      }
      
      detailedNameFetchedRef.current = true;
      return;
    }
    
    // Fetch enhanced location details for a more detailed name
    const fetchDetailedLocationName = async () => {
      try {
        // Only proceed if we haven't already successfully fetched a detailed name
        if (detailedNameFetchedRef.current) {
          return;
        }
        
        const typedLanguage: Language = language === 'zh' ? 'zh' : 'en';
        
        const enhancedDetails = await getEnhancedLocationDetails(
          locationData.latitude,
          locationData.longitude,
          typedLanguage
        );
        
        // Cache the enhanced details
        if (setCachedData && enhancedDetails) {
          setCachedData(cacheKey, enhancedDetails);
        }
        
        // Only update the location data if we got meaningful details
        // and the current name is less detailed (like coordinates)
        const currentName = locationData.formattedName || '';
        const isCurrentNameDetailed = currentName && 
                                     !currentName.includes('°') && 
                                     !currentName.includes('Location at') &&
                                     !currentName.includes('Remote area');
                                     
        const hasDetailedName = enhancedDetails.formattedName && 
                               !enhancedDetails.formattedName.includes('°') &&
                               !enhancedDetails.formattedName.includes('Location at') &&
                               !enhancedDetails.formattedName.includes('Remote area');
                               
        if (hasDetailedName && (!isCurrentNameDetailed || enhancedDetails.streetName)) {
          console.log("Updating with enhanced location name:", enhancedDetails.formattedName);
          
          setLocationData({
            ...locationData,
            formattedName: enhancedDetails.formattedName,
            streetName: enhancedDetails.streetName,
            townName: enhancedDetails.townName,
            cityName: enhancedDetails.cityName,
            countyName: enhancedDetails.countyName,
            stateName: enhancedDetails.stateName
          });
          
          detailedNameFetchedRef.current = true;
        }
      } catch (error) {
        console.error("Error fetching enhanced location name:", error);
      }
    };
    
    // Execute with a slight delay to allow the component to render first
    const timer = setTimeout(fetchDetailedLocationName, 300);
    
    return () => clearTimeout(timer);
  }, [locationData, setLocationData, language, getCachedData, setCachedData]);
};
