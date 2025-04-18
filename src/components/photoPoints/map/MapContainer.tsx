
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { lazy, Suspense } from 'react';
import MapLegend from './MapLegend';
import SiqsDisplay from './SiqsDisplay';
import RealTimeLocationUpdater from './RealTimeLocationUpdater';
import useMapInteractions from '@/hooks/photoPoints/useMapInteractions';
import SiqsEffectsController from './effects/SiqsEffectsController';

// Dynamically load the map component without SSR
const LazyMapContainer = lazy(() => import('./LazyMapContainer'));

interface MapContainerProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  mapReady: boolean;
  handleMapReady: () => void;
  handleLocationClicked: (location: SharedAstroSpot) => void;
  handleMapClick?: (lat: number, lng: number) => void;
  mapCenter: [number, number];
  initialZoom: number;
  mapContainerHeight?: string;
  isMobile?: boolean;
  hoveredLocationId?: string | null;
  handleHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  handleGetLocation?: () => void;
  onLegendToggle?: (isOpen: boolean) => void;
  onSiqsCalculated?: (siqs: number) => void;
  onSpotsGenerated?: (spots: SharedAstroSpot[]) => void;
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
  mapContainerHeight = '450px',
  isMobile = false,
  hoveredLocationId,
  handleHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  handleGetLocation,
  onLegendToggle,
  onSiqsCalculated,
  onSpotsGenerated
}) => {
  const { t } = useLanguage();
  const [legendVisible, setLegendVisible] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const {
    hideMarkerPopups,
    handleMapDragStart,
    handleMapDragEnd
  } = useMapInteractions({});
  
  const handleLegendToggle = useCallback((isVisible: boolean) => {
    setLegendVisible(isVisible);
    if (onLegendToggle) onLegendToggle(isVisible);
  }, [onLegendToggle]);
  
  const handleSiqsCalculated = useCallback((siqs: number) => {
    setRealTimeSiqs(siqs);
    if (onSiqsCalculated) onSiqsCalculated(siqs);
  }, [onSiqsCalculated]);

  return (
    <div className="relative w-full" 
      style={{ height: mapContainerHeight }} 
      ref={mapContainerRef}
    >
      {/* Map Legend */}
      <MapLegend 
        onToggle={handleLegendToggle} 
      />
      
      {/* Location Controls */}
      <RealTimeLocationUpdater
        userLocation={userLocation}
        onLocationUpdate={handleMapClick || (() => {})}
        showControls={Boolean(handleMapClick)}
      />
      
      {/* Map Container */}
      <Suspense fallback={
        <div className="flex h-full w-full justify-center items-center bg-muted/30 rounded-lg">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      }>
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
          useMobileMapFixer={isMobile}
          showRadiusCircles={activeView === 'calculated'}
        />
      </Suspense>
      
      {/* SIQS Effects controller */}
      {mapReady && userLocation && (
        <SiqsEffectsController
          userLocation={userLocation}
          activeView={activeView}
          searchRadius={searchRadius}
          onSiqsCalculated={handleSiqsCalculated}
          onSpotsGenerated={onSpotsGenerated}
          disabled={!mapReady}
        />
      )}
    </div>
  );
};

export default MapContainer;
