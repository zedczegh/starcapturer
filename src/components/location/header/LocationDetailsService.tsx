
import { useState, useEffect } from 'react';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { Language } from '@/services/geocoding/types';

interface LocationDetailsServiceProps {
  latitude?: number;
  longitude?: number;
  language: string;
}

export interface EnhancedLocationResult {
  enhancedName: string | null;
  locationDetails: string | null;
}

export const useLocationDetailsService = ({
  latitude,
  longitude,
  language
}: LocationDetailsServiceProps): EnhancedLocationResult => {
  const [enhancedName, setEnhancedName] = useState<string | null>(null);
  const [locationDetails, setLocationDetails] = useState<string | null>(null);
  
  // Fetch enhanced location details when coordinates are available
  useEffect(() => {
    if (latitude && longitude) {
      const typedLanguage = language === 'zh' ? 'zh' : 'en';
      
      getEnhancedLocationDetails(latitude, longitude, typedLanguage as Language)
        .then(details => {
          if (details.formattedName && details.formattedName !== (language === 'en' ? 'Remote area' : '偏远地区')) {
            setEnhancedName(details.formattedName);
            
            // Create a detailed location string from available components
            const detailParts = [];
            if (details.townName) detailParts.push(details.townName);
            if (details.cityName && (!details.townName || details.cityName !== details.townName)) {
              detailParts.push(details.cityName);
            }
            if (details.countyName && (!details.cityName || details.countyName !== details.cityName)) {
              detailParts.push(details.countyName);
            }
            
            if (detailParts.length > 0) {
              setLocationDetails(detailParts.join(language === 'en' ? ', ' : ''));
            }
          }
        })
        .catch(error => {
          console.error("Error fetching enhanced location details:", error);
        });
    }
  }, [latitude, longitude, language]);

  return { enhancedName, locationDetails };
};
