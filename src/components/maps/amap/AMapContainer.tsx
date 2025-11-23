import React, { useEffect, useRef, useState } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface AMapContainerProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated' | 'obscura' | 'mountains';
  onMapReady?: () => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  zoom?: number;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  isMobile?: boolean;
  showRadiusCircles?: boolean;
}

const AMapContainer: React.FC<AMapContainerProps> = ({
  center,
  userLocation,
  locations,
  searchRadius,
  zoom = 10,
  onMapClick,
  onLocationClick,
  onMapReady,
  showRadiusCircles,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

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

    // Handle map clicks
    if (onMapClick) {
      map.on('click', (e: any) => {
        onMapClick(e.lnglat.lat, e.lnglat.lng);
      });
    }

    if (onMapReady) {
      map.on('complete', onMapReady);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update map center when prop changes
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setCenter([center[1], center[0]]);
    }
  }, [center]);

  // Add user location marker
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;

    const marker = new (window as any).AMap.Marker({
      position: [userLocation.longitude, userLocation.latitude],
      icon: new (window as any).AMap.Icon({
        size: new (window as any).AMap.Size(32, 32),
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="8" fill="#3b82f6" stroke="white" stroke-width="3"/>
          </svg>
        `),
      }),
      title: 'Your Location',
    });

    mapInstance.current.add(marker);

    let circle: any | null = null;

    // Add radius circle
    if (showRadiusCircles && searchRadius > 0) {
      circle = new (window as any).AMap.Circle({
        center: [userLocation.longitude, userLocation.latitude],
        radius: searchRadius * 1000, // Convert km to meters
        strokeColor: '#3b82f6',
        strokeWeight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
      });
      mapInstance.current.add(circle);
    }

    return () => {
      if (marker && mapInstance.current) {
        mapInstance.current.remove(marker);
      }
      if (circle && mapInstance.current) {
        mapInstance.current.remove(circle);
      }
    };
  }, [userLocation, searchRadius, showRadiusCircles]);

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
    locations.forEach((location) => {
      const marker = new (window as any).AMap.Marker({
        position: [location.longitude, location.latitude],
        title: location.name,
      });

      // Add click handler
      if (onLocationClick) {
        marker.on('click', () => {
          onLocationClick(location);
        });
      }

      // Add info window
      const infoWindow = new (window as any).AMap.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px; font-weight: bold;">${location.name}</h3>
            ${location.siqs ? `<p style="margin: 0;">SIQS: ${location.siqs}</p>` : ''}
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
  }, [locations, onLocationClick]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default AMapContainer;
