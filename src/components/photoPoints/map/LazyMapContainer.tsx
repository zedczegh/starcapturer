
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { MapEvents } from './MapEffectsController';
import { MapEffectsComposer } from './MapComponents';
import MapController from './MapController';
import MobileMapFixer from './MobileMapFixer';
import MapContainerSettings from './container/MapContainerSettings';
import { useMapEventHandlers } from './container/MapEventHandlers';
import { useUserLocationSiqs } from './container/UserLocationFinder';
import MapLocationsLayer from './container/MapLocationsLayer';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapUtils } from '@/hooks/photoPoints/useMapUtils';

// Component to handle automatic zoom updates when radius or center changes
const DynamicZoomUpdater = ({ 
  zoom, 
  center, 
  searchRadius 
}: { 
  zoom: number; 
  center: [number, number]; 
  searchRadius: number;
}) => {
  const map = useMap();
  const { getZoomLevel } = useMapUtils();
  
  // Update zoom when searchRadius changes
  useEffect(() => {
    if (map) {
      const calculatedZoom = getZoomLevel(searchRadius);
      
      // Only animate if the zoom difference is significant
      const zoomDifference = Math.abs(map.getZoom() - calculatedZoom);
      
      if (zoomDifference > 0.1) {
        map.flyTo(center, calculatedZoom, {
          duration: 1,  // 1 second animation
          easeLinearity: 0.25
        });
        console.log(`Updating zoom to ${calculatedZoom} for radius ${searchRadius}km`);
      }
    }
  }, [searchRadius, map, center, getZoomLevel]);
  
  // Update center when it changes
  useEffect(() => {
    if (map && center) {
      // Avoid unnecessary view updates
      const currentCenter = map.getCenter();
      const distance = map.distance(currentCenter, center);
      
      if (distance > 100) { // Only update if moved more than 100m
        map.setView(center, map.getZoom(), {
          animate: true,
          duration: 0.5
        });
      }
    }
  }, [center, map]);
  
  return null;
};

interface LazyMapContainerProps {
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
  isScanning?: boolean;
}

const LazyMapContainer: React.FC<LazyMapContainerProps> = ({
  center,
  userLocation,
  locations,
  searchRadius,
  activeView,
  onMapReady,
  onLocationClick = () => {},
  onMapClick,
  zoom = 10,
  hoveredLocationId,
  onMarkerHover = () => {},
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  isMobile,
  useMobileMapFixer = false,
  isScanning = false
}) => {
  const [mapReady, setMapReady] = useState(false);
  
  // Find user location SIQS from available locations
  const { currentSiqs } = useUserLocationSiqs({ userLocation, locations });
  
  // Get map event handlers
  const { 
    mapRef, 
    handleMapReady,
    handleMapClick 
  } = useMapEventHandlers({
    onMapClick,
    onMapReady: () => {
      setMapReady(true);
      if (onMapReady) onMapReady();
    }
  });
  
  return (
    <>
      {/* Initialize map settings */}
      <MapContainerSettings />
      
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        ref={mapRef}
        className={`map-container ${isMobile ? 'mobile-optimized' : ''}`}
        whenReady={handleMapReady}
        attributionControl={true}
        // Add browser-compatible options for better performance
        preferCanvas={true}
        renderer={window.L?.canvas ? window.L.canvas() : undefined}
        zoomControl={false} // We'll add custom zoom controls
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Dynamic zoom updater that responds to radius changes */}
        <DynamicZoomUpdater 
          zoom={zoom}
          center={center}
          searchRadius={searchRadius}
        />
        
        {/* Use MapEffectsComposer to apply all map effects */}
        <MapEffectsComposer 
          center={center}
          zoom={zoom}
          userLocation={userLocation}
          activeView={activeView}
          searchRadius={searchRadius}
          onSiqsCalculated={(siqs) => console.log("SIQS calculated:", siqs)}
          isScanning={isScanning}
        />
        
        {/* Use MapEvents component for map click handling */}
        <MapEvents onMapClick={handleMapClick} />
        
        {/* Render all location markers */}
        <MapLocationsLayer
          userLocation={userLocation}
          locations={locations}
          hoveredLocationId={hoveredLocationId}
          onLocationClick={onLocationClick}
          onMarkerHover={onMarkerHover}
          handleTouchStart={handleTouchStart}
          handleTouchEnd={handleTouchEnd}
          handleTouchMove={handleTouchMove}
          currentSiqs={currentSiqs}
          activeView={activeView}
        />
        
        {/* Add controllers */}
        <MapController 
          userLocation={userLocation} 
          searchRadius={searchRadius}
        />
        
        {/* Add the mobile map fixer for better mobile experience */}
        {useMobileMapFixer && isMobile && <MobileMapFixer />}
      </MapContainer>
    </>
  );
};

export default LazyMapContainer;
