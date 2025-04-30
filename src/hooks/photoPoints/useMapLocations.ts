
// Import the correct type
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getForecast } from '@/services/weather/getForecast';

interface UseMapLocationsProps {
  locations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  showForecast?: boolean;
  forecastDay?: number;
}

export function useMapLocations({
  locations,
  activeView,
  userLocation,
  searchRadius,
  showForecast = false,
  forecastDay = 0
}: UseMapLocationsProps) {
  const { t } = useLanguage();
  const [forecastData, setForecastData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [processedLocations, setProcessedLocations] = useState<SharedAstroSpot[]>([]);

  useEffect(() => {
    setSelectedDay(forecastDay || 0);
  }, [forecastDay]);

  // Ensure timestamp is added if needed
  const processLocation = useCallback((location: SharedAstroSpot): SharedAstroSpot => {
    return {
      ...location,
      timestamp: location.timestamp || new Date().toISOString()
    };
  }, []);

  // Process locations when they change
  useEffect(() => {
    if (locations && Array.isArray(locations)) {
      const processed = locations.map(loc => {
        const processedLoc = processLocation(loc);
        return {
          ...processedLoc,
          isForecast: !!loc.isForecast,
          forecastDay: loc.forecastDay || selectedDay
        };
      });
      setProcessedLocations(processed);
    }
  }, [locations, processLocation, selectedDay]);

  // Fetch forecast data when needed
  useEffect(() => {
    if (showForecast && userLocation) {
      const fetchForecast = async () => {
        try {
          const data = await getForecast(userLocation.latitude, userLocation.longitude);
          setForecastData(data);
        } catch (error) {
          console.error("Failed to fetch forecast:", error);
          setForecastData(null);
        }
      };
      fetchForecast();
    } else {
      setForecastData(null);
    }
  }, [showForecast, userLocation]);

  // Get cloud cover for a location
  const getCloudCover = useCallback((location: SharedAstroSpot) => {
    if (!showForecast || !forecastData || !location.forecastDay) {
      return null;
    }

    const forecastDayIndex = location.forecastDay;
    if (forecastDayIndex >= 0 && forecastDayIndex < forecastData.daily.time.length) {
      return forecastData.daily.cloudcover[forecastDayIndex];
    }

    return null;
  }, [forecastData, showForecast]);

  return {
    processedLocations,
    getCloudCover
  };
}
