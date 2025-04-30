
import { useState, useEffect, useCallback } from 'react';
import { enhancedForecastAstroService } from '@/services/forecast/enhancedForecastAstroService';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { BatchForecastResult, ForecastDayAstroData } from '@/services/forecast/types/forecastTypes';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

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
  const { t } = useLanguage();
  const [forecastLocations, setForecastLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<Map<string, ForecastDayAstroData>>(new Map());

  // Generate sample points within the search radius
  const generateSamplePoints = useCallback((lat: number, lng: number, radius: number, count = 8): Array<{latitude: number, longitude: number}> => {
    const points: Array<{latitude: number, longitude: number}> = [];
    
    // Generate points in a grid pattern within the radius
    const step = radius / 2;
    
    // Generate grid of points
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        // Skip center point (that's the user location)
        if (i === 0 && j === 0) continue;
        
        // Calculate offset in degrees (approximate)
        const latOffset = (i * step) / 111; // 1 degree latitude is ~111km
        const lngOffset = (j * step) / (111 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude
        
        points.push({
          latitude: lat + latOffset,
          longitude: lng + lngOffset
        });
      }
    }
    
    return points.slice(0, count); // Limit to requested count
  }, []);

  // Load forecast data for the current user location and radius
  const loadForecastData = useCallback(async () => {
    if (!userLocation || !showForecast || activeView !== 'calculated') return;
    
    setLoading(true);
    try {
      // Generate sample points within radius
      const samplePoints = generateSamplePoints(
        userLocation.latitude, 
        userLocation.longitude, 
        searchRadius
      );
      
      // Generate unique names for the points
      const locationDataForBatch = samplePoints.map((point, index) => ({
        latitude: point.latitude,
        longitude: point.longitude,
        name: `Forecast Spot ${index + 1}`,
        bortleScale: 4, // Default bortle scale
      }));
      
      // Add user location as the center point
      locationDataForBatch.push({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        name: t("Your Location", "您的位置"),
        bortleScale: 4
      });
      
      // Batch process locations for the selected forecast day
      const batchResults = await enhancedForecastAstroService.batchProcessLocations(
        locationDataForBatch,
        forecastDay
      );
      
      // Filter successful results and convert to shared spots format
      const validResults = batchResults.filter(result => result.success && result.forecast);
      
      // Store forecast data for each location
      const forecastDataMap = new Map<string, ForecastDayAstroData>();
      
      // Convert to shared spots format for map display
      const spots: SharedAstroSpot[] = validResults.map(result => {
        const forecastResult = result.forecast as ForecastDayAstroData;
        const locationKey = `${result.location.latitude.toFixed(6)}-${result.location.longitude.toFixed(6)}`;
        
        // Store the forecast data for this location
        forecastDataMap.set(locationKey, forecastResult);
        
        // Create a shared spot from the forecast data
        return {
          id: `forecast-${locationKey}`,
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          name: result.location.name || `Forecast Spot (${result.location.latitude.toFixed(3)}, ${result.location.longitude.toFixed(3)})`,
          siqs: forecastResult.siqs || 0,
          bortleScale: result.location.bortleScale || 4,
          timestamp: new Date().toISOString(),
          siqsTimestamp: new Date().toISOString(),
          isForecast: true,
          forecastDay: forecastDay,
          cloudCover: forecastResult.cloudCover,
          forecastDate: forecastResult.date
        };
      });
      
      // Update state with the forecast spots and data
      setForecastLocations(spots);
      setForecastData(forecastDataMap);
      
      console.log(`Generated ${spots.length} forecast spots for day ${forecastDay}`);
    } catch (error) {
      console.error("Error loading forecast data:", error);
      toast.error(t("Failed to load forecast data", "无法加载预报数据"));
    } finally {
      setLoading(false);
    }
  }, [userLocation, searchRadius, forecastDay, showForecast, activeView, t, generateSamplePoints]);

  // Load data when parameters change
  useEffect(() => {
    if (showForecast && userLocation) {
      loadForecastData();
    } else {
      // Clear data when forecast is hidden
      setForecastLocations([]);
    }
  }, [userLocation, searchRadius, forecastDay, showForecast, activeView, loadForecastData]);

  return {
    forecastLocations,
    forecastData,
    loading,
    refreshForecast: loadForecastData
  };
};
