
import React from "react";
import { UserLocationMarker } from "@/components/photoPoints/map/components/UserLocationMarker";

interface CommunityUserLocationMarkerProps {
  position: [number, number];
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const CommunityUserLocationMarker = ({ position, onLocationUpdate }: CommunityUserLocationMarkerProps) => {
  return <UserLocationMarker position={position} currentSiqs={null} onLocationUpdate={onLocationUpdate} />;
};

export default CommunityUserLocationMarker;
