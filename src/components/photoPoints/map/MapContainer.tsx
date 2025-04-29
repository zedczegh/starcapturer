
import React, { useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import LazyMapContainer from './LazyMapContainer';

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
  mapContainerHeight: string;
  isMobile: boolean;
  hoveredLocationId: string | null;
  handleHover: (id: string | null) => void;
  handleTouchStart: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleGetLocation: () => void;
  onLegendToggle: () => void;
  isForecast?: boolean;
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
  onLegendToggle,
  isForecast = false
}) => {
  const { t } = useLanguage();
  const isDetectedMobile = useIsMobile();
  
  // Use the provided isMobile or fall back to the hook detection
  const effectiveMobile = isMobile !== undefined ? isMobile : isDetectedMobile;
  
  // Only show the radius circle for calculated view when not in forecast mode
  const showRadiusCircles = activeView === 'calculated' && !isForecast;
  
  // Helper function to get numeric SIQS value
  const getSiqsValue = (siqs: number | { score: number; isViable: boolean } | undefined): number | null => {
    if (siqs === undefined) return null;
    if (typeof siqs === 'number') return siqs;
    if (typeof siqs === 'object' && siqs !== null && 'score' in siqs) {
      return siqs.score;
    }
    return null;
  };
  
  // Current SIQS score at user location
  const currentSiqs = useMemo(() => {
    // If we have no user location, return null
    if (!userLocation) return null;
    
    // Find if there's a location at the exact user coordinates
    const userLocationSpot = locations.find(loc => 
      Math.abs(loc.latitude - userLocation.latitude) < 0.0001 && 
      Math.abs(loc.longitude - userLocation.longitude) < 0.0001
    );
    
    return userLocationSpot ? getSiqsValue(userLocationSpot.siqs) : null;
  }, [locations, userLocation]);
  
  // Check map loading status
  if (!mapReady) {
    return (
      <div 
        className="bg-muted/30 rounded-lg flex items-center justify-center"
        style={{ height: mapContainerHeight }}
      >
        <div className="animate-pulse text-center">
          <div className="h-6 w-24 bg-muted rounded mx-auto mb-2"></div>
          <div className="text-xs text-muted-foreground">
            {t("Loading map...", "加载地图中...")}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="relative rounded-lg overflow-hidden border border-border shadow-sm"
      style={{ height: mapContainerHeight }}
    >
      <LazyMapContainer
        center={mapCenter}
        userLocation={userLocation}
        zoom={initialZoom}
        displayLocations={locations}
        activeView={activeView}
        searchRadius={searchRadius}
        onLocationClick={handleLocationClicked}
        onMapClick={handleMapClick}
        isMobile={effectiveMobile}
        hoveredLocationId={hoveredLocationId}
        onMarkerHover={handleHover}
        handleTouchStart={handleTouchStart}
        handleTouchEnd={handleTouchEnd}
        handleTouchMove={handleTouchMove}
        onMapReady={handleMapReady}
        showRadiusCircles={showRadiusCircles}
        currentSiqs={currentSiqs}
        isForecast={isForecast}
      />
    </div>
  );
};

export default React.memo(MapContainer);
