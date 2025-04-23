import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useNavigate } from "react-router-dom";
import TakahashiMarkerSVG from "./TakahashiMarkerSVG";

function createCommunityMarkerIcon(isHovered: boolean, isMobile: boolean): L.DivIcon {
  const size = isMobile ? (isHovered ? 28 : 20) : (isHovered ? 32 : 26);

  // Use React's renderToStaticMarkup to embed SVG as HTML string for Leaflet
  // Import here (otherwise need to install react-dom/server, but we keep it explicit for SSR)
  // But for simplicity -- just inline the SVG here as a string (from the TakahashiMarkerSVG above),
  // as Leaflet expects an HTML string and doesn't interpret JSX.
  // So, we duplicate a little for the marker icon.
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 42 42" fill="none">
      <g>
        <rect x="15.1" y="31" width="2.5" height="8" rx="1.15" fill="#8E9196"/>
        <rect x="24.4" y="31" width="2.5" height="8" rx="1.15" fill="#8E9196"/>
        <rect x="19.8" y="32" width="2.5" height="7.3" rx="1.15" fill="#8E9196" transform="rotate(-10 20.8 35.65)"/>
        <rect x="9.5" y="19" width="23" height="7" rx="3.5" fill="#fff" stroke="#d6edf6" stroke-width="1"/>
        <rect x="9.5" y="19" width="3.1" height="7" rx="1.55" fill="#19a2d6" opacity="0.89"/>
        <rect x="5" y="19.8" width="5" height="5.4" rx="2.3" fill="#222"/>
        <rect x="32.5" y="21" width="5" height="3.1" rx="1.6" fill="#2d81a8"/>
        <ellipse cx="38.2" cy="22.8" rx="1.4" ry="1.75" fill="#222" opacity="0.67"/>
        <rect x="9.5" y="19" width="23" height="7" rx="3.5" fill="none" stroke="#fff" stroke-width="1.6"/>
        <ellipse cx="21.3" cy="27.6" rx="12" ry="2.5" fill="#000" opacity="0.12"/>
      </g>
    </svg>
  `;

  return L.divIcon({
    className: "community-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
            width:${size}px;
            height:${size}px;
            border-radius:50%;
            background:rgba(30,174,219,0.93);
            display:flex;
            align-items:center;
            justify-content:center;
            border:2px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,0.20);
        ">
        ${svg}
      </div>
    `,
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
      onClick={handleClick}
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
