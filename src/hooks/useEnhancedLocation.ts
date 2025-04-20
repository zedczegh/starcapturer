
import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { EnhancedLocationDetails } from '@/services/geocoding/types/enhancedLocationTypes';
import { Language } from '@/services/geocoding/types';

interface UseEnhancedLocationProps {
  latitude?: number;
  longitude?: number;
  skip?: boolean;
}

// Cache for location details
const locationDetailsCache = new Map<string, {
  details: EnhancedLocationDetails;
  timestamp: number;
}>();

/**
 * Hook that provides enhanced location details including street-level data
 * With improved caching and error handling
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

  // Get cached details or fetch new ones
  const fetchLocationDetails = useCallback(async (lat: number, lng: number, lang: Language) => {
    // Generate cache key
    const cacheKey = `${lat.toFixed(6)}-${lng.toFixed(6)}-${lang}`;
    
    // Check cache first (valid for 24 hours)
    const cached = locationDetailsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000)) {
      console.log("Using cached location details");
      return cached.details;
    }
    
    // Fetch new details
    try {
      const details = await getEnhancedLocationDetails(lat, lng, lang);
      
      // Cache the result
      locationDetailsCache.set(cacheKey, {
        details,
        timestamp: Date.now()
      });
      
      // Clean cache if too large
      if (locationDetailsCache.size > 100) {
        const keysToDelete = [...locationDetailsCache.keys()]
          .sort((a, b) => {
            const aTime = locationDetailsCache.get(a)?.timestamp || 0;
            const bTime = locationDetailsCache.get(b)?.timestamp || 0;
            return aTime - bTime;
          })
          .slice(0, 20);
        
        keysToDelete.forEach(key => locationDetailsCache.delete(key));
      }
      
      return details;
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    // Skip if coordinates are missing or skip flag is set
    if (skip || !latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) {
      return;
    }

    let isMounted = true;
    
    const getDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fix: Ensure language is properly typed as 'en' | 'zh'
        const languageValue: Language = language === 'zh' ? 'zh' : 'en';
        const details = await fetchLocationDetails(latitude, longitude, languageValue);
        
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

    getDetails();
    
    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, language, skip, fetchLocationDetails]);

  // Update refetch to use cached logic
  const refetch = useCallback(() => {
    if (latitude && longitude) {
      setLoading(true);
      // Fix: Ensure language is properly typed here too
      const languageValue: Language = language === 'zh' ? 'zh' : 'en';
      fetchLocationDetails(latitude, longitude, languageValue)
        .then(details => {
          setLocationDetails(details);
          setLoading(false);
        })
        .catch(err => {
          setError(err);
          setLoading(false);
        });
    }
  }, [latitude, longitude, language, fetchLocationDetails]);

  return {
    locationDetails,
    loading,
    error,
    refetch
  };
}

export default useEnhancedLocation;
