// Import the correct type
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getForecast } from '@/services/weather/getForecast';

interface UseMapLocationsProps {
  locations: any[];
  activeView: 'certified' | 'calculated';
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  showForecast: boolean;
  forecastDay: number;
}

export function useMapLocations({
  locations,
  activeView,
  userLocation,
  searchRadius,
  showForecast,
  forecastDay
}: UseMapLocationsProps) {
  const { t } = useLanguage();
  const [forecastData, setForecastData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    setSelectedDay(forecastDay);
  }, [forecastDay]);

  // Ensure timestamp is added if needed
  const processLocation = (location: any): SharedAstroSpot => {
    return {
      ...location,
      timestamp: location.timestamp || new Date().toISOString()
    };
  };

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

  const locationsWithForecast = locations.map(loc => {
    const processedLocation = processLocation(loc);
    return {
      ...processedLocation,
      isForecast: showForecast,
      forecastDay: selectedDay
    };
  });

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
    locationsWithForecast,
    getCloudCover
  };
}
