
import React from "react";
import { UserLocationMarker } from "@/components/photoPoints/map/components/UserLocationMarker";

// Wrapper for correct typing and re-export
const CommunityUserLocationMarker = ({ position }: { position: [number, number] }) => {
  return <UserLocationMarker position={position} />;
};

export default CommunityUserLocationMarker;
