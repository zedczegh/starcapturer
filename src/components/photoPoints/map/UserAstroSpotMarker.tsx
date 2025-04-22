
import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Telescope, Circle } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useNavigate } from "react-router-dom";

interface UserAstroSpotMarkerProps {
  spot: SharedAstroSpot;
}

function createTelescopeCircleIcon() {
  // SVG with Lucide's telescope in a light blue circle w/ background shadow
  const size = 38;
  const circleColor = "#60B4F5";
  return L.divIcon({
    className: "user-astrospot-marker",
    html: `
      <div style="
        background: ${circleColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(96,180,245,0.2);
        border: 2px solid #fff;
        position: relative;">
        <svg xmlns="http://www.w3.org/2000/svg"
          width="24" height="24" viewBox="0 0 24 24"
          fill="none" stroke="#2283d6" stroke-width="2" 
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="11" fill="#eaf6ff"/>
          <path d="M8 21l5-10M17 6l-8.5 8.5" />
          <path d="M17 6c1.38 0 2.5-1.12 2.5-2.5S18.38 1 17 1s-2.5 1.12-2.5 2.5S15.62 6 17 6z" />
          <path d="M13 10l2 2" />
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const UserAstroSpotMarker: React.FC<UserAstroSpotMarkerProps> = ({ spot }) => {
  const navigate = useNavigate();

  // Defensive: Only render with valid coordinates
  if (typeof spot.latitude !== "number" || typeof spot.longitude !== "number") {
    return null;
  }

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={createTelescopeCircleIcon()}
      // Fix: Use the correct event handler format for react-leaflet
      eventHandlers={{
        click: () => {}
      }}
    >
      <Popup>
        <div className="p-2">
          <div className="flex items-center mb-2">
            {/* Show Lucide icon inline */}
            <span className="mr-2 inline-block text-sky-600">
              {/* telescope icon */}
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2283d6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="11" fill="#eaf6ff"/>
                <path d="M8 21l5-10M17 6l-8.5 8.5" />
                <path d="M17 6c1.38 0 2.5-1.12 2.5-2.5S18.38 1 17 1s-2.5 1.12-2.5 2.5S15.62 6 17 6z" />
                <path d="M13 10l2 2" />
              </svg>
            </span>
            <span className="font-semibold">{spot.name || "User Astro Spot"}</span>
          </div>
          <div>
            <button
              className="inline-flex items-center text-primary underline text-sm px-2 py-1 rounded hover:bg-primary/10 transition"
              onClick={() => {
                navigate(`/astrospot/${spot.id}`);
              }}
            >
              View Spot Profile
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default React.memo(UserAstroSpotMarker);
