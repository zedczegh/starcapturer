
import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { updateLocationName } from '@/lib/locationNameUpdater';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';

/**
 * Hook to handle location name translation and updating
 * Now with enhanced detailed location names
 */
export function useLocationNameTranslation({
  locationData,
  setLocationData,
  setCachedData,
  getCachedData
}) {
  const { language } = useLanguage();

  // Translate location name whenever language changes or location data is initially loaded
  useEffect(() => {
    if (!locationData || !setLocationData) return;

    // Only proceed if we have valid coordinates
    if (typeof locationData.latitude !== 'number' || 
        typeof locationData.longitude !== 'number') {
      return;
    }

    // Skip updating if we already have a detailed name
    // (contains comma separator indicating multiple components)
    if (locationData.name && 
        (locationData.name.includes(',') || locationData.name.includes('，')) && 
        !locationData.name.includes('°')) {
      // Already has a detailed name, no need to update
      return;
    }

    const fetchDetailedLocationName = async () => {
      try {
        // First try to get the enhanced detailed location name
        const enhancedDetails = await getEnhancedLocationDetails(
          locationData.latitude, 
          locationData.longitude, 
          language
        );

        // If we got a good detailed name with street or multiple components
        if (enhancedDetails.formattedName && 
            (enhancedDetails.streetName || 
             enhancedDetails.formattedName.includes(',') || 
             enhancedDetails.formattedName.includes('，'))) {
          
          // Update location data with the enhanced name
          setLocationData({
            ...locationData,
            name: enhancedDetails.formattedName
          });
          return;
        }

        // If enhanced details didn't return a good name, try the fallback
        const updatedName = await updateLocationName(
          locationData.latitude,
          locationData.longitude,
          locationData.name,
          language,
          { setCachedData, getCachedData }
        );

        if (updatedName && updatedName !== locationData.name) {
          // Only update if we got a different name
          setLocationData({
            ...locationData,
            name: updatedName
          });
        }
      } catch (error) {
        console.error("Error fetching enhanced location name:", error);
      }
    };

    fetchDetailedLocationName();
  }, [locationData, setLocationData, language, setCachedData, getCachedData]);
}
