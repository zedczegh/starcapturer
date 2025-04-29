
import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { SharedAstroSpot } from "@/types/weather";
import { LocationMarker, UserLocationMarker } from "../MarkerComponents";
import { MapEffectsComposer } from "./MapEffectsComposer";
import SearchRadiusCircles from "./SearchRadiusCircles";

interface MapContentProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  displayLocations: SharedAstroSpot[];
  isMobile: boolean;
  activeView: "certified" | "calculated";
  searchRadius: number;
  showRadiusCircles: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  useMobileMapFixer?: boolean;
  mapRef: React.MutableRefObject<any>;
  onMapReady?: () => void;
  currentSiqs?: number | null;
  isForecastMode?: boolean;
  selectedForecastDay?: number;
}

// Map event handler component
const MapEvents = ({ onClick }: { onClick: (e: any) => void }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    map.on("click", onClick);

    return () => {
      map.off("click", onClick);
    };
  }, [map, onClick]);

  return null;
};

const MapContent: React.FC<MapContentProps> = ({
  center,
  zoom,
  userLocation,
  displayLocations,
  isMobile,
  activeView,
  searchRadius,
  showRadiusCircles,
  onMapClick,
  onLocationClick,
  hoveredLocationId,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  useMobileMapFixer = false,
  mapRef,
  onMapReady,
  currentSiqs = null,
  isForecastMode = false,
  selectedForecastDay = 0,
}) => {
  // Reference to track if map is initialized
  const isInitialized = useRef(false);

  // Handler for map click events
  const handleMapClick = (e: any) => {
    if (onMapClick) {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    }
  };

  // Initialize map when ready
  const handleMapInit = (map: any) => {
    if (mapRef) {
      mapRef.current = map;
    }

    if (!isInitialized.current && onMapReady) {
      setTimeout(() => {
        onMapReady();
        isInitialized.current = true;
      }, 100);
    }
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      whenReady={handleMapInit}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ZoomControl position="bottomright" />

      {onMapClick && <MapEvents onClick={handleMapClick} />}

      {/* Custom map effects like animations or additional visuals */}
      <MapEffectsComposer
        showRadiusCircles={showRadiusCircles}
        userLocation={userLocation}
        activeView={activeView}
        isForecastMode={isForecastMode}
        onMapClick={handleMapClick}
      />

      {/* Search radius circles around user location */}
      {showRadiusCircles && userLocation && (
        <SearchRadiusCircles
          userLocation={userLocation}
          searchRadius={searchRadius}
          activeView={activeView}
          isForecastMode={isForecastMode}
        />
      )}

      {/* User location marker */}
      {userLocation && (
        <UserLocationMarker
          position={[userLocation.latitude, userLocation.longitude]}
          currentSiqs={currentSiqs}
        />
      )}

      {/* Location markers for all displayed locations */}
      {displayLocations.map((loc) => {
        // Skip locations without valid coordinates
        if (!loc.latitude || !loc.longitude) return null;

        const locationId = loc.id || `loc-${loc.latitude}-${loc.longitude}`;

        return (
          <LocationMarker
            key={locationId}
            location={{...loc, timestamp: loc.timestamp || new Date().toISOString()}}
            onClick={onLocationClick}
            isHovered={hoveredLocationId === locationId}
            onHover={onMarkerHover}
            locationId={locationId}
            isCertified={Boolean(loc.certification || loc.isDarkSkyReserve)}
            activeView={activeView}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
            handleTouchMove={handleTouchMove}
            isForecast={isForecastMode || loc.isForecast}
          />
        );
      })}
    </MapContainer>
  );
};

export default MapContent;
