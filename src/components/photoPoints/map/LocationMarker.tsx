
import React, { useCallback, useState, useEffect } from 'react';
import { Marker } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import MarkerEventHandler from './MarkerEventHandler';
import { getLocationMarker } from './MarkerUtils';
import RealTimeSiqsProvider from '../cards/RealTimeSiqsProvider';
import { getSiqsScore } from '@/utils/siqsHelpers';
import LocationPopupContent from './LocationPopupContent';
import { useMarkerState } from './hooks/useMarkerState';
import { useNavigate } from "react-router-dom";
import { prepareLocationForNavigation } from '@/utils/locationNavigation';

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
  const [siqsLoading, setSiqsLoading] = useState<boolean>(isCertified);
  const [siqsConfidence, setSiqsConfidence] = useState<number>(7);
  const [forceUpdate, setForceUpdate] = useState<boolean>(false);

  const { siqsScore, displayName, icon } = useMarkerState({
    location,
    realTimeSiqs,
    isCertified,
    isHovered
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (isCertified) {
      setForceUpdate(true);
      setSiqsLoading(true);
      const timer = setTimeout(() => setForceUpdate(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isCertified]);

  if (!location.latitude || !location.longitude || 
      !isFinite(location.latitude) || !isFinite(location.longitude)) {
    return null;
  }
  
  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean, confidence?: number) => {
    setRealTimeSiqs(siqs);
    setSiqsLoading(loading);
    if (confidence) {
      setSiqsConfidence(confidence);
    }
    if (isCertified && (siqs === null || siqs <= 0) && !loading) {
      setSiqsLoading(true);
      setTimeout(() => setForceUpdate(true), 2000);
      setTimeout(() => setForceUpdate(false), 2100);
    }
  }, [locationId, isCertified]);
  
  const handleClick = useCallback(() => {
    if (isCertified) {
      setForceUpdate(true);
      setTimeout(() => setForceUpdate(false), 100);
      setSiqsLoading(true);
    }
    onClick(location);
  }, [location, onClick, isCertified]);
  
  const handleMouseOver = useCallback(() => {
    onHover(locationId);
  }, [locationId, onHover]);
  
  const handleMouseOut = useCallback(() => {
    onHover(null);
  }, [onHover]);
  
  const handleMarkerTouchStart = useCallback((e: React.TouchEvent) => {
    if (isCertified) {
      setForceUpdate(true);
      setTimeout(() => setForceUpdate(false), 100);
      setSiqsLoading(true);
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

  // Handle navigation to location details page from popup
  const handleViewDetails = useCallback((loc: SharedAstroSpot) => {
    try {
      const navigationData = prepareLocationForNavigation(loc);
      
      if (navigationData) {
        navigate(`/location/${navigationData.locationId}`, { 
          state: navigationData.locationState 
        });
        console.log("Opening location details", navigationData.locationId);
      }
    } catch (error) {
      console.error("Error navigating to location details:", error, loc);
    }
  }, [navigate]);

  return (
    <>
      <RealTimeSiqsProvider
        isVisible={true}
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
          siqsScore={getSiqsScore(siqsScore)}
          siqsLoading={siqsLoading}
          displayName={displayName}
          isCertified={isCertified}
          onViewDetails={handleViewDetails}
        />
      </Marker>
    </>
  );
};

export default React.memo(LocationMarker);
