import { useState, useEffect } from 'react';
import { getCountryInfoFromCoordinates } from '@/services/countryService';

interface CountryInfo {
  flag: string;
  name: string;
  name_zh?: string;
}

/**
 * Hook to get country flag from coordinates
 */
export function useCountryFlag(latitude?: number, longitude?: number) {
  const [countryInfo, setCountryInfo] = useState<CountryInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!latitude || !longitude) {
      setCountryInfo(null);
      return;
    }

    let isMounted = true;

    const fetchCountryInfo = async () => {
      // Check cache first
      const cacheKey = `country_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          if (isMounted) {
            setCountryInfo(parsedCache);
          }
          return;
        } catch (e) {
          // Invalid cache, continue
        }
      }

      setLoading(true);
      
      try {
        const info = await getCountryInfoFromCoordinates(latitude, longitude);
        
        if (isMounted) {
          setCountryInfo(info);
          
          // Cache the result
          if (info) {
            sessionStorage.setItem(cacheKey, JSON.stringify(info));
          }
        }
      } catch (error) {
        console.error('Error fetching country info:', error);
        if (isMounted) {
          setCountryInfo(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCountryInfo();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  return { countryInfo, loading };
}
