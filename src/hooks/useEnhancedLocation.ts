
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { EnhancedLocationDetails } from '@/services/geocoding/types/enhancedLocationTypes';

interface UseEnhancedLocationProps {
  latitude?: number;
  longitude?: number;
  skip?: boolean;
}

/**
 * Hook that provides enhanced location details including street-level data
 */
export function useEnhancedLocation({ 
  latitude, 
  longitude, 
  skip = false 
}: UseEnhancedLocationProps) {
  const { language } = useLanguage();
  const [locationDetails, setLocationDetails] = useState<EnhancedLocationDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if coordinates are missing or skip flag is set
    if (skip || !latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) {
      return;
    }

    let isMounted = true;
    
    const fetchLocationDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const details = await getEnhancedLocationDetails(latitude, longitude, language);
        
        if (isMounted) {
          setLocationDetails(details);
        }
      } catch (err) {
        console.error("Error fetching enhanced location:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error fetching location details'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLocationDetails();
    
    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, language, skip]);

  return {
    locationDetails,
    loading,
    error,
    refetch: () => {
      if (latitude && longitude) {
        getEnhancedLocationDetails(latitude, longitude, language)
          .then(details => setLocationDetails(details))
          .catch(err => setError(err));
      }
    }
  };
}

export default useEnhancedLocation;
