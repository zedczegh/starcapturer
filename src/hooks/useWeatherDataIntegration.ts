import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import WeatherDataService from '@/services/weatherDataService';
import { findClosestEnhancedLocation } from '@/services/realTimeSiqs/enhancedLocationData';
import { findClimateRegion, getLocationClimateInfo } from '@/services/realTimeSiqs/climateRegions';

interface WeatherDataIntegrationOptions {
  refreshInterval?: number;
  enabled?: boolean;
  onDataLoaded?: (data: any) => void;
  includeHistoricalData?: boolean;
}

/**
 * Custom hook for integrating weather and clear sky data
 * with enhanced support for certified locations and climate regions
 */
export function useWeatherDataIntegration(
  latitude: number | null,
  longitude: number | null,
  options: WeatherDataIntegrationOptions = {}
) {
  const { 
    refreshInterval = 0, 
    enabled = true, 
    onDataLoaded,
    includeHistoricalData = true 
  } = options;
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Check for enhanced location data first
  const enhancedLocationData = latitude !== null && longitude !== null ? 
    findClosestEnhancedLocation(latitude, longitude) : null;
  
  // Check for climate region data
  const climateRegion = latitude !== null && longitude !== null ?
    findClimateRegion(latitude, longitude) : null;
  
  // Query for clear sky rate data with historical data support
  const {
    data: clearSkyData,
    isLoading: clearSkyLoading,
    isFetching: clearSkyFetching,
    refetch: refetchClearSky
  } = useQuery({
    queryKey: ['clearSkyRate', latitude, longitude, refreshKey, includeHistoricalData],
    queryFn: async () => {
      // If we have enhanced location data, use it
      if (enhancedLocationData && enhancedLocationData.clearSkyRate) {
        console.log(`Using enhanced location data for ${enhancedLocationData.name}`);
        return {
          annualRate: enhancedLocationData.clearSkyRate,
          monthlyRates: generateMonthlyRatesFromSeasons(enhancedLocationData.seasonalTrends),
          source: `Enhanced location data: ${enhancedLocationData.name}`,
          isDarkSkyReserve: enhancedLocationData.isDarkSkyReserve || false,
          certification: enhancedLocationData.certification,
          isCertified: !!enhancedLocationData.certification || !!enhancedLocationData.isDarkSkyReserve
        };
      } 
      
      // Use climate region data as fallback
      if (climateRegion && latitude && longitude) {
        const climateInfo = getLocationClimateInfo(latitude, longitude);
        if (climateInfo.clearSkyRate) {
          console.log(`Using climate region data for ${climateRegion.name}`);
          return {
            annualRate: climateInfo.clearSkyRate,
            monthlyRates: generateMonthlyRatesFromClimateRegion(climateRegion),
            source: `Climate region: ${climateInfo.region}`,
            characteristic: climateInfo.characteristic
          };
        }
      }
      
      // Fall back to API data
      if (latitude && longitude) {
        return WeatherDataService.getClearSkyRate(latitude, longitude, false, includeHistoricalData);
      }
      
      return null;
    },
    enabled: !!latitude && !!longitude && enabled,
    staleTime: refreshInterval > 0 ? refreshInterval : 24 * 60 * 60 * 1000,
  });
  
  // Query for current weather data with shorter stale time
  const {
    data: weatherData,
    isLoading: weatherLoading,
    isFetching: weatherFetching,
    refetch: refetchWeather
  } = useQuery({
    queryKey: ['currentWeather', latitude, longitude, refreshKey],
    queryFn: () => latitude && longitude 
      ? WeatherDataService.getCurrentWeather(latitude, longitude)
      : null,
    enabled: !!latitude && !!longitude && enabled,
    staleTime: 15 * 60 * 1000, // Weather data stales faster (15 minutes)
  });
  
  // Get historical pattern data from enhanced sources if available
  const getHistoricalData = async () => {
    if (!latitude || !longitude) return null;
    
    if (enhancedLocationData) {
      // Return enhanced location data in the expected format
      return {
        seasonalTrends: enhancedLocationData.seasonalTrends || {},
        clearestMonths: enhancedLocationData.bestMonths || [],
        visibility: enhancedLocationData.averageVisibility || 'average',
        annualPrecipitationDays: enhancedLocationData.annualPrecipitationDays || 90,
        source: `Enhanced location data: ${enhancedLocationData.name}`,
        characteristics: enhancedLocationData.characteristics || []
      };
    }
    
    // Get climate region data if available
    if (climateRegion) {
      const climateInfo = getLocationClimateInfo(latitude, longitude);
      return {
        seasonalTrends: generateSeasonalTrendsFromClimate(climateRegion),
        clearestMonths: climateInfo.bestMonths || [],
        visibility: 'average',
        annualPrecipitationDays: estimatePrecipitationDays(climateRegion),
        source: `Climate region: ${climateInfo.region}`,
        characteristic: climateInfo.characteristic
      };
    }
    
    // Use standard API as fallback
    return WeatherDataService.getHistoricalWeatherPatterns(latitude, longitude);
  };
  
  // Historical weather patterns for specified location
  const {
    data: historicalData,
    isLoading: historicalLoading,
    isFetching: historicalFetching
  } = useQuery({
    queryKey: ['historicalWeather', latitude, longitude, refreshKey, !!enhancedLocationData],
    queryFn: getHistoricalData,
    enabled: !!latitude && !!longitude && enabled && includeHistoricalData,
    staleTime: 7 * 24 * 60 * 60 * 1000, // Historical data changes very slowly (1 week)
  });
  
  // Notify when data types are loaded
  useEffect(() => {
    if (onDataLoaded && clearSkyData && weatherData) {
      onDataLoaded({
        clearSky: clearSkyData,
        weather: weatherData,
        historical: historicalData
      });
    }
  }, [clearSkyData, weatherData, historicalData, onDataLoaded]);
  
  // Function to force refresh all data types
  const refresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchClearSky();
    refetchWeather();
  };
  
  // Check if this is likely a certified location
  const isCertifiedLocation = !!(
    latitude && 
    longitude && 
    (clearSkyData?.isCertified || 
     clearSkyData?.isDarkSkyReserve || 
     enhancedLocationData?.isDarkSkyReserve ||
     enhancedLocationData?.certification)
  );
  
  return {
    clearSkyData,
    weatherData,
    historicalData,
    loading: clearSkyLoading || weatherLoading || (includeHistoricalData && historicalLoading),
    fetching: clearSkyFetching || weatherFetching || (includeHistoricalData && historicalFetching),
    refresh,
    isCertifiedLocation,
    enhancedLocation: enhancedLocationData,
    climateRegion,
    // Individual refresh functions
    refreshClearSky: refetchClearSky,
    refreshWeather: refetchWeather
  };
}

