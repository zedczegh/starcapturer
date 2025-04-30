
import React from "react";
import { TileLayer, Circle, useMap } from "react-leaflet";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { LocationMarker, ForecastMarker, UserLocationMarker } from "../MarkerComponents";

interface MapContentProps {
  center: [number, number];
  zoom: number;
  locations: SharedAstroSpot[];
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMarkerClick: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  selectedLocationId?: string | null;
  isMobile: boolean;
  forecastLocations?: SharedAstroSpot[];
  showForecast?: boolean;
}

// Helper to divide locations into certified and regular
const separateLocations = (locations: SharedAstroSpot[]) => {
  const certified: SharedAstroSpot[] = [];
  const regular: SharedAstroSpot[] = [];
  
  locations.forEach(location => {
    if (location.isDarkSkyReserve || location.certification) {
      certified.push(location);
    } else {
      regular.push(location);
    }
  });
  
  return { certified, regular };
};

const MapContent: React.FC<MapContentProps> = ({
  center,
  zoom,
  locations,
  userLocation,
  searchRadius,
  activeView,
  onMarkerClick,
  onMapClick,
  selectedLocationId,
  isMobile,
  forecastLocations = [],
  showForecast = false
}) => {
  const map = useMap();
  const { certified, regular } = separateLocations(locations);
  
  console.log(`Processing locations - activeView: ${activeView}, certified: ${certified.length}, regular: ${regular.length}`);
  
  // Handle map clicks
  React.useEffect(() => {
    if (!onMapClick) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  // Center map when location changes
  React.useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  // Memoize markers to prevent unnecessary re-renders
  const regularMarkers = React.useMemo(() => {
    return regular.map((location) => {
      const isActive = selectedLocationId === location.id;
      const handleMarkerClick = () => {
        onMarkerClick(location);
      };
      
      return (
        <LocationMarker
          key={`reg-${location.id || `${location.latitude}-${location.longitude}`}`}
          location={location}
          isActive={isActive}
          onClick={handleMarkerClick}
        />
      );
    });
  }, [regular, selectedLocationId, onMarkerClick]);
  
  const certifiedMarkers = React.useMemo(() => {
    return certified.map((location) => {
      const isActive = selectedLocationId === location.id;
      const handleMarkerClick = () => {
        onMarkerClick(location);
      };
      
      return (
        <LocationMarker
          key={`cert-${location.id || `${location.latitude}-${location.longitude}`}`}
          location={location}
          isActive={isActive}
          onClick={handleMarkerClick}
        />
      );
    });
  }, [certified, selectedLocationId, onMarkerClick]);
  
  // Render forecast markers if enabled
  const forecastMarkersComponent = React.useMemo(() => {
    if (!showForecast || forecastLocations.length === 0) return null;
    
    return forecastLocations.map((location) => {
      if (!location.isForecast) return null;
      
      const isActive = selectedLocationId === location.id;
      const handleMarkerClick = () => {
        onMarkerClick(location);
      };
      
      return (
        <ForecastMarker
          key={`forecast-${location.id || `${location.latitude}-${location.longitude}`}`}
          location={location}
          isActive={isActive}
          onClick={handleMarkerClick}
        />
      );
    });
  }, [forecastLocations, showForecast, selectedLocationId, onMarkerClick]);
  
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Display user's location if available */}
      {userLocation && (
        <UserLocationMarker position={[userLocation.latitude, userLocation.longitude]} />
      )}
      
      {/* Display search radius for calculated view */}
      {userLocation && activeView === 'calculated' && (
        <Circle
          center={[userLocation.latitude, userLocation.longitude]}
          radius={searchRadius * 1000} // Convert km to meters
          pathOptions={{ 
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.05,
            weight: 1,
            dashArray: '5, 5'
          }}
        />
      )}
      
      {/* Render regular markers */}
      {regularMarkers}
      
      {/* Render certified markers always on top */}
      {certifiedMarkers}
      
      {/* Render forecast markers if enabled */}
      {forecastMarkersComponent}
    </>
  );
};

export default React.memo(MapContent);
