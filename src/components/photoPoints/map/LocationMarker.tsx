
import React, { useCallback, useState, useEffect } from 'react';
import { Marker } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import MarkerEventHandler from './MarkerEventHandler';
import { getLocationMarker } from './MarkerUtils';
import RealTimeSiqsProvider from '../cards/RealTimeSiqsProvider';
import { getSiqsScore } from '@/utils/siqsHelpers';
import LocationPopupContent from './LocationPopupContent';
import { useMarkerState } from './hooks/useMarkerState';

interface LocationMarkerProps {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  locationId: string;
  isCertified: boolean;
  activeView: 'certified' | 'calculated';
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({ 
  location, 
  onClick,
  isHovered,
  onHover,
  locationId,
  isCertified,
  activeView,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove
}) => {
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [siqsLoading, setSiqsLoading] = useState<boolean>(isCertified); // Start with loading for certified locations
  const [siqsConfidence, setSiqsConfidence] = useState<number>(7);
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);
  
  const { siqsScore, displayName, icon } = useMarkerState({
    location,
    realTimeSiqs,
    isCertified,
    isHovered
  });
  
  // Force SIQS update for certified locations on mount
  useEffect(() => {
    if (isCertified) {
      setForceUpdate(true);
      const timer = setTimeout(() => setForceUpdate(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isCertified]);
  
  // Check if coordinates are valid
  if (!location.latitude || !location.longitude || 
      !isFinite(location.latitude) || !isFinite(location.longitude)) {
    return null;
  }
  
  // Handle SIQS calculation results
  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean, confidence?: number) => {
    console.log(`SIQS calculated for ${locationId} (${isCertified ? 'certified' : 'regular'}): ${siqs}, loading: ${loading}`);
    setRealTimeSiqs(siqs);
    setSiqsLoading(loading);
    if (confidence) {
      setSiqsConfidence(confidence);
    }
  }, [locationId, isCertified]);
  
  // Handle marker events
  const handleClick = useCallback(() => {
    onClick(location);
  }, [location, onClick]);
  
  const handleMouseOver = useCallback(() => {
    onHover(locationId);
  }, [locationId, onHover]);
  
  const handleMouseOut = useCallback(() => {
    onHover(null);
  }, [onHover]);
  
  // Handle touch events for mobile
  const handleMarkerTouchStart = useCallback((e: React.TouchEvent) => {
    if (handleTouchStart) {
      handleTouchStart(e, locationId);
    }
  }, [handleTouchStart, locationId]);
  
  const handleMarkerTouchEnd = useCallback((e: React.TouchEvent) => {
    if (handleTouchEnd) {
      handleTouchEnd(e, locationId);
    }
  }, [handleTouchEnd, locationId]);
  
  const handleMarkerTouchMove = useCallback((e: React.TouchEvent) => {
    if (handleTouchMove) {
      handleTouchMove(e);
    }
  }, [handleTouchMove]);
  
  return (
    <>
      <RealTimeSiqsProvider
        isVisible={true} // Always calculate for certified locations
        latitude={location.latitude}
        longitude={location.longitude}
        bortleScale={location.bortleScale}
        isCertified={isCertified}
        isDarkSkyReserve={location.isDarkSkyReserve}
        existingSiqs={location.siqs}
        onSiqsCalculated={handleSiqsCalculated}
        forceUpdate={forceUpdate || (isCertified && !realTimeSiqs)}
      />
      
      <Marker
        position={[location.latitude, location.longitude]}
        icon={icon}
        onClick={handleClick}
      >
        <MarkerEventHandler 
          marker={null}
          eventMap={{
            mouseover: handleMouseOver,
            mouseout: handleMouseOut,
            touchstart: handleMarkerTouchStart,
            touchend: handleMarkerTouchEnd,
            touchmove: handleMarkerTouchMove
          }}
        />
        
        <LocationPopupContent
          location={location}
          siqsScore={siqsScore}
          siqsLoading={siqsLoading}
          displayName={displayName}
          isCertified={isCertified}
          onClick={handleClick}
        />
      </Marker>
    </>
  );
};

export default React.memo(LocationMarker);
