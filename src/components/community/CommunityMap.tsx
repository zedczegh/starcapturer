
import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import CommunityMapMarker from "./CommunityMapMarker";
import { useUserGeolocation } from "@/hooks/community/useUserGeolocation";
import CommunityUserLocationMarker from "./CommunityUserLocationMarker";

/**
 * Simple 2D Community Map rendering using only React - no Leaflet or OSM basemap.
 * Markers are shown with positional approximation: centered, with other markers
 * distributed radially around center.
 */
interface CommunityMapProps {
  center: [number, number];
  locations: SharedAstroSpot[];
  hoveredLocationId?: string | null;
  onMarkerClick?: (spot: SharedAstroSpot) => void;
  isMobile?: boolean;
  zoom?: number;
}

const MAP_RADIUS = 130; // px
const USER_MARKER_RADIUS = 12; // px
const COMMUNITY_MARKER_RADIUS = 11; // px

const getRelativePos = (
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number
) => {
  // Very simple polar plot — not geographically accurate!
  const dx = lng - centerLng;
  const dy = lat - centerLat;
  const rad = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  // Clamp radius in px for representation
  const pxRadius = Math.min(MAP_RADIUS, rad * 36 + 32);
  return {
    x: 50 + pxRadius * Math.cos(angle),
    y: 50 - pxRadius * Math.sin(angle)
  }; // as percentages
};

const CommunityMap: React.FC<CommunityMapProps> = ({
  center,
  locations,
  hoveredLocationId,
  onMarkerClick,
  isMobile = false,
  zoom = 3,
}) => {
  const userPosition = useUserGeolocation();

  // Calculate markers positions
  const markerPositions = locations.map((spot) =>
    getRelativePos(spot.latitude, spot.longitude, center[0], center[1])
  );

  return (
    <div className="relative w-full h-full min-h-[250px] flex items-center justify-center select-none">
      {/* Map background (gradient mimic like a cosmic map) */}
      <div
        className="absolute inset-0 rounded-xl z-0"
        style={{
          background: "radial-gradient(ellipse at center, #181a25 50%, #08264b 100%)",
        }}
      />
      {/* Render user position if available */}
      {userPosition && (
        <div
          title="Your Location"
          className="absolute z-10"
          style={{
            left: `calc(50% - ${USER_MARKER_RADIUS}px)`,
            top: `calc(50% - ${USER_MARKER_RADIUS}px)`,
            width: USER_MARKER_RADIUS * 2,
            height: USER_MARKER_RADIUS * 2,
            background: "linear-gradient(135deg, #17d2ff, #61a6fa)",
            borderRadius: "50%",
            boxShadow: "0 0 12px 2px #3ffcff55",
            border: "2px solid #fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <span className="block bg-white rounded-full w-[8px] h-[8px]" />
        </div>
      )}

      {/* Community spots: distribute in circle for visual distinction */}
      {locations.map((spot, idx) => {
        const pos = markerPositions[idx];
        return (
          <div
            key={spot.id}
            title={spot.name}
            className={`absolute z-10 transition-all duration-300 ease-out group`}
            style={{
              left: `calc(${pos.x}% - ${COMMUNITY_MARKER_RADIUS}px)`,
              top: `calc(${pos.y}% - ${COMMUNITY_MARKER_RADIUS}px)`,
              width: COMMUNITY_MARKER_RADIUS * 2,
              height: COMMUNITY_MARKER_RADIUS * 2,
              background: hoveredLocationId === spot.id
                ? "linear-gradient(135deg,#49c6ff,#8e7dff)"
                : "radial-gradient(circle,#51aed8 60%,#2d537c 120%)",
              border: hoveredLocationId === spot.id ? "2.5px solid #fff" : "2px solid #d3e3ffcc",
              filter: hoveredLocationId === spot.id ? "drop-shadow(0 0 4px #85eaffbb)" : "",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.17s cubic-bezier(.2,.5,.35,1.1)",
            }}
            onClick={() => onMarkerClick && onMarkerClick(spot)}
          >
            {/* Mimic a telescope marker inside */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5" stroke="#fff" strokeWidth="2" fill="none"/>
              <rect x="11" y="3" width="1.7" height="7" fill="#fff" rx="0.75" transform="rotate(40 9 9)" />
              <rect x="8.7" y="8" width="1" height="3" fill="#aafaff" rx="0.6" transform="rotate(-40 8 8)" />
            </svg>
          </div>
        );
      })}

      {/* Optional: Center "map" guide lines */}
      <svg className="absolute left-1/2 top-1/2 z-0 pointer-events-none" width="240" height="240" style={{transform:"translate(-50%, -50%)", opacity:0.10}} viewBox="0 0 240 240" fill="none">
        <circle cx="120" cy="120" r="110" stroke="#aafaff" strokeDasharray="3 7" strokeWidth="1.5"/>
        <circle cx="120" cy="120" r="60" stroke="#4a9eff" strokeDasharray="7 7" strokeWidth="1"/>
      </svg>
    </div>
  );
};

export default CommunityMap;
