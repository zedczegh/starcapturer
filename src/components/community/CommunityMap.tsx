
import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import CommunityMapMarker from "./CommunityMapMarker";
import { useUserGeolocation } from "@/hooks/community/useUserGeolocation";
import CommunityUserLocationMarker from "./CommunityUserLocationMarker";

interface CommunityMapProps {
  center: [number, number];
  locations: SharedAstroSpot[];
  hoveredLocationId?: string | null;
  onMarkerClick?: (spot: SharedAstroSpot) => void;
  isMobile?: boolean;
  zoom?: number;
}

const CommunityMap: React.FC<CommunityMapProps> = ({
  center,
  locations,
  hoveredLocationId,
  onMarkerClick,
  isMobile = false,
  zoom = 3
}) => {
  // Only render community NON-CERTIFIED spots, since the data is for contributed user spots.
  const userPosition = useUserGeolocation();

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", background: "#010e1a" }}
      worldCopyJump
      attributionControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        maxZoom={19}
      />
      {userPosition && (
        <CommunityUserLocationMarker position={userPosition} />
      )}
      {locations.map((spot) => (
        <CommunityMapMarker
          key={spot.id}
          spot={spot}
          isHovered={hoveredLocationId === spot.id}
          isMobile={isMobile}
          onMarkerClick={onMarkerClick}
        />
      ))}
    </MapContainer>
  );
};

export default CommunityMap;

