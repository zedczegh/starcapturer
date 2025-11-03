import { useState, useEffect } from 'react';
import { getCountryInfoFromCoordinates, getAllCountries } from '@/services/countryService';

interface CountryInfo {
  flag: string;
  name: string;
  name_zh?: string;
}

// Preload countries on module load
getAllCountries().catch(console.error);

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
      // Check cache first with more precision for better hits
      const cacheKey = `country_${latitude.toFixed(1)}_${longitude.toFixed(1)}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          if (isMounted) {
            setCountryInfo(parsedCache);
            setLoading(false);
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
          
          // Cache the result in localStorage for persistence
          if (info) {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(info));
            } catch (e) {
              // Storage full, try sessionStorage
              try {
                sessionStorage.setItem(cacheKey, JSON.stringify(info));
              } catch (e2) {
                // Ignore storage errors
              }
            }
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

    // Small delay to batch requests
    const timer = setTimeout(fetchCountryInfo, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [latitude, longitude]);

  return { countryInfo, loading };
}
