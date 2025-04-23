
import React from "react";
import { UserLocationMarker } from "@/components/photoPoints/map/components/UserLocationMarker";

// Wrapper for correct typing and re-export
const CommunityUserLocationMarker = ({ position }: { position: [number, number] }) => {
  // Pass null for currentSiqs as we don't have real-time SIQS data in the community map context
  return <UserLocationMarker position={position} currentSiqs={null} />;
};

export default CommunityUserLocationMarker;
