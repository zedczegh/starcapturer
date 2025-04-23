
import React from "react";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useNavigate } from "react-router-dom";

// Helper to create the blue telescope icon as a circle SVG
const getTelescopeIcon = (size: number = 26) => {
  // Blue circle, white simple telescope SVG
  return L.divIcon({
    className: "community-telescope-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div 
        style="
          background-color: #0EA5E9;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 6px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg"
          width="${size * 0.63}"
          height="${size * 0.63}"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 15c0 4.4 1.1 6 2.7 6 2.8 0 3.3-4.1 3.3-6h0c0-1.9-.5-6-3.3-6C4.1 9 3 10.6 3 15Zm15 0c0 4.4 1.1 6 2.7 6 2.8 0 3.3-4.1 3.3-6h0c0-1.9-.5-6-3.3-6-1.6 0-2.7 1.6-2.7 6Zm-7.5 4.8a.7.7 0 0 1 .7.7v1.5a.7.7 0 0 1-.7.7H6.3a.7.7 0 0 1-.7-.7v-1.5a.7.7 0 0 1 .7-.7Zm10 0a.7.7 0 0 1 .7.7v1.5a.7.7 0 0 1-.7.7h-3.3a.7.7 0 0 1-.7-.7v-1.5a.7.7 0 0 1 .7-.7ZM16.5 4.2l-1-1.7a1.5 1.5 0 0 0-2.1-.5l-1 .5a1.5 1.5 0 0 1-2.1-.5l-1-1.7m6.2 4.2h-3a2 2 0 0 0-2 2v2"/>
        </svg>
      </div>
    `
  });
};

interface CommunityMapMarkerProps {
  spot: SharedAstroSpot;
}

const CommunityMapMarker: React.FC<CommunityMapMarkerProps> = ({ spot }) => {
  const icon = React.useMemo(() => getTelescopeIcon(), []);
  const navigate = useNavigate();

  if (
    !spot.latitude ||
    !spot.longitude ||
    !isFinite(spot.latitude) ||
    !isFinite(spot.longitude)
  ) {
    return null;
  }

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => navigate(`/astro-spot/${spot.id}`, { state: { from: "community" } }),
      }}
    >
      <Popup autoPan>
        <div className="font-medium text-sm mb-1.5">{spot.name ?? "Unnamed spot"}</div>
        <button
          className="inline-flex items-center px-2.5 py-1 rounded bg-primary text-white text-xs mt-2"
          onClick={e => {
            e.stopPropagation();
            navigate(`/astro-spot/${spot.id}`, { state: { from: "community" } });
          }}
        >
          View Details
        </button>
      </Popup>
    </Marker>
  );
};

export default React.memo(CommunityMapMarker);

