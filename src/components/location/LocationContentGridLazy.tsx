
import React, { lazy } from "react";

const LocationContentGrid = lazy(() => import("./LocationContentGrid"));

interface LocationContentGridLazyProps {
  locationData: any;
  forecastData: any;
  longRangeForecast: any;
  forecastLoading: boolean;
  longRangeLoading: boolean;
  gettingUserLocation: boolean;
  onLocationUpdate: (location: any) => Promise<void>;
  setGettingUserLocation: React.Dispatch<React.SetStateAction<boolean>>;
  setStatusMessage: React.Dispatch<React.SetStateAction<string | null>>;
  onRefreshForecast: () => void;
  onRefreshLongRange: () => void;
  isMobile: boolean;
}

const LocationContentGridLazy: React.FC<LocationContentGridLazyProps> = (props) => {
  // Just forwarding props to LocationContentGrid
  return <LocationContentGrid {...props} />;
};

export default LocationContentGridLazy;

