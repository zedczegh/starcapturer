
import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import CommunityMapMarker from "./CommunityMapMarker";
import { useUserGeolocation } from "@/hooks/community/useUserGeolocation";
import CommunityUserLocationMarker from "./CommunityUserLocationMarker";
import MapClickHandler from "../location/map/MapClickHandler";

interface CommunityMapProps {
  center: [number, number];
  locations: SharedAstroSpot[];
  hoveredLocationId?: string | null;
  onMarkerClick?: (spot: SharedAstroSpot) => void;
  isMobile?: boolean;
  zoom?: number;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const CommunityMap: React.FC<CommunityMapProps> = ({
  center,
  locations,
  hoveredLocationId,
  onMarkerClick,
  isMobile = false,
  zoom = 3,
  onLocationUpdate
}) => {
  const userPosition = useUserGeolocation();

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%", background: "#010e1a" }}
      worldCopyJump
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        maxZoom={19}
      />
      {userPosition && (
        <CommunityUserLocationMarker position={userPosition} onLocationUpdate={onLocationUpdate} />
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
      {onLocationUpdate && <MapClickHandler onClick={onLocationUpdate} />}
    </MapContainer>
  );
};

export default CommunityMap;
