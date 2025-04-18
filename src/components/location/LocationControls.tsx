
import React, { memo } from "react";
import { useLocationControls } from "@/hooks/location/useLocationControls";
import MapSelector from "@/components/MapSelector";
import LocationControlButton from "./LocationControlButton";

interface LocationControlsProps {
  onLocationUpdate: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
  gettingUserLocation: boolean;
  setGettingUserLocation: (state: boolean) => void;
  setStatusMessage: (message: string | null) => void;
  currentLocation?: { latitude: number; longitude: number; name: string } | null;
}

const LocationControls: React.FC<LocationControlsProps> = ({
  onLocationUpdate,
  gettingUserLocation,
  setGettingUserLocation,
  setStatusMessage,
  currentLocation
}) => {
  // Use the extracted hook for location control logic
  const {
    handleLocationSearch,
    handleGetCurrentLocation
  } = useLocationControls({
    onLocationUpdate,
    currentLocation
  });

  return (
    <div className="p-4 border-t border-cosmic-600/10 bg-cosmic-800/30 relative z-10">
      <LocationControlButton 
        gettingUserLocation={gettingUserLocation}
        onClick={handleGetCurrentLocation}
      />
      <div className="relative z-30">
        <MapSelector onSelectLocation={handleLocationSearch} />
      </div>
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(LocationControls);
