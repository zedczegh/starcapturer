
import React, { Suspense } from "react";
import NavBar from "@/components/NavBar";
import LocationError from "@/components/location/LocationError";
import PageLoader from "@/components/loaders/PageLoader";
const LocationErrorSection = ({ onUseCurrentLocation, isLoading }) => (
  <>
    <NavBar />
    <Suspense fallback={<PageLoader />}>
      <LocationError 
        onUseCurrentLocation={onUseCurrentLocation} 
        isLoading={isLoading}
        autoLocate={true}
      />
    </Suspense>
  </>
);
export default LocationErrorSection;
