
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
  
  // Get forecast data
  const {
    forecastData,
    longRangeForecast,
    forecastLoading,
    longRangeLoading,
    gettingUserLocation,
    setGettingUserLocation,
    onRefreshForecast,
    onRefreshLongRange
  } = useForecastData(locationData);
  
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
  
  return (
    <div className="space-y-6">
      <LocationMap
        latitude={locationData.latitude || 0}
        longitude={locationData.longitude || 0}
        name={locationData.name || t("Unknown Location", "未知位置")}
        onLocationUpdate={onLocationUpdate}
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
        onRefreshForecast={onRefreshForecast}
        onRefreshLongRange={onRefreshLongRange}
      />
    </div>
  );
};

export default LocationDetailsContent;
