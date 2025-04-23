
import React from "react";
import { Marker, Popup } from "react-leaflet";
import { Telescope } from "lucide-react";
import L from "leaflet";
import CommunityAstroSpotPopup from "./CommunityAstroSpotPopup";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

function createTelescopeIcon() {
  return L.divIcon({
    html: `
      <div class="flex flex-col items-center">
        <span style="background: linear-gradient(90deg,#9b87f5,#1EAEDB); border-radius:50%;padding:7.5px 8px;display:inline-flex">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" style="display: block">
            <g>
              <path d="M20.41 14.89 21 14.16l-4.6-4.13-.98.77zM8.09 3.72l4.12 4.84-5.95 4.75-2.91-6.84zM14.3 9.42l6.06 6.09a.77.77 0 0 1-.07 1.07l-1.12.97a.77.77 0 0 1-1.07-.07l-6.06-6.09z" fill="#fff"/>
            </g>
          </svg>
        </span>
        <span style="display:block;height:8px;width:2.5px;background:#9b87f5;margin:0 auto;border-radius:1px;margin-top:1px"></span>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 36],
    popupAnchor: [0, -32],
    className: "community-telescope-marker",
  });
}

interface CommunityAstroSpotMarkerProps {
  spot: SharedAstroSpot & { username?: string };
  onProfile: (spot: SharedAstroSpot & { username?: string }) => void;
}

const CommunityAstroSpotMarker: React.FC<CommunityAstroSpotMarkerProps> = ({ spot, onProfile }) => {
  if (!spot.latitude || !spot.longitude) return null;

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={createTelescopeIcon()}
    >
      <CommunityAstroSpotPopup spot={spot} onProfile={onProfile} />
    </Marker>
  );
};

export default CommunityAstroSpotMarker;
