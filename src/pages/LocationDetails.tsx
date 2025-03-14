
import React, { useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import LocationError from "@/components/location/LocationError";
import LocationDetailsViewport from "@/components/location/LocationDetailsViewport";
import { useLocationDataManager } from "@/hooks/location/useLocationDataManager";

const LocationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    locationData, 
    setLocationData, 
    statusMessage, 
    messageType, 
    setStatusMessage,
    handleUpdateLocation,
    isLoading
  } = useLocationDataManager({ id, initialState: location.state, navigate });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!locationData) {
    return <LocationError />;
  }

  return (
    <LocationDetailsViewport 
      locationData={locationData}
      setLocationData={setLocationData}
      statusMessage={statusMessage}
      messageType={messageType}
      setStatusMessage={setStatusMessage}
      handleUpdateLocation={handleUpdateLocation}
    />
  );
};

export default LocationDetails;
