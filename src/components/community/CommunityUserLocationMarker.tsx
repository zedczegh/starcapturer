
import React from "react";
import UserLocationMarker from "@/components/photoPoints/map/components/UserLocationMarker";

interface CommunityUserLocationMarkerProps {
  position: [number, number];
  onLocationUpdate?: (lat: number, lng: number) => void;
  draggable?: boolean;
}

const CommunityUserLocationMarker = ({ position, onLocationUpdate, draggable = true }: CommunityUserLocationMarkerProps) => {
  // Pass null as currentSiqs to ensure the RealTimeSiqsProvider inside UserLocationMarker will calculate it
  return <UserLocationMarker position={position} onLocationUpdate={onLocationUpdate} draggable={draggable} />;
};

export default CommunityUserLocationMarker;
