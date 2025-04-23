
import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useNavigate } from "react-router-dom";
import TakahashiMarkerSVG from "./TakahashiMarkerSVG";

// Helper to convert SVG to HTML string
function svgToString(isHovered: boolean, isMobile: boolean) {
  // Make the marker much larger, and slightly larger when hovered!
  const size = isMobile ? (isHovered ? 56 : 44) : (isHovered ? 64 : 52);
  // Use the same markup as in TakahashiMarkerSVG, but as a string for Leaflet
  // We'll copy the SVG here as a string, adjusting width/height
  // (If you want perfect DRY, use renderToStaticMarkup, but that requires react-dom/server)
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 58 58" fill="none">
      <rect x="13" y="41" width="5.5" height="16" rx="2.5" fill="#8E9196" />
      <rect x="40" y="41" width="5.5" height="16" rx="2.5" fill="#8E9196" />
      <rect x="24.5" y="43" width="7" height="15" rx="2.7" fill="#585b60" transform="rotate(-4 28 50.5)"/>
      <ellipse cx="29" cy="44" rx="10" ry="4.2" fill="#dfdfeb" stroke="#788093" stroke-width="1.1" opacity="0.89"/>
      <rect x="26.4" y="21.5" width="5.2" height="24" rx="2.2" fill="#B9BEC9" transform="rotate(-21 29 33.5)" opacity="0.92"/>
      <ellipse cx="25.7" cy="37" rx="2.1" ry="2.7" fill="#44464d" opacity="0.77" transform="rotate(-19 26 37)"/>
      <rect x="6" y="16" width="33" height="10.3" rx="5.2" fill="#fff" stroke="#cce3ef" stroke-width="1" />
      <rect x="6" y="16" width="4.4" height="10.3" rx="2.2" fill="#19a2d6" opacity="0.93"/>
      <rect x="0.5" y="17.2" width="8.2" height="8" rx="3.2" fill="#222"/>
      <rect x="34.2" y="18.2" width="8.9" height="7" rx="2.8" fill="#236993"/>
      <ellipse cx="45.5" cy="21.9" rx="2.1" ry="2.9" fill="#222" opacity="0.72"/>
      <rect x="6" y="16" width="33" height="10.3" rx="5.2" fill="none" stroke="#fff" stroke-width="2"/>
      <ellipse cx="29" cy="44" rx="3.9" ry="1.4" fill="#222638" opacity="0.38"/>
      <ellipse cx="29" cy="57" rx="16" ry="3.1" fill="#000" opacity="0.18"/>
    </svg>
  `;
}

function createCommunityMarkerIcon(isHovered: boolean, isMobile: boolean): L.DivIcon {
  const size = isMobile ? (isHovered ? 56 : 44) : (isHovered ? 64 : 52);

  const svg = svgToString(isHovered, isMobile);

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
            border:2.5px solid #fff;
            box-shadow:0 4px 14px rgba(0,0,0,0.22);
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
      eventHandlers={{
        click: handleClick,
      }}
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
