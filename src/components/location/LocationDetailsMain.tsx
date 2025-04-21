
import React, { Suspense } from "react";
import NavBar from "@/components/NavBar";
import PageLoader from "@/components/loaders/PageLoader";
import LocationDetailsViewport from "@/components/location/LocationDetailsViewport";

const LocationDetailsMain = ({
  locationData,
  setLocationData,
  statusMessage,
  messageType,
  setStatusMessage,
  handleUpdateLocation,
}) => (
  <>
    <NavBar />
    <Suspense fallback={<PageLoader />}>
      <LocationDetailsViewport 
        locationData={locationData}
        setLocationData={setLocationData}
        statusMessage={statusMessage}
        messageType={messageType}
        setStatusMessage={setStatusMessage}
        handleUpdateLocation={handleUpdateLocation}
      />
    </Suspense>
  </>
);

export default LocationDetailsMain;
