
import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { Telescope } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";

// Helper to create a blue-telescope-in-circle icon
function createTelescopeMarkerIcon() {
  // SVG string for circle+light blue telescope
  const svg = `
    <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" fill="#e0f2fe" stroke="#38bdf8" stroke-width="4"/>
      <g transform="translate(8,7)">
        <path d="M18 26.5L23 34M30 8.5L18.5 26.5" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
        <path d="M13 28L10 35M23 16L13 28" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
        <circle cx="29" cy="8" r="2" fill="#38bdf8"/>
        <circle cx="19" cy="26" r="2" fill="#38bdf8"/>
        <circle cx="13" cy="28" r="2" fill="#38bdf8"/>
        <circle cx="23" cy="34" r="2" fill="#38bdf8"/>
        <circle cx="10" cy="35" r="2" fill="#38bdf8"/>
      </g>
    </svg>
  `.trim();

  return new L.DivIcon({
    className: "",
    html: svg,
    iconSize: [42, 42],
    iconAnchor: [21, 40], // bottom center
    popupAnchor: [0, -32],
  });
}

interface UserAstroSpotMarkerProps {
  spot: SharedAstroSpot;
  onClick?: (spot: SharedAstroSpot) => void;
}

const UserAstroSpotMarker: React.FC<UserAstroSpotMarkerProps> = ({ spot, onClick }) => {
  const { t } = useLanguage();
  const markerIcon = React.useMemo(() => createTelescopeMarkerIcon(), []);
  // Use a static link to the profile of this user AstroSpot
  const profileUrl = `/my-astrospots/${spot.id}`;

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={markerIcon}
      eventHandlers={{
        click: () => onClick?.(spot),
      }}
    >
      <Popup>
        <div className="flex flex-col items-center gap-2 min-w-[180px]">
          <Telescope className="h-6 w-6 text-sky-400 mb-1" />
          <div className="text-base font-semibold text-gray-900">{spot.name}</div>
          <div className="text-xs text-gray-600 mb-2">
            {t("User AstroSpot", "用户观星点")}
          </div>
          <Link
            to={`/manage-astro-spots/${spot.id}`}
            className="block w-full px-3 py-1 text-sm text-center rounded bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium transition"
          >
            {t("View Location Profile", "查看位置资料")}
          </Link>
        </div>
      </Popup>
    </Marker>
  );
};

export default React.memo(UserAstroSpotMarker);
