
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import LazyMapContainer from './LazyMapContainer';
import MapLegend from './MapLegend';
import PinpointButton from './PinpointButton';

interface MapContainerProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated' | 'obscura';
  mapReady: boolean;
  handleMapReady: () => void;
  handleLocationClicked: (location: SharedAstroSpot) => void;
  handleMapClick: (lat: number, lng: number) => void;
  mapCenter: [number, number];
  initialZoom: number;
  mapContainerHeight: string;
  isMobile: boolean;
  hoveredLocationId: string | null;
  handleHover: (id: string | null) => void;
  handleTouchStart: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleGetLocation: () => void;
  onLegendToggle: (isOpen: boolean) => void;
}

const MapContainer: React.FC<MapContainerProps> = ({
  userLocation,
  locations,
  searchRadius,
  activeView,
  mapReady,
  handleMapReady,
  handleLocationClicked,
  handleMapClick,
  mapCenter,
  initialZoom,
  mapContainerHeight,
  isMobile,
  hoveredLocationId,
  handleHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  handleGetLocation,
  onLegendToggle
}) => {
  const { t } = useLanguage();

  return (
    <div 
      style={{ height: mapContainerHeight }} 
      className="w-full relative rounded-md overflow-hidden transition-all duration-300 mb-4 mt-2"
    >
      {!mapReady && (
        <div className="absolute inset-0 z-20">
          <div className="flex h-full items-center justify-center bg-background/80">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        </div>
      )}
      
      <LazyMapContainer
        center={mapCenter}
        userLocation={userLocation}
        locations={locations}
        searchRadius={searchRadius}
        activeView={activeView}
        onMapReady={handleMapReady}
        onLocationClick={handleLocationClicked}
        onMapClick={handleMapClick}
        zoom={initialZoom}
        hoveredLocationId={hoveredLocationId}
        onMarkerHover={handleHover}
        handleTouchStart={handleTouchStart}
        handleTouchEnd={handleTouchEnd}
        handleTouchMove={handleTouchMove}
        isMobile={isMobile}
        useMobileMapFixer={false}
        showRadiusCircles={activeView === 'calculated' && !isMobile}
      />
      
      {/* Add MapLegend for both mobile and desktop */}
      <MapLegend 
        activeView={activeView} 
        showStarLegend={activeView === 'certified'}
        showCircleLegend={activeView === 'calculated'}
        onToggle={onLegendToggle}
        className="absolute top-4 right-4 z-[999]"
      />
      
      {/* Update PinpointButton positioning for desktop and mobile */}
      <PinpointButton
        onGetLocation={handleGetLocation}
        className={isMobile ? "absolute bottom-4 right-4 z-[999]" : "absolute bottom-4 left-4 z-[999]"}
        shouldCenter={false}
        hasLocation={userLocation !== null}
      />
    </div>
  );
};

export default MapContainer;
