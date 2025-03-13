
import React from "react";
import LocationHeader from "@/components/location/LocationHeader";
import StatusMessage from "@/components/location/StatusMessage";
import LocationContent from "@/components/location/LocationContent";
import { useLocationDetails } from "@/hooks/useLocationDetails";

interface LocationDetailsContentProps {
  locationData: any;
  setLocationData: (data: any) => void;
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
}

const LocationDetailsContent: React.FC<LocationDetailsContentProps> = ({
  locationData,
  setLocationData,
  onLocationUpdate
}) => {
  const {
    forecastData,
    longRangeForecast,
    loading,
    forecastLoading,
    longRangeLoading,
    gettingUserLocation,
    statusMessage,
    setStatusMessage,
    setGettingUserLocation,
    handleRefreshAll,
    handleRefreshForecast,
    handleRefreshLongRangeForecast
  } = useLocationDetails(locationData, setLocationData);

  return (
    <main className="container mx-auto px-4 pt-28 pb-16">
      <StatusMessage 
        message={statusMessage} 
        onClear={() => setStatusMessage(null)} 
      />
      
      <LocationHeader 
        name={locationData.name}
        latitude={locationData.latitude}
        longitude={locationData.longitude}
        timestamp={locationData.timestamp}
        loading={loading}
        onRefresh={handleRefreshAll}
      />
      
      <LocationContent 
        locationData={locationData}
        forecastData={forecastData}
        longRangeForecast={longRangeForecast}
        forecastLoading={forecastLoading}
        longRangeLoading={longRangeLoading}
        gettingUserLocation={gettingUserLocation}
        onLocationUpdate={onLocationUpdate}
        setGettingUserLocation={setGettingUserLocation}
        setStatusMessage={setStatusMessage}
        onRefreshForecast={handleRefreshForecast}
        onRefreshLongRange={handleRefreshLongRangeForecast}
      />
    </main>
  );
};

export default LocationDetailsContent;
