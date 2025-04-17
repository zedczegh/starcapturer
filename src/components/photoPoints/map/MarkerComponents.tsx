
import React, { useState, useCallback, memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Award } from 'lucide-react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { haversineDistance } from '@/utils/geoUtils';
import { formatDistance, getSafeScore } from '@/utils/geoUtils';

// Create a memoized UserMarker component for better performance
export const UserMarker = memo(({ position }: { position: [number, number] }) => {
  const userIcon = divIcon({
    className: 'custom-user-marker',
    html: `<div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-md pulse-animation">
            <div class="w-2 h-2 bg-white rounded-full"></div>
          </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return <Marker position={position} icon={userIcon} />;
});

// Create a memoized UserLocationMarker component for better performance
export const UserLocationMarker = memo(({ position, currentSiqs }: { position: [number, number]; currentSiqs?: number | null }) => {
  const userIcon = divIcon({
    className: 'custom-user-marker',
    html: `<div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-md pulse-animation">
            <div class="w-2 h-2 bg-white rounded-full"></div>
            ${currentSiqs ? `<div class="absolute -top-6 -right-6 bg-white text-xs px-1 rounded-full shadow">${currentSiqs.toFixed(1)}</div>` : ''}
          </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return <Marker position={position} icon={userIcon} />;
});

// Create a memoized LocationMarker component for better performance
interface LocationMarkerProps {
  location: any;
  userLocation?: { latitude: number; longitude: number } | null;
  onLocationClick?: (location: any) => void;
  onClick?: (location: any) => void;
  isHovered?: boolean;
  onHover?: (id: string | null) => void;
  locationId?: string;
  isCertified?: boolean;
  activeView?: 'certified' | 'calculated';
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
}

export const LocationMarker = memo(({ 
  location,
  userLocation,
  onLocationClick,
  onClick,
  isHovered,
  onHover,
  locationId,
  isCertified,
  activeView,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove
}: LocationMarkerProps) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleMarkerClick = useCallback(() => {
    setIsPopupOpen(true);
    if (onLocationClick) {
      onLocationClick(location);
    }
    if (onClick) {
      onClick(location);
    }
  }, [location, onLocationClick, onClick]);
  
  const handleViewDetails = useCallback(() => {
    const locId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
    
    navigate(`/location/${locId}`, {
      state: {
        ...location,
        id: locId
      }
    });
  }, [location, navigate]);
  
  const handleMouseEnter = useCallback(() => {
    if (onHover && locationId) {
      onHover(locationId);
    }
  }, [onHover, locationId]);

  const handleMouseLeave = useCallback(() => {
    if (onHover) {
      onHover(null);
    }
  }, [onHover]);

  const handleTouchStartEvent = useCallback((e: React.TouchEvent) => {
    if (handleTouchStart && locationId) {
      handleTouchStart(e, locationId);
    }
  }, [handleTouchStart, locationId]);

  const handleTouchEndEvent = useCallback((e: React.TouchEvent) => {
    if (handleTouchEnd && locationId) {
      handleTouchEnd(e, locationId);
    }
  }, [handleTouchEnd, locationId]);

  const handleTouchMoveEvent = useCallback((e: React.TouchEvent) => {
    if (handleTouchMove) {
      handleTouchMove(e);
    }
  }, [handleTouchMove]);

  // Calculate distance if user location is available
  const distance = userLocation 
    ? haversineDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        location.latitude, 
        location.longitude
      )
    : null;
  
  // Get SIQS score for this location
  const siqsScore = getSafeScore(location);
  
  // Determine icon color based on SIQS score
  const getIconColor = () => {
    if (location.isDarkSkyReserve || location.certification) {
      return '#7C3AED'; // Purple for certified locations
    }
    
    if (siqsScore >= 7.5) return '#10B981'; // Green for high SIQS
    if (siqsScore >= 5) return '#FBBF24'; // Yellow for medium SIQS
    return '#6B7280'; // Gray for lower SIQS or unknown
  };

  // Create custom icon for this marker
  const markerIcon = divIcon({
    className: `custom-location-marker marker-${location.id}`,
    html: `<div class="marker-container" style="width:28px;height:28px;">
            <div class="marker-icon" style="background-color:${getIconColor()};width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-center;">
              ${location.certification || location.isDarkSkyReserve ? '<div style="width:6px;height:6px;background-color:white;border-radius:50%;"></div>' : ''}
            </div>
          </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  return (
    <Marker 
      position={[location.latitude, location.longitude]} 
      icon={markerIcon}
      // Fix: Replace eventHandlers with onClick prop
      onClick={handleMarkerClick}
    >
      <Popup
        // Fix: Replace closeButton with other valid props
        offset={[0, -10]}
      >
        <Card className="w-64 border-none shadow-none p-0">
          <CardContent className="p-3">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-sm truncate mr-2">
                {location.name || 'Unnamed Location'}
              </h4>
              {siqsScore > 0 && (
                <Badge className={`text-xs ${siqsScore >= 7.5 ? 'bg-emerald-600' : siqsScore >= 5 ? 'bg-amber-500' : 'bg-slate-500'}`}>
                  {siqsScore.toFixed(1)}
                </Badge>
              )}
            </div>
            
            {(location.certification || location.isDarkSkyReserve) && (
              <div className="mb-2 flex items-center text-violet-500">
                <Award className="w-3 h-3 mr-1" />
                <span className="text-xs">
                  {location.certification || 'Dark Sky Reserve'}
                </span>
              </div>
            )}
            
            {distance !== null && (
              <div className="text-xs text-muted-foreground flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{formatDistance(distance)}</span>
              </div>
            )}
            
            <div className="mt-3 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={handleViewDetails}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </Popup>
    </Marker>
  );
});

// Add display names for React DevTools
UserMarker.displayName = 'UserMarker';
LocationMarker.displayName = 'LocationMarker';
UserLocationMarker.displayName = 'UserLocationMarker';
