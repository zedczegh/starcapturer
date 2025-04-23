
import React from "react";
import { UserLocationMarker } from "@/components/photoPoints/map/components/UserLocationMarker";

interface CommunityUserLocationMarkerProps {
  position: [number, number];
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const CommunityUserLocationMarker = ({ position, onLocationUpdate }: CommunityUserLocationMarkerProps) => {
  // Pass null as currentSiqs to ensure the RealTimeSiqsProvider inside UserLocationMarker will calculate it
  return <UserLocationMarker position={position} onLocationUpdate={onLocationUpdate} />;
};

export default CommunityUserLocationMarker;
