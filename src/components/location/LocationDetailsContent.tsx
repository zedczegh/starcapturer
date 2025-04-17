
import React, { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import LocationMap from './LocationMap';
import LocationContentGrid from './LocationContentGrid';
import { useForecastData } from '@/hooks/useForecastData';
import { useSIQSUpdater } from '@/hooks/locationDetails/useSIQSUpdater';
import { getSiqsScore } from '@/utils/siqsHelpers';

interface LocationDetailsContentProps {
  locationData: any;
  setLocationData: React.Dispatch<React.SetStateAction<any>>;
  onLocationUpdate: (location: any) => Promise<void>;
}

const LocationDetailsContent: React.FC<LocationDetailsContentProps> = ({
  locationData,
  setLocationData,
  onLocationUpdate
}) => {
  const { t } = useLanguage();
  
  // Extract SIQS score using our helper to ensure consistency
  const siqsScore = getSiqsScore(locationData?.siqsResult);
  
  // Get forecast data - using destructured properties that actually exist in the hook
  const {
    forecastData,
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    handleRefreshForecast,
    handleRefreshLongRangeForecast
  } = useForecastData();
  
  // For components that need these props, we'll create them locally
  const gettingUserLocation = false;
  const setGettingUserLocation = () => {};
  
  // Use SIQS updater hook
  const { updateSIQSWithForecast, resetUpdateState } = useSIQSUpdater();
  
  // Update SIQS when forecast data changes
  useEffect(() => {
    if (forecastData && !forecastLoading && locationData) {
      updateSIQSWithForecast(
        locationData,
        forecastData,
        forecastLoading,
        setLocationData
      );
    }
  }, [forecastData, forecastLoading, locationData, setLocationData, updateSIQSWithForecast]);
  
  // Reset SIQS update state when location changes
  useEffect(() => {
    resetUpdateState();
  }, [locationData?.latitude, locationData?.longitude, resetUpdateState]);
  
  // Early return for missing location data
  if (!locationData) {
    return <div className="text-center py-8">{t("Loading location data...", "加载位置数据...")}</div>;
  }
  
  // Define handler for location updates
  const handleLocationCoordinateUpdate = (latitude: number, longitude: number) => {
    if (onLocationUpdate) {
      const updatedLocation = {
        ...locationData,
        latitude,
        longitude
      };
      onLocationUpdate(updatedLocation);
    }
  };
  
  return (
    <div className="space-y-6">
      <LocationMap
        latitude={locationData.latitude || 0}
        longitude={locationData.longitude || 0}
        name={locationData.name || t("Unknown Location", "未知位置")}
        onLocationUpdate={handleLocationCoordinateUpdate}
        editable={true}
        isDarkSkyReserve={locationData.isDarkSkyReserve}
        certification={locationData.certification}
        siqs={locationData.siqsResult || siqsScore}
      />
      
      <LocationContentGrid
        locationData={locationData}
        forecastData={forecastData}
        longRangeForecast={longRangeForecast}
        forecastLoading={forecastLoading}
        longRangeLoading={longRangeLoading}
        gettingUserLocation={gettingUserLocation}
        onLocationUpdate={onLocationUpdate}
        setGettingUserLocation={setGettingUserLocation}
        setStatusMessage={() => {}}
        onRefreshForecast={handleRefreshForecast}
        onRefreshLongRange={handleRefreshLongRangeForecast}
      />
    </div>
  );
};

export default LocationDetailsContent;
