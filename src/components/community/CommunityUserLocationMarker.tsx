
import React from "react";
import UserLocationMarker from "@/components/photoPoints/map/components/UserLocationMarker";

interface CommunityUserLocationMarkerProps {
  position: [number, number];
  onLocationUpdate?: (lat: number, lng: number) => void;
  draggable?: boolean;
}

const CommunityUserLocationMarker = ({ position, onLocationUpdate, draggable = true }: CommunityUserLocationMarkerProps) => {
  console.log("CommunityUserLocationMarker render:", { position, draggable, hasOnLocationUpdate: !!onLocationUpdate });
  
  return (
    <UserLocationMarker 
      position={position}
      currentSiqs={null}
      onLocationUpdate={onLocationUpdate}
      draggable={draggable}
    />
  );
};

export default CommunityUserLocationMarker;
