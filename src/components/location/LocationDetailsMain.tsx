
import React, { useEffect, useState } from "react";
import LocationHeader from "./LocationHeader";
import { useLocationDetails } from "@/hooks/useLocationDetails";
import LocationDetailsContent from "./LocationDetailsContent";
import { Helmet } from "react-helmet-async";
import { useEnhancedLocation } from "@/hooks/useEnhancedLocation";
import { useLanguage } from "@/contexts/LanguageContext";

interface LocationDetailsMainProps {
  locationData: any;
  setLocationData: (data: any) => void;
  statusMessage: string | null;
  messageType?: "success" | "error" | "warning" | "info";
  setStatusMessage: (message: string | null) => void;
  handleUpdateLocation?: () => void;
}

const LocationDetailsMain: React.FC<LocationDetailsMainProps> = ({
  locationData,
  setLocationData,
  statusMessage,
  messageType = "info",
  setStatusMessage,
  handleUpdateLocation,
}) => {
  const [initialized, setInitialized] = useState(false);
  const { language } = useLanguage();
  
  // Use enhanced location hook to get detailed location information
  const { locationDetails, loading: enhancedLocationLoading } = useEnhancedLocation({
    latitude: locationData?.latitude,
    longitude: locationData?.longitude,
    skip: false // Always try to get enhanced location details
  });
  
  // Get location details
  const {
    forecastData,
    longRangeForecast,
    loading,
    forecastLoading,
    longRangeLoading,
    handleRefreshAll,
    handleRefreshForecast,
    handleRefreshLongRangeForecast,
    weatherAlerts
  } = useLocationDetails(locationData, setLocationData);

  // Update location name with enhanced details if available
  useEffect(() => {
    if (locationDetails && !enhancedLocationLoading && locationData) {
      // Only update if we have more detailed information and current name is not detailed
      const currentName = locationData.formattedName || '';
      const enhancedName = locationDetails.formattedName || locationDetails.detailedName;
      
      const isCurrentNameGeneral = currentName.includes(',') && currentName.split(',').length <= 2;
      const isCurrentNameCoordinates = currentName.includes('°') || 
                                      currentName.includes('Location at') ||
                                      currentName.includes('Remote area');
                                      
      const isEnhancedNameDetailed = enhancedName && 
                                    !enhancedName.includes('°') &&
                                    !enhancedName.includes('Location at') &&
                                    !enhancedName.includes('Remote area') &&
                                    (enhancedName.includes(',') || locationDetails.streetName);
                                    
      if (isEnhancedNameDetailed && (isCurrentNameGeneral || isCurrentNameCoordinates)) {
        console.log("Applying enhanced location name from useEnhancedLocation:", enhancedName);
        setLocationData({
          ...locationData,
          formattedName: enhancedName,
          streetName: locationDetails.streetName,
          townName: locationDetails.townName,
          cityName: locationDetails.cityName,
          countyName: locationDetails.countyName,
          stateName: locationDetails.stateName
        });
      }
    }
  }, [locationDetails, enhancedLocationLoading, locationData, setLocationData]);

  // Force refresh on initial load
  useEffect(() => {
    if (locationData && !initialized) {
      handleRefreshAll();
      setInitialized(true);
    }
  }, [locationData, handleRefreshAll, initialized]);

  // Get the page title
  const pageTitle = locationData?.formattedName
    ? `${locationData.formattedName} | ${language === 'en' ? 'Location Details' : '位置详情'}`
    : language === 'en' ? 'Location Details' : '位置详情';

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <LocationHeader
        name={locationData?.formattedName || locationData?.name || ''}
        latitude={locationData?.latitude || 0}
        longitude={locationData?.longitude || 0}
        timestamp={locationData?.timestamp ? new Date(locationData.timestamp).getTime() : undefined}
        loading={loading}
        statusMessage={statusMessage}
        messageType={messageType}
        setStatusMessage={setStatusMessage}
        handleUpdateLocation={handleUpdateLocation}
        locationData={locationData}
        bortleScale={locationData?.bortleScale}
        siqs={locationData?.siqsResult?.score}
      />
      <LocationDetailsContent
        locationData={locationData}
        setLocationData={setLocationData}
        forecastData={forecastData}
        longRangeForecast={longRangeForecast}
        loading={loading}
        forecastLoading={forecastLoading}
        longRangeLoading={longRangeLoading}
        onRefreshForecast={() =>
          handleRefreshForecast(locationData.latitude, locationData.longitude)
        }
        onRefreshLongRange={() =>
          handleRefreshLongRangeForecast(
            locationData.latitude,
            locationData.longitude
          )
        }
        onRefreshAll={handleRefreshAll}
        weatherAlerts={weatherAlerts}
        onLocationUpdate={async (loc) => {
          if (handleUpdateLocation) {
            handleUpdateLocation();
          }
          return Promise.resolve();
        }}
      />
    </div>
  );
};

export default LocationDetailsMain;
