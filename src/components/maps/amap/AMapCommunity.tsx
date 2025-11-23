import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useUserGeolocation } from '@/hooks/community/useUserGeolocation';
import { createAMapMarkerIcon, createAMapPopupContent } from './AMapMarkerUtils';
import { getSiqsScore } from '@/utils/siqsHelpers';
import RealTimeSiqsProvider from '@/components/photoPoints/cards/RealTimeSiqsProvider';
import CreateAstroSpotDialog from '@/components/astro-spots/CreateAstroSpotDialog';
import { useAuth } from '@/contexts/AuthContext';
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
  const [userProfilesMap, setUserProfilesMap] = useState<Map<string, { avatar_url?: string; username?: string }>>(new Map());
  const [createSpotDialogOpen, setCreateSpotDialogOpen] = useState(false);
  const [createSpotLocation, setCreateSpotLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);

  // Setup global callback for popup details
  useEffect(() => {
    (window as any).viewAMapSpotDetails = (spotId: string) => {
      const location = locations.find(loc => loc.id === spotId);
      if (location && onMarkerClick) {
        onMarkerClick(location);
      }
    };
    
    // Setup create spot handler
    (window as any).openAMapCreateSpotDialog = async (lat: number, lng: number) => {
      try {
        const { getEnhancedLocationDetails } = await import('@/services/geocoding/enhancedReverseGeocoding');
        const details = await getEnhancedLocationDetails(lat, lng, 'en');
        const locationName = details.formattedName || 'My Spot';
        setCreateSpotLocation({ lat, lng, name: locationName });
        setCreateSpotDialogOpen(true);
      } catch (error) {
        console.error('Error fetching location:', error);
        setCreateSpotLocation({ lat, lng, name: 'My Spot' });
        setCreateSpotDialogOpen(true);
      }
    };
    
    return () => {
      delete (window as any).viewAMapSpotDetails;
      delete (window as any).openAMapCreateSpotDialog;
    };
  }, [locations, onMarkerClick]);

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
        chineseLocationName: '', // Will be updated by geocoder if needed
      }));
    }
  }, [locations, userProfilesMap, isMobile]);

  // Handler for user location SIQS
  const handleUserLocationSiqs = useCallback((siqs: number | null) => {
    if (siqs !== null) {
      handleSiqsUpdate('user-location', siqs);
    }
  }, [handleSiqsUpdate]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new (window as any).AMap.Map(mapContainer.current, {
      center: [center[1], center[0]],
      zoom: zoom,
      mapStyle: 'amap://styles/whitesmoke',
      showLabel: true,
      showIndoorMap: false,
    });

    mapInstance.current = map;

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

  // Add user location marker with popup
  useEffect(() => {
    if (!mapInstance.current || !userPosition) return;

    if (userMarkerRef.current && mapInstance.current) {
      mapInstance.current.remove(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    // Red marker icon for user location
    const marker = new (window as any).AMap.Marker({
      position: [userPosition[1], userPosition[0]], // [lng, lat]
      icon: new (window as any).AMap.Icon({
        size: new (window as any).AMap.Size(32, 42),
        image: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
            <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26c0-8.8-7.2-16-16-16z" fill="#e11d48"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
          </svg>
        `),
        imageSize: new (window as any).AMap.Size(32, 42),
      }),
      title: 'Your Location',
      draggable: !!onLocationUpdate,
      anchor: 'bottom-center',
      zIndex: 200,
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

    // Setup location details handler
    (window as any).viewUserLocationDetails = () => {
      const url = `/location/${userPosition[0].toFixed(6)},${userPosition[1].toFixed(6)}`;
      // Use direct navigation without waiting for async operations
      window.location.href = url;
    };

    // Create and setup popup immediately
    const currentSiqs = realTimeSiqsMap.get('user-location') || 0;

    const createPopupContent = (locationName: string, chineseLocationName?: string) => {
      const chineseNameHtml = chineseLocationName ? `<div style="font-size: 12px; color: #cbd5e1; margin-bottom: 6px;">
        ${chineseLocationName}
      </div>` : '';
      
      return `
        <div style="
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
          border-left: 4px solid #e11d48;
          border-radius: 8px;
          padding: 12px;
          min-width: 200px;
          max-width: 280px;
          color: white;
        ">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #f1f5f9; display: flex; align-items: center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#e11d48" stroke="#e11d48" stroke-width="2" style="margin-right: 6px;">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            您的位置 / Your Location
          </div>
          
          <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 8px;">
            ${locationName}
          </div>
          
          ${chineseNameHtml}
          
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 12px;">
            ${userPosition[0].toFixed(4)}, ${userPosition[1].toFixed(4)}
          </div>
          
          ${currentSiqs > 0 ? `
          <div style="margin-bottom: 12px;">
            <span style="color: ${currentSiqs >= 7.5 ? '#10b981' : currentSiqs >= 5.5 ? '#f59e0b' : '#ef4444'}; font-weight: 600; font-size: 16px;">
              SIQS: ${currentSiqs.toFixed(1)}
            </span>
          </div>
          ` : ''}
          
          <button 
            onclick="viewUserLocationDetails()" 
            style="
              width: 100%;
              padding: 8px 12px;
              background: rgba(59, 130, 246, 0.2);
              color: #dbeafe;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 500;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            "
            onmouseover="this.style.background='rgba(59, 130, 246, 0.3)'"
            onmouseout="this.style.background='rgba(59, 130, 246, 0.2)'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            查看详情 / View Details
          </button>
          
          <button 
            onclick="window.openAMapCreateSpotDialog(${userPosition[0]}, ${userPosition[1]})" 
            style="
              width: 100%;
              padding: 10px 12px;
              background: linear-gradient(135deg, rgba(155, 135, 245, 0.3), rgba(147, 51, 234, 0.3));
              color: #ddd6fe;
              border: 1px solid rgba(155, 135, 245, 0.4);
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: center;
            "
            onmouseover="this.style.background='linear-gradient(135deg, rgba(155, 135, 245, 0.4), rgba(147, 51, 234, 0.4))'"
            onmouseout="this.style.background='linear-gradient(135deg, rgba(155, 135, 245, 0.3), rgba(147, 51, 234, 0.3))'"
          >
            创建我的观星点 / Create My Spot
          </button>
        </div>
      `;
    };

    // Create info window with initial content
    const infoWindow = new (window as any).AMap.InfoWindow({
      content: createPopupContent('Loading...'),
      offset: new (window as any).AMap.Pixel(0, -42),
      closeWhenClickMap: true,
    });

    // Add click event to marker
    marker.on('click', () => {
      console.log('User location marker clicked');
      infoWindow.open(mapInstance.current, marker.getPosition());
    });

    // Fetch location name and update popup
    const fetchLocationName = async () => {
      try {
        const { getEnhancedLocationDetails } = await import('@/services/geocoding/enhancedReverseGeocoding');
        const details = await getEnhancedLocationDetails(userPosition[0], userPosition[1], 'en');
        const locationName = details.formattedName || 'Your Location';
        
        // Use AMap Geocoder to get Chinese location name
        const geocoder = new (window as any).AMap.Geocoder({ city: '全国', radius: 1000 });
        geocoder.getAddress([userPosition[1], userPosition[0]], (status: string, result: any) => {
          if (status === 'complete' && result.regeocode) {
            const chineseLocationName = result.regeocode.formattedAddress;
            infoWindow.setContent(createPopupContent(locationName, chineseLocationName));
          } else {
            infoWindow.setContent(createPopupContent(locationName));
          }
        });
      } catch (error) {
        console.error('Error fetching location name:', error);
        infoWindow.setContent(createPopupContent('Your Location'));
      }
    };

    fetchLocationName();

    return () => {
      delete (window as any).viewUserLocationDetails;
      if (userMarkerRef.current && mapInstance.current) {
        mapInstance.current.remove(userMarkerRef.current);
        userMarkerRef.current = null;
      }
    };
  }, [userPosition, onLocationUpdate, realTimeSiqsMap]);

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

      // Get user profile for avatar
      const userProfile = userProfilesMap.get(spot.user_id || '');

      // Fetch Chinese location name using AMap Geocoder
      let chineseLocationName = '';

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
          userAvatarUrl: userProfile?.avatar_url,
          distance: spot.distance,
          chineseLocationName,
        }),
        offset: new (window as any).AMap.Pixel(0, -markerIcon.size[1] / 2),
      });

      // Fetch Chinese name using AMap Geocoder
      const geocoder = new (window as any).AMap.Geocoder({ city: '全国', radius: 1000 });
      geocoder.getAddress([spot.longitude, spot.latitude], (status: string, result: any) => {
        if (status === 'complete' && result.regeocode) {
          chineseLocationName = result.regeocode.formattedAddress;
          // Update info window with Chinese name
          infoWindow.setContent(createAMapPopupContent({
            location: spot,
            siqsScore: currentSiqs,
            siqsLoading: false,
            displayName: spot.name,
            isCertified,
            onViewDetails: () => {},
            userId: spot.user_id,
            isMobile,
            userAvatarUrl: userProfile?.avatar_url,
            distance: spot.distance,
            chineseLocationName,
          }));
        }
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
  }, [locations, hoveredLocationId, isMobile, realTimeSiqsMap, userProfilesMap]);

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
      {/* Real-time SIQS provider for user location */}
      {userPosition && (
        <RealTimeSiqsProvider
          key="user-location"
          isVisible={true}
          latitude={userPosition[0]}
          longitude={userPosition[1]}
          bortleScale={4}
          onSiqsCalculated={(siqs) => {
            if (siqs !== null) {
              handleUserLocationSiqs(siqs);
            }
          }}
        />
      )}
      
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
      
      {/* Create Spot Dialog */}
      {createSpotDialogOpen && createSpotLocation && (
        <CreateAstroSpotDialog
          latitude={createSpotLocation.lat}
          longitude={createSpotLocation.lng}
          defaultName={createSpotLocation.name}
          onClose={() => {
            setCreateSpotDialogOpen(false);
            setCreateSpotLocation(null);
          }}
        />
      )}
    </div>
  );
};

export default AMapCommunity;
