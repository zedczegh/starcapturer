import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useUserGeolocation } from '@/hooks/community/useUserGeolocation';
import { createAMapMarkerIcon, createAMapPopupContent } from './AMapMarkerUtils';
import { getSiqsScore } from '@/utils/siqsHelpers';
import RealTimeSiqsProvider from '@/components/photoPoints/cards/RealTimeSiqsProvider';
import '../../photoPoints/map/AMapStyles.css';

interface AMapCommunityProps {
  center: [number, number];
  locations: SharedAstroSpot[];
  hoveredLocationId?: string | null;
  onMarkerClick?: (spot: SharedAstroSpot) => void;
  isMobile?: boolean;
  zoom?: number;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const AMapCommunity: React.FC<AMapCommunityProps> = ({
  center,
  locations,
  zoom = 3,
  onMarkerClick,
  onLocationUpdate,
  isMobile = false,
  hoveredLocationId,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowsRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);
  const { position: userPosition, updatePosition } = useUserGeolocation();
  const [realTimeSiqsMap, setRealTimeSiqsMap] = useState<Map<string, number>>(new Map());

  // Setup global callback for popup details
  useEffect(() => {
    (window as any).viewAMapSpotDetails = (spotId: string) => {
      const location = locations.find(loc => loc.id === spotId);
      if (location && onMarkerClick) {
        onMarkerClick(location);
      }
    };
    
    return () => {
      delete (window as any).viewAMapSpotDetails;
    };
  }, [locations, onMarkerClick]);

  // Update real-time SIQS for a location
  const handleSiqsUpdate = useCallback((locationId: string, siqs: number) => {
    setRealTimeSiqsMap(prev => {
      const newMap = new Map(prev);
      newMap.set(locationId, siqs);
      return newMap;
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new (window as any).AMap.Map(mapContainer.current, {
      center: [center[1], center[0]],
      zoom: zoom,
      mapStyle: 'amap://styles/dark',
    });

    mapInstance.current = map;
    map.addControl(new (window as any).AMap.Scale());
    map.addControl(new (window as any).AMap.ToolBar());

    if (onLocationUpdate) {
      map.on('click', (e: any) => {
        updatePosition(e.lnglat.lat, e.lnglat.lng);
        onLocationUpdate(e.lnglat.lat, e.lnglat.lng);
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update map center
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setCenter([center[1], center[0]]);
    }
  }, [center]);

  // Add user location marker
  useEffect(() => {
    if (!mapInstance.current || !userPosition) return;

    if (userMarkerRef.current && mapInstance.current) {
      mapInstance.current.remove(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    const marker = new (window as any).AMap.Marker({
      position: [userPosition[1], userPosition[0]], // [lng, lat]
      icon: new (window as any).AMap.Icon({
        size: new (window as any).AMap.Size(32, 32),
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="8" fill="#3b82f6" stroke="white" stroke-width="3"/>
          </svg>
        `),
      }),
      title: 'Your Location',
      draggable: !!onLocationUpdate,
    });

    if (onLocationUpdate) {
      marker.on('dragend', (e: any) => {
        const pos = e.target.getPosition();
        updatePosition(pos.lat, pos.lng);
        onLocationUpdate(pos.lat, pos.lng);
      });
    }

    mapInstance.current.add(marker);
    userMarkerRef.current = marker;

    return () => {
      if (userMarkerRef.current && mapInstance.current) {
        mapInstance.current.remove(userMarkerRef.current);
        userMarkerRef.current = null;
      }
    };
  }, [userPosition, onLocationUpdate]);

  // Add location markers with real-time SIQS
  useEffect(() => {
    if (!mapInstance.current || !locations) return;

    // Clear existing markers and info windows
    markersRef.current.forEach((marker) => {
      if (marker && mapInstance.current) {
        mapInstance.current.remove(marker);
      }
    });
    markersRef.current.clear();
    infoWindowsRef.current.clear();

    // Add new markers
    locations.forEach((spot) => {
      const isCertified = Boolean(spot.isDarkSkyReserve || spot.certification);
      const isHovered = hoveredLocationId === spot.id;
      
      // Get current SIQS (real-time or static)
      const currentSiqs = realTimeSiqsMap.get(spot.id) || getSiqsScore(spot);
      
      const markerIcon = createAMapMarkerIcon(spot, isCertified, isHovered, isMobile, currentSiqs);
      
      const marker = new (window as any).AMap.Marker({
        position: [spot.longitude, spot.latitude],
        title: spot.name,
        content: markerIcon.content,
        offset: new (window as any).AMap.Pixel(...markerIcon.offset),
      });

      // Create info window
      const infoWindow = new (window as any).AMap.InfoWindow({
        content: createAMapPopupContent({
          location: spot,
          siqsScore: currentSiqs,
          siqsLoading: false,
          displayName: spot.name,
          isCertified,
          onViewDetails: () => {},
          userId: spot.user_id,
          isMobile,
        }),
        offset: new (window as any).AMap.Pixel(0, -markerIcon.size[1] / 2),
      });

      marker.on('click', () => {
        infoWindow.open(mapInstance.current, marker.getPosition());
      });

      mapInstance.current.add(marker);
      markersRef.current.set(spot.id, marker);
      infoWindowsRef.current.set(spot.id, infoWindow);
    });

    return () => {
      markersRef.current.forEach((marker) => {
        if (marker && mapInstance.current) {
          mapInstance.current.remove(marker);
        }
      });
      markersRef.current.clear();
      infoWindowsRef.current.clear();
    };
  }, [locations, hoveredLocationId, isMobile, realTimeSiqsMap]);

  // Update marker on hover
  useEffect(() => {
    if (!hoveredLocationId) return;
    
    const marker = markersRef.current.get(hoveredLocationId);
    if (marker) {
      const location = locations.find(loc => loc.id === hoveredLocationId);
      if (location) {
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        const currentSiqs = realTimeSiqsMap.get(location.id) || getSiqsScore(location);
        const markerIcon = createAMapMarkerIcon(location, isCertified, true, isMobile, currentSiqs);
        marker.setContent(markerIcon.content);
      }
    }
  }, [hoveredLocationId, locations, isMobile, realTimeSiqsMap]);

  return (
    <div className="relative w-full h-full">
      {/* Real-time SIQS providers for each visible location */}
      {locations.slice(0, 50).map((location) => (
        <RealTimeSiqsProvider
          key={location.id}
          isVisible={true}
          latitude={location.latitude}
          longitude={location.longitude}
          bortleScale={location.bortleScale || 4}
          onSiqsCalculated={(siqs) => {
            if (siqs !== null) {
              handleSiqsUpdate(location.id, siqs);
            }
          }}
        />
      ))}
      
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default AMapCommunity;
