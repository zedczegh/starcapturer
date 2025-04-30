
import { useState, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getForecast } from '@/services/weather/getForecast';

interface UseForecastMapMarkersProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  forecastDay: number;
  showForecast: boolean;
  activeView: 'certified' | 'calculated';
}

export const useForecastMapMarkers = ({
  userLocation,
  searchRadius,
  forecastDay,
  showForecast,
  activeView
}: UseForecastMapMarkersProps) => {
  const [forecastLocations, setForecastLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Only fetch forecast data if forecast view is enabled, for calculated view, and we have a user location
    if (showForecast && activeView === 'calculated' && userLocation) {
      setLoading(true);
      
      const fetchForecastData = async () => {
        try {
          // Get forecast data for the user's location
          const forecastData = await getForecast(userLocation.latitude, userLocation.longitude);
          
          if (!isMounted) return;
          
          if (forecastData && forecastData.daily) {
            // Process forecast data to create forecast locations
            const today = new Date();
            const forecastDate = new Date(today);
            forecastDate.setDate(today.getDate() + forecastDay);
            
            // Create a simple forecast location at the user's position
            const forecastLocation: SharedAstroSpot = {
              id: `forecast-${forecastDay}-user`,
              name: `Forecast for ${forecastDate.toLocaleDateString()}`,
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              bortleScale: 4, // Default bortle scale
              timestamp: new Date().toISOString(),
              siqs: 7.5, // Example SIQS score for forecasting
              isForecast: true,
              forecastDay: forecastDay,
              forecastDate: forecastDate.toISOString().split('T')[0],
              cloudCover: forecastData.daily.cloudcover[forecastDay] || 0,
              distance: 0
            };
            
            setForecastLocations([forecastLocation]);
          }
        } catch (error) {
          console.error('Error fetching forecast data:', error);
          setForecastLocations([]);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };
      
      fetchForecastData();
    } else {
      // Reset forecast locations when forecast is disabled
      setForecastLocations([]);
      setLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [userLocation, searchRadius, forecastDay, showForecast, activeView]);

  return {
    forecastLocations,
    loading
  };
};

export default useForecastMapMarkers;
