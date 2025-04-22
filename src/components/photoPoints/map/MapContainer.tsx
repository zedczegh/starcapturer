
import React, { useEffect, useState } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import LazyMapContainer from "./LazyMapContainer";
import { fetchUserAstroSpots } from "./MapUtils";
import UserAstroSpotMarker from "./UserAstroSpotMarker";

interface MapContainerProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMapReady?: () => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  zoom?: number;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  isMobile?: boolean;
  useMobileMapFixer?: boolean;
  showRadiusCircles?: boolean;
}

const MapContainer: React.FC<MapContainerProps> = ({
  center,
  userLocation,
  locations,
  searchRadius,
  activeView,
  onMapReady,
  onLocationClick,
  onMapClick,
  zoom,
  hoveredLocationId,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  isMobile,
  useMobileMapFixer,
  showRadiusCircles
}) => {
  const [userSpots, setUserSpots] = useState<SharedAstroSpot[]>([]);

  useEffect(() => {
    fetchUserAstroSpots().then(setUserSpots);
  }, []);

  return (
    <LazyMapContainer
      center={center}
      userLocation={userLocation}
      locations={locations}
      searchRadius={searchRadius}
      activeView={activeView}
      onMapReady={onMapReady}
      onLocationClick={onLocationClick}
      onMapClick={onMapClick}
      zoom={zoom}
      hoveredLocationId={hoveredLocationId}
      onMarkerHover={onMarkerHover}
      handleTouchStart={handleTouchStart}
      handleTouchEnd={handleTouchEnd}
      handleTouchMove={handleTouchMove}
      isMobile={isMobile}
      useMobileMapFixer={useMobileMapFixer}
      showRadiusCircles={showRadiusCircles}
    >
      {/* Render user astro spot markers as overlays */}
      {userSpots.map((spot) => (
        <UserAstroSpotMarker key={spot.id} spot={spot} />
      ))}
    </LazyMapContainer>
  );
};

export default MapContainer;