/**
 * Generate monthly rates from seasonal data
 */
function generateMonthlyRatesFromSeasons(seasonalTrends?: Record<string, { clearSkyRate: number, averageTemperature: number }>): Record<string, number> {
  if (!seasonalTrends) {
    return defaultMonthlyRates();
  }
  
  const monthMap: Record<string, string> = {
    'Jan': 'winter', 'Feb': 'winter', 'Mar': 'spring',
    'Apr': 'spring', 'May': 'spring', 'Jun': 'summer',
    'Jul': 'summer', 'Aug': 'summer', 'Sep': 'fall',
    'Oct': 'fall', 'Nov': 'fall', 'Dec': 'winter'
  };
  
  const result: Record<string, number> = {};
  
  // Apply base seasonal rates with small variations for each month
  Object.keys(monthMap).forEach(month => {
    const season = monthMap[month];
    const baseRate = seasonalTrends[season]?.clearSkyRate || 60;
    // Add -5 to +5 variation to make it realistic
    const variation = Math.floor(Math.random() * 11) - 5;
    result[month] = Math.min(100, Math.max(0, baseRate + variation));
  });
  
  return result;
}

/**
 * Generate seasonal trends from climate region
 */
function generateSeasonalTrendsFromClimate(region: any): Record<string, { clearSkyRate: number, averageTemperature: number }> {
  // Base values
  const baseTemp = 15;
  const baseClearSky = region.avgClearSkyRate || 60;
  
  // Create seasonal variations
  return {
    spring: { 
      clearSkyRate: Math.min(100, Math.max(0, baseClearSky + (region.seasonalFactors?.spring ? (region.seasonalFactors.spring - 1) * 20 : 0))), 
      averageTemperature: baseTemp 
    },
    summer: { 
      clearSkyRate: Math.min(100, Math.max(0, baseClearSky + (region.seasonalFactors?.summer ? (region.seasonalFactors.summer - 1) * 20 : 0))), 
      averageTemperature: baseTemp + 10 
    },
    fall: { 
      clearSkyRate: Math.min(100, Math.max(0, baseClearSky + (region.seasonalFactors?.fall ? (region.seasonalFactors.fall - 1) * 20 : 0))), 
      averageTemperature: baseTemp 
    },
    winter: { 
      clearSkyRate: Math.min(100, Math.max(0, baseClearSky + (region.seasonalFactors?.winter ? (region.seasonalFactors.winter - 1) * 20 : 0))), 
      averageTemperature: baseTemp - 10
    }
  };
}

/**
 * Generate monthly rates from climate region
 */
function generateMonthlyRatesFromClimateRegion(region: any): Record<string, number> {
  const result: Record<string, number> = defaultMonthlyRates();
  const avgRate = region.avgClearSkyRate || 60;
  
  // Months are 0-11 for Jan-Dec
  const bestMonths = region.bestMonths || [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Set base rate for all months
  monthNames.forEach(month => {
    result[month] = avgRate;
  });
  
  // Boost best months
  bestMonths.forEach(monthIndex => {
    const monthName = monthNames[monthIndex];
    result[monthName] = Math.min(100, avgRate + 15);
  });
  
  // Reduce worst months (opposite of best)
  monthNames.forEach(month => {
    if (result[month] === avgRate) {
      result[month] = Math.max(0, avgRate - 10);
    }
  });
  
  return result;
}

/**
 * Estimate precipitation days from climate region
 */
function estimatePrecipitationDays(region: any): number {
  const avgClearSky = region.avgClearSkyRate || 60;
  
  // Inverse relationship between clear sky and precipitation
  return Math.round(365 * (1 - (avgClearSky / 150))); // Formula gives reasonable estimates
}

/**
 * Default monthly rates when no data available
 */
function defaultMonthlyRates(): Record<string, number> {
  return {
    'Jan': 60, 'Feb': 62, 'Mar': 65,
    'Apr': 68, 'May': 70, 'Jun': 75,
    'Jul': 78, 'Aug': 75, 'Sep': 70,
    'Oct': 65, 'Nov': 62, 'Dec': 60
  };
}
