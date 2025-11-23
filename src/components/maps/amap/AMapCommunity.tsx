import React, { useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useUserGeolocation } from '@/hooks/community/useUserGeolocation';

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
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const { position: userPosition, updatePosition } = useUserGeolocation();

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Initialize AMap
    const map = new (window as any).AMap.Map(mapContainer.current, {
      center: [center[1], center[0]], // AMap uses [lng, lat]
      zoom: zoom,
      mapStyle: 'amap://styles/dark',
    });

    mapInstance.current = map;

    // Add map controls
    map.addControl(new (window as any).AMap.Scale());
    map.addControl(new (window as any).AMap.ToolBar());

    // Handle map clicks for location updates
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

  // Add location markers
  useEffect(() => {
    if (!mapInstance.current || !locations) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      if (marker && mapInstance.current) {
        mapInstance.current.remove(marker);
      }
    });
    markersRef.current = [];

    // Add new markers
    locations.forEach((spot) => {
      const marker = new (window as any).AMap.Marker({
        position: [spot.longitude, spot.latitude],
        title: spot.name,
      });

      // Add click handler
      if (onMarkerClick) {
        marker.on('click', () => {
          onMarkerClick(spot);
        });
      }

      // Add info window
      const infoWindow = new (window as any).AMap.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px; font-weight: bold;">${spot.name}</h3>
            ${spot.siqs ? `<p style="margin: 0;">SIQS: ${spot.siqs}</p>` : ''}
          </div>
        `,
      });

      marker.on('click', () => {
        infoWindow.open(mapInstance.current, marker.getPosition());
      });

      mapInstance.current.add(marker);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => {
        if (marker && mapInstance.current) {
          mapInstance.current.remove(marker);
        }
      });
      markersRef.current = [];
    };
  }, [locations, onMarkerClick]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default AMapCommunity;
