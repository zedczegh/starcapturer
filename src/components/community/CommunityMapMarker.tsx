
import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useNavigate } from "react-router-dom";
import TakahashiMarkerSVG from "./TakahashiMarkerSVG";

function createCommunityMarkerIcon(isHovered: boolean, isMobile: boolean): L.DivIcon {
  // Larger marker: size 48 looks better since popup/interactive
  const size = isMobile ? (isHovered ? 64 : 48) : (isHovered ? 72 : 54);

  // Inline SVG using the Observatory Dome style
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 54 54" fill="none">
      <ellipse cx="27" cy="49" rx="17" ry="5.5" fill="#000" opacity="0.13"/>
      <ellipse cx="27" cy="28" rx="21" ry="18" fill="#fff" stroke="#d0e4f5" stroke-width="2.2"/>
      <path d="M48 28 a21 18 0 0 1 -21 18 a21 18 0 0 0 21 -18 Z" fill="#d0e4f5" opacity="0.43"/>
      <rect x="22.4" y="10" width="7.25" height="25" rx="3.5" fill="#b9c4dd" stroke="#7b8593" stroke-width="1.2"/>
      <rect x="25.47" y="10" width="1.1" height="25" rx="0.6" fill="#7b8593" opacity="0.36"/>
      <rect x="28" y="15" width="3.8" height="15" rx="1.7" fill="#3b4f6e" stroke="#a7d4f7" stroke-width="0.75" transform="rotate(28 30 22.5)"/>
      <ellipse cx="34.8" cy="22.4" rx="2.2" ry="1.6" fill="#a7d4f7" opacity="0.79" transform="rotate(28 34.8 22.4)"/>
      <ellipse cx="27" cy="44.5" rx="15" ry="3.9" fill="#9aa5b9" opacity="0.57"/>
      <ellipse cx="27" cy="44.5" rx="12" ry="2.3" fill="#19a2d6" opacity="0.18"/>
      <ellipse cx="27" cy="28" rx="21" ry="18" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.96"/>
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
