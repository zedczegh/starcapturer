
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LocationMarker } from '../markers';
import { generateLocationId, isCertifiedLocation } from '../markers/MarkerUtils';

interface MarkerGroupProps {
  locations: SharedAstroSpot[];
  onLocationClick?: (location: SharedAstroSpot) => void;
  hoveredLocationId: string | null;
  onMarkerHover: (id: string | null) => void;
  hideMarkerPopups: boolean;
  activeView: 'certified' | 'calculated';
}

const MarkerGroup = React.memo(({ 
  locations, 
  onLocationClick,
  hoveredLocationId,
  onMarkerHover,
  hideMarkerPopups,
  activeView
}: MarkerGroupProps) => {
  return (
    <>
      {locations.map((location) => {
        // Only render markers with valid coordinates
        if (!location || 
            typeof location.latitude !== 'number' || 
            typeof location.longitude !== 'number' ||
            isNaN(location.latitude) || 
            isNaN(location.longitude)) {
          return null;
        }
        
        // Generate a unique ID for this location
        const locationId = generateLocationId(location);
        
        // Individual location certification status
        const locationIsCertified = isCertifiedLocation(location);
        
        // Skip non-certified locations in certified view
        if (activeView === 'certified' && !locationIsCertified) {
          return null;
        }
        
        // Handle the click event for this marker
        const handleClick = () => {
          if (onLocationClick) {
            onLocationClick(location);
          }
        };
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={handleClick}
            isHovered={hoveredLocationId === locationId && !hideMarkerPopups}
            onHover={hideMarkerPopups ? () => {} : onMarkerHover}
            locationId={locationId}
            isCertified={locationIsCertified}
            activeView={activeView}
          />
        );
      })}
    </>
  );
});

MarkerGroup.displayName = 'MarkerGroup';

export default MarkerGroup;
