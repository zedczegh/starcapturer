
import React, { useEffect, useState } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { findNearestTown } from '@/utils/nearestTownCalculator';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { Language } from '@/services/geocoding/types';

interface DisplayNameResolverProps {
  location: SharedAstroSpot;
  language: string;
  locationCounter: number | null;
}

export function useDisplayName({ location, language, locationCounter }: DisplayNameResolverProps) {
  const [enhancedLocation, setEnhancedLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Convert string language to Language type
  const typedLanguage: Language = language === 'zh' ? 'zh' : 'en';
  
  // Get nearest town information with enhanced details
  const nearestTownInfo = location.latitude && location.longitude ? 
    findNearestTown(location.latitude, location.longitude, typedLanguage) : null;
  
  // Fetch enhanced location details when coordinates are available
  useEffect(() => {
    let isMounted = true;
    
    if (location.latitude && location.longitude) {
      setIsLoading(true);
      
      getEnhancedLocationDetails(location.latitude, location.longitude, typedLanguage)
        .then(details => {
          if (isMounted) {
            setEnhancedLocation(details);
            setIsLoading(false);
          }
        })
        .catch(error => {
          console.error("Error fetching enhanced location details:", error);
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }
    
    return () => {
      isMounted = false;
    };
  }, [location.latitude, location.longitude, typedLanguage]);
  
  // Use detailed location name as the display name based on language
  let displayName;
  
  if (language === 'zh') {
    // For Chinese, prioritize the explicit Chinese name first
    if (location.chineseName) {
      // Use explicit Chinese name if available
      displayName = location.chineseName;
    } else if (enhancedLocation?.formattedName && 
        enhancedLocation.formattedName !== '偏远地区' && 
        !isLoading) {
      // Use enhanced name from our new service for Chinese
      displayName = enhancedLocation.formattedName;
    } else if (nearestTownInfo?.detailedName && 
               nearestTownInfo.detailedName !== '偏远地区') {
      // Use detailed name from our enhanced database for Chinese
      displayName = nearestTownInfo.detailedName;
    } else if (!location.id && !location.certification && !location.isDarkSkyReserve && locationCounter) {
      // Fallback for potential ideal dark sites in Chinese
      displayName = `潜在理想暗夜地点 ${locationCounter}`;
    } else {
      // Last resort fallback to original name
      displayName = location.name;
    }
  } else {
    // For English, use the default name
    if (enhancedLocation?.formattedName && 
        enhancedLocation.formattedName !== 'Remote area' && 
        !isLoading) {
      // Use enhanced name from our new service for English
      displayName = enhancedLocation.formattedName;
    } else if (nearestTownInfo?.detailedName && 
               nearestTownInfo.detailedName !== 'Remote area') {
      // Use detailed name from our enhanced database for English
      displayName = nearestTownInfo.detailedName;
    } else if (!location.id && !location.certification && !location.isDarkSkyReserve && locationCounter) {
      // Fallback for potential ideal dark sites
      displayName = `Potential ideal dark site ${locationCounter}`;
    } else {
      // Fallback to original name
      displayName = location.name;
    }
  }
  
  // Check if we need to show original name
  const showOriginalName = (language === 'zh' && location.chineseName && location.name !== location.chineseName) || 
    ((enhancedLocation || nearestTownInfo) && 
    ((enhancedLocation && enhancedLocation.formattedName !== (language === 'en' ? 'Remote area' : '偏远地区')) ||
     (nearestTownInfo && nearestTownInfo.townName !== (language === 'en' ? 'Remote area' : '偏远地区'))) && 
    ((language === 'zh' && location.name && 
      ((enhancedLocation && location.name !== enhancedLocation.formattedName) ||
       (!enhancedLocation && location.name !== nearestTownInfo?.detailedName))) ||
     (language === 'en' && location.name && 
      ((enhancedLocation && location.name !== enhancedLocation.formattedName) ||
       (!enhancedLocation && location.name !== nearestTownInfo?.detailedName)))));
  
  return { 
    displayName, 
    showOriginalName, 
    nearestTownInfo,
    enhancedLocation
  };
}

export default useDisplayName;
