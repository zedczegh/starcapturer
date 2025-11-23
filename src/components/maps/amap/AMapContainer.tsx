import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { createAMapMarkerIcon, createAMapPopupContent, shouldShowLocationMarker } from './AMapMarkerUtils';
import { getSiqsScore } from '@/utils/siqsHelpers';
import RealTimeSiqsProvider from '@/components/photoPoints/cards/RealTimeSiqsProvider';
import '../../photoPoints/map/AMapStyles.css';

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
  activeView,
  zoom = 10,
  onMapClick,
  onLocationClick,
  onMapReady,
  showRadiusCircles,
  isMobile = false,
  hoveredLocationId,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowsRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [realTimeSiqsMap, setRealTimeSiqsMap] = useState<Map<string, number>>(new Map());
  const [userProfilesMap, setUserProfilesMap] = useState<Map<string, { avatar_url?: string; username?: string }>>(new Map());

  // Setup global callback for popup details
  useEffect(() => {
    (window as any).viewAMapSpotDetails = (spotId: string) => {
      const location = locations.find(loc => loc.id === spotId);
      if (location && onLocationClick) {
        onLocationClick(location);
      }
    };
    
    return () => {
      delete (window as any).viewAMapSpotDetails;
    };
  }, [locations, onLocationClick]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new (window as any).AMap.Map(mapContainer.current, {
      center: [center[1], center[0]], // AMap uses [lng, lat]
      zoom: zoom,
      mapStyle: 'amap://styles/dark',
    });

    mapInstance.current = map;

    map.addControl(new (window as any).AMap.Scale());
    map.addControl(new (window as any).AMap.ToolBar());

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

  // Update map center
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setCenter([center[1], center[0]]);
    }
  }, [center]);

  // Update real-time SIQS for a location
  const handleSiqsUpdate = useCallback((locationId: string, siqs: number) => {
    setRealTimeSiqsMap(prev => {
      const newMap = new Map(prev);
      newMap.set(locationId, siqs);
      return newMap;
    });
    
    // Update the InfoWindow content when SIQS changes
    const infoWindow = infoWindowsRef.current.get(locationId);
    const location = locations.find(loc => loc.id === locationId);
    if (infoWindow && location) {
      const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
      const userProfile = userProfilesMap.get(location.user_id || '');
      
      // Determine location type
      let locationType = '';
      if (location.certification === 'Atlas Obscura') locationType = 'Atlas Obscura';
      else if (location.certification?.toLowerCase().includes('mountain')) locationType = 'Mountain';
      
      infoWindow.setContent(createAMapPopupContent({
        location,
        siqsScore: siqs,
        siqsLoading: false,
        displayName: location.name,
        isCertified,
        onViewDetails: () => {},
        userId: location.user_id,
        isMobile,
        userAvatarUrl: userProfile?.avatar_url,
        distance: location.distance,
        locationType,
      }));
    }
  }, [locations, userProfilesMap, isMobile]);

  // Add user location marker
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;

    if (userMarkerRef.current && mapInstance.current) {
      mapInstance.current.remove(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (circleRef.current && mapInstance.current) {
      mapInstance.current.remove(circleRef.current);
      circleRef.current = null;
    }

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
    userMarkerRef.current = marker;

    // Add radius circle
    if (showRadiusCircles && searchRadius > 0) {
      const circle = new (window as any).AMap.Circle({
        center: [userLocation.longitude, userLocation.latitude],
        radius: searchRadius * 1000,
        strokeColor: '#3b82f6',
        strokeWeight: 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
      });
      mapInstance.current.add(circle);
      circleRef.current = circle;
    }

    return () => {
      if (userMarkerRef.current && mapInstance.current) {
        mapInstance.current.remove(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (circleRef.current && mapInstance.current) {
        mapInstance.current.remove(circleRef.current);
        circleRef.current = null;
      }
    };
  }, [userLocation, searchRadius, showRadiusCircles]);

  // Fetch user profiles for avatars
  useEffect(() => {
    const fetchProfiles = async () => {
      const userIds = [...new Set(locations.map(loc => loc.user_id).filter(Boolean))];
      const newProfiles = new Map(userProfilesMap);
      
      for (const userId of userIds) {
        if (!userId || newProfiles.has(userId)) continue;
        
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase
            .from('profiles')
            .select('avatar_url, username')
            .eq('id', userId)
            .single();
          
          if (data) {
            newProfiles.set(userId, data);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
      
      setUserProfilesMap(newProfiles);
    };
    
    if (locations.length > 0) {
      fetchProfiles();
    }
  }, [locations]);

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
    locations.forEach((location) => {
      const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
      
      // Check if marker should be shown based on active view
      if (!shouldShowLocationMarker(location, isCertified, activeView)) {
        return;
      }

      const isHovered = hoveredLocationId === location.id;
      
      // Get current SIQS (real-time or static)
      const currentSiqs = realTimeSiqsMap.get(location.id) || getSiqsScore(location);
      
      const markerIcon = createAMapMarkerIcon(location, isCertified, isHovered, isMobile, currentSiqs);
      
      const marker = new (window as any).AMap.Marker({
        position: [location.longitude, location.latitude],
        title: location.name,
        content: markerIcon.content,
        offset: new (window as any).AMap.Pixel(...markerIcon.offset),
      });

      // Get user profile for avatar
      const userProfile = userProfilesMap.get(location.user_id || '');
      
      // Determine location type
      let locationType = '';
      if (location.certification === 'Atlas Obscura') locationType = 'Atlas Obscura';
      else if (location.certification?.toLowerCase().includes('mountain')) locationType = 'Mountain';

      // Create info window with current SIQS
      const infoWindow = new (window as any).AMap.InfoWindow({
        content: createAMapPopupContent({
          location,
          siqsScore: currentSiqs,
          siqsLoading: false,
          displayName: location.name,
          isCertified,
          onViewDetails: () => {},
          userId: location.user_id,
          isMobile,
          userAvatarUrl: userProfile?.avatar_url,
          distance: location.distance,
          locationType,
        }),
        offset: new (window as any).AMap.Pixel(0, -markerIcon.size[1] / 2),
      });

      marker.on('click', () => {
        infoWindow.open(mapInstance.current, marker.getPosition());
      });

      mapInstance.current.add(marker);
      markersRef.current.set(location.id, marker);
      infoWindowsRef.current.set(location.id, infoWindow);
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
  }, [locations, activeView, hoveredLocationId, isMobile, realTimeSiqsMap, userProfilesMap]);

  // Update marker appearance when hovered
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
      {/* Real-time SIQS providers for each location */}
      {userLocation && (
        <RealTimeSiqsProvider
          isVisible={true}
          latitude={userLocation.latitude}
          longitude={userLocation.longitude}
          bortleScale={4}
          onSiqsCalculated={() => {}}
        />
      )}
      
      {locations.map((location) => {
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        const shouldShow = shouldShowLocationMarker(location, isCertified, activeView);
        
        if (!shouldShow) return null;
        
        return (
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
        );
      })}
      
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default AMapContainer;
