import { useEffect, useState } from 'react';
import { fetchForecastData } from '@/lib/api/forecast';
import { calculateNighttimeSiqs as calculateNighttimeSIQS } from '@/utils/nighttimeSIQS';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Language } from '@/services/geocoding/types';

interface UseLocationSIQSUpdaterProps {
  location: SharedAstroSpot;
  language: Language;
  onSiqsUpdate: (siqs: number | null) => void;
}

/**
 * Hook to update SIQS (Stellar Imaging Quality Score) for a location
 * Fetches forecast data and calculates SIQS based on nighttime conditions
 */
export const useLocationSIQSUpdater = ({
  location,
  language,
  onSiqsUpdate
}: UseLocationSIQSUpdaterProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location || !location.latitude || !location.longitude) return;

    const updateSIQS = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch forecast data for the location
        const forecastData = await fetchForecastData(
          location.latitude,
          location.longitude,
          language
        );

        if (!forecastData || !forecastData.hourly) {
          throw new Error("Failed to fetch forecast data");
        }

        // Calculate nighttime SIQS
        const siqsResult = calculateNighttimeSIQS(
          location,
          forecastData,
          language
        );

        if (siqsResult) {
          // Update SIQS score
          onSiqsUpdate(siqsResult.score);
        } else {
          onSiqsUpdate(null);
        }
      } catch (err) {
        setError((err as Error).message);
        console.error("Error updating SIQS:", err);
        onSiqsUpdate(null);
      } finally {
        setLoading(false);
      }
    };

    updateSIQS();
  }, [location, language, onSiqsUpdate]);

  return {
    loading,
    error
  };
};
