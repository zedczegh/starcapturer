
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Marker } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import MarkerEventHandler from './MarkerEventHandler';
import { getLocationMarker } from './MarkerUtils';
import RealTimeSiqsProvider from '../cards/RealTimeSiqsProvider';
import { getSiqsScore } from '@/utils/siqsHelpers';
import LocationPopupContent from './LocationPopupContent';

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
  const [siqsLoading, setSiqsLoading] = useState<boolean>(false); 
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);
  
  // Extract existing SIQS score from location
  const existingSiqs = useMemo(() => getSiqsScore(location.siqs), [location.siqs]);
  
  // Generate display name once
  const displayName = useMemo(() => {
    const name = location.name || 'Unnamed Location';
    return location.chineseName && name !== location.chineseName 
      ? `${name} / ${location.chineseName}` 
      : name;
  }, [location.name, location.chineseName]);
  
  // Calculate the current SIQS score to display
  const siqsScore = useMemo(() => {
    if (realTimeSiqs !== null) {
      return realTimeSiqs;
    }
    return existingSiqs;
  }, [realTimeSiqs, existingSiqs]);
  
  // Get marker icon only when needed values change
  const icon = useMemo(() => 
    getLocationMarker(siqsScore, isCertified, isHovered, false), 
  [siqsScore, isCertified, isHovered]);
  
  // Check if coordinates are valid
  if (!location.latitude || !location.longitude || 
      !isFinite(location.latitude) || !isFinite(location.longitude)) {
    return null;
  }
  
  // Handle SIQS calculation results
  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean, confidence?: number) => {
    setRealTimeSiqs(siqs);
    setSiqsLoading(loading);
  }, []);
  
  // Handle marker events
  const handleClick = useCallback(() => {
    if (isCertified) {
      setForceUpdate(true);
      setTimeout(() => setForceUpdate(false), 100);
    }
    onClick(location);
  }, [location, onClick, isCertified]);
  
  const handleMouseOver = useCallback(() => {
    onHover(locationId);
  }, [locationId, onHover]);
  
  const handleMouseOut = useCallback(() => {
    onHover(null);
  }, [onHover]);
  
  // Handle touch events for mobile
  const handleMarkerTouchStart = useCallback((e: React.TouchEvent) => {
    if (isCertified) {
      setForceUpdate(true);
      setTimeout(() => setForceUpdate(false), 100);
    }
    if (handleTouchStart) {
      handleTouchStart(e, locationId);
    }
  }, [handleTouchStart, locationId, isCertified]);
  
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
  
  // Optimize SIQS provider - only show for visible/hovered markers
  const showSiqsProvider = isCertified || isHovered;
  
  return (
    <>
      {showSiqsProvider && (
        <RealTimeSiqsProvider
          isVisible={showSiqsProvider}
          latitude={location.latitude}
          longitude={location.longitude}
          bortleScale={location.bortleScale}
          isCertified={isCertified}
          isDarkSkyReserve={location.isDarkSkyReserve}
          existingSiqs={location.siqs}
          onSiqsCalculated={handleSiqsCalculated}
          forceUpdate={forceUpdate}
        />
      )}
      
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
