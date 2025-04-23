
import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useNavigate } from "react-router-dom";

// Community spot marker color: blue telescope with white border
function createCommunityMarkerIcon(isHovered: boolean, isMobile: boolean): L.DivIcon {
  const size = isMobile ? (isHovered ? 28 : 20) : (isHovered ? 32 : 26);
  return L.divIcon({
    className: "community-marker",
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    html: `
        <div style="
            width:${size}px;
            height:${size}px;
            background:rgba(30,174,219,0.93);
            border-radius:50%;
            border:2px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,0.20);
            display:flex;
            justify-content:center;
            align-items:center;
            transition:box-shadow .2s;
        ">
          <svg width="${size*0.55}" height="${size*0.55}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm1.31-2.18L13.72 6.3c-.21-.59-.87-.89-1.46-.68l-2.45.88c-.59.21-.9.86-.69 1.45l3.65 10.13M2 20l5.44-2.16"/>
          </svg>
        </div>
      `
  });
}

type CommunityMapMarkerProps = {
  spot: SharedAstroSpot;
  isHovered: boolean;
  isMobile: boolean;
  onMarkerClick?: (spot: SharedAstroSpot) => void;
};

const CommunityMapMarker: React.FC<CommunityMapMarkerProps> = ({
  spot,
  isHovered,
  isMobile,
  onMarkerClick,
}) => {
  const navigate = useNavigate();

  const icon = createCommunityMarkerIcon(isHovered, isMobile);

  const handleClick = () => {
    if (onMarkerClick) {
      onMarkerClick(spot);
    } else {
      navigate(`/astro-spot/${spot.id}`, { state: { from: "community" } });
    }
  };

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={icon}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <div>
          <strong>{spot.name}</strong>
          <br />
          {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
        </div>
      </Popup>
    </Marker>
  );
};

export default CommunityMapMarker;

